import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET")!;

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

const EVENT_TYPE_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    id: string;
    object: string;
    to: string[];
    from: string;
    subject: string;
    created_at: string;
    email_id?: string;
    open_tracking_pixel?: string;
    click_tracking_link?: string;
    link?: { url: string; description?: string };
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifySvixSignature(rawBody: string, headers: Headers): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) return false;

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const timestamp = Number(svixTimestamp);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp * 1000) > TIMESTAMP_TOLERANCE_MS) {
    return false;
  }

  try {
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const encoder = new TextEncoder();

    const secretKey = RESEND_WEBHOOK_SECRET.startsWith("whsec_")
      ? RESEND_WEBHOOK_SECRET.slice(6)
      : RESEND_WEBHOOK_SECRET;

    const secretBytes = base64ToBytes(secretKey);

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatures = svixSignature.split(" ");
    for (const sig of signatures) {
      const parts = sig.split(",");
      const sigValue = parts.find((p) => p.startsWith("v1="))?.slice(3);
      if (!sigValue) continue;
      const decoded = base64ToBytes(sigValue);

      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        decoded,
        encoder.encode(signedContent),
      );
      if (valid) return true;
    }
    return false;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_WEBHOOK_SECRET) {
    console.error("resend-webhook missing required secrets");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signatureValid = await verifySvixSignature(rawBody, req.headers);

  if (!signatureValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: ResendWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body || !body.type || !body.data) {
    return Response.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  const allowedTypes = new Set(Object.keys(EVENT_TYPE_MAP));
  if (!allowedTypes.has(body.type)) {
    return Response.json({ received: true, reason: "unsupported_event_type" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const providerEventId = body.data.id;
    const providerMessageId = body.data.email_id || body.data.id;
    const mappedEventType = EVENT_TYPE_MAP[body.type] || body.type.replace("email.", "");
    const eventTime = body.created_at || body.data.created_at;

    const { data: existing } = await supabase
      .from("email_delivery_events")
      .select("id")
      .eq("provider_event_id", providerEventId)
      .eq("provider", "resend")
      .maybeSingle();

    if (existing) {
      return Response.json({ ok: true, reason: "duplicate" });
    }

    const { data: existingRecipient } = await supabase
      .from("email_recipient_messages")
      .select("id, organisation_id, source_type, source_id, current_status, masked_recipient")
      .eq("provider_message_id", providerMessageId)
      .maybeSingle();

    const organisationId = existingRecipient?.organisation_id || null;

    const { data: deliveryEvent, error: eventErr } = await supabase
      .from("email_delivery_events")
      .insert({
        organisation_id: organisationId,
        provider: "resend",
        provider_event_id: providerEventId,
        provider_message_id: providerMessageId,
        campaign_id: existingRecipient?.source_type === "campaign" ? existingRecipient.source_id : null,
        automation_id: existingRecipient?.source_type === "automation" ? existingRecipient.source_id : null,
        recipient_message_id: existingRecipient?.id || null,
        event_type: mappedEventType,
        event_time: eventTime,
        safe_metadata: { raw_type: body.type },
      })
      .select("id")
      .single();

    if (eventErr) {
      console.error("Failed to insert delivery event:", eventErr.message);
    }

    if (existingRecipient) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      const currentStatus = existingRecipient.current_status;

      if (mappedEventType === "delivered") {
        updates.current_status = currentStatus === "opened" || currentStatus === "clicked" ? currentStatus : "delivered";
        updates.delivered_at = eventTime;
      } else if (mappedEventType === "opened") {
        updates.current_status = currentStatus === "clicked" ? currentStatus : "opened";
        if (!existingRecipient.first_opened_at) updates.first_opened_at = eventTime;
      } else if (mappedEventType === "clicked") {
        updates.current_status = "clicked";
        if (!existingRecipient.first_clicked_at) updates.first_clicked_at = eventTime;
      } else if (mappedEventType === "bounced") {
        updates.current_status = "bounced";
        updates.bounce_type = "hard";
      } else if (mappedEventType === "complained") {
        updates.current_status = "complained";
        updates.complaint_at = eventTime;
      } else if (mappedEventType === "delayed") {
        updates.current_status = currentStatus === "delivered" || currentStatus === "opened" || currentStatus === "clicked" ? currentStatus : "delayed";
      } else if (mappedEventType === "sent") {
        updates.current_status = currentStatus === "delivered" || currentStatus === "opened" || currentStatus === "clicked" ? currentStatus : "sent";
      }

      await supabase.from("email_recipient_messages").update(updates).eq("id", existingRecipient.id);

      if (mappedEventType === "bounced" && existingRecipient.masked_recipient) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(existingRecipient.masked_recipient.toLowerCase()));
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
        await supabase.from("email_suppressions").upsert({
          organisation_id: organisationId,
          normalised_email_hash: hashHex,
          masked_email: existingRecipient.masked_recipient,
          reason: "hard_bounce",
          scope: "global",
          source_type: existingRecipient.source_type,
          source_reference: existingRecipient.source_id,
          is_permanent: true,
        }, { onConflict: "normalised_email_hash", ignoreDuplicates: false });
      }

      if (mappedEventType === "complained" && existingRecipient.masked_recipient) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(existingRecipient.masked_recipient.toLowerCase()));
        const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
        await supabase.from("email_suppressions").upsert({
          organisation_id: organisationId,
          normalised_email_hash: hashHex,
          masked_email: existingRecipient.masked_recipient,
          reason: "complaint",
          scope: "global",
          source_type: existingRecipient.source_type,
          source_reference: existingRecipient.source_id,
          is_permanent: true,
        }, { onConflict: "normalised_email_hash", ignoreDuplicates: false });
      }

      if (mappedEventType === "clicked" && body.data.link) {
        const linkUrl = body.data.link.url || "";
        const domain = (() => { try { return new URL(linkUrl).hostname; } catch { return linkUrl; } })();
        await supabase.from("email_link_clicks").insert({
          organisation_id: organisationId,
          recipient_message_id: existingRecipient.id,
          campaign_id: existingRecipient.source_type === "campaign" ? existingRecipient.source_id : null,
          automation_id: existingRecipient.source_type === "automation" ? existingRecipient.source_id : null,
          link_url: linkUrl,
          link_label: body.data.link.description || null,
          destination_domain: domain,
          clicked_at: eventTime,
        });
      }
    }

    return Response.json({ ok: true, event: deliveryEvent?.id || null });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err instanceof Error ? err.message : "Unknown");
    return Response.json({ error: "Processing error" }, { status: 500 });
  }
});
