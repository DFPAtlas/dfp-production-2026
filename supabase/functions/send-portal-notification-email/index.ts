import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") || "digital-footprint.uk";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const resend = new Resend(RESEND_API_KEY);

interface EmailPayload {
  to_user_id?: string;
  to_email?: string;
  to_name?: string;
  subject: string;
  html: string;
  idempotency_key: string;
  event_type: string;
  related_entity_id?: string;
}

serve(async (req) => {
  try {
    const payload: EmailPayload = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!payload.idempotency_key) {
      return new Response(JSON.stringify({ success: false, error: "idempotency_key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await supabase
      .from("notification_deliveries")
      .select("id, state, provider_id")
      .eq("idempotency_key", payload.idempotency_key)
      .maybeSingle();

    if (existing && existing.state === "confirmed") {
      return new Response(JSON.stringify({ success: true, dedup: true, delivery_id: existing.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let recipientEmail = payload.to_email;
    let recipientName = payload.to_name || "Client";

    if (!recipientEmail && payload.to_user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", payload.to_user_id)
        .maybeSingle();

      if (profile) {
        recipientEmail = profile.email;
        recipientName = profile.full_name || recipientName;
      }

      if (!recipientEmail) {
        const { data: user } = await supabase.auth.admin.getUserById(payload.to_user_id);
        if (user?.user?.email) {
          recipientEmail = user.user.email;
        }
      }
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ success: false, error: "No recipient email found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deliveryInsert = {
      idempotency_key: payload.idempotency_key,
      channel: "email",
      state: "pending",
      recipient: recipientEmail,
      recipient_user_id: payload.to_user_id || null,
      event_type: payload.event_type,
      related_entity_id: payload.related_entity_id || null,
      subject: payload.subject,
      requested_at: new Date().toISOString(),
    };

    const { data: delivery } = existing
      ? { data: existing }
      : await supabase.from("notification_deliveries").insert(deliveryInsert).select("id").single();

    const fromAddress = `Digital Footprint <noreply@${RESEND_FROM_DOMAIN}>`;

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      subject: payload.subject,
      html: payload.html,
    });

    if (resendError) {
      await supabase.from("notification_deliveries")
        .update({
          state: "failed",
          error_message: resendError.message,
          completed_at: new Date().toISOString(),
          attempts: (existing?.attempts || 0) + 1,
        })
        .eq("id", delivery?.id || existing?.id);

      return new Response(JSON.stringify({ success: false, error: resendError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await supabase.from("notification_deliveries")
      .update({
        state: "confirmed",
        provider_id: resendData?.id || null,
        completed_at: new Date().toISOString(),
        attempts: (existing?.attempts || 0) + 1,
      })
      .eq("id", delivery?.id || existing?.id);

    return new Response(JSON.stringify({ success: true, id: resendData?.id, delivery_id: delivery?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
