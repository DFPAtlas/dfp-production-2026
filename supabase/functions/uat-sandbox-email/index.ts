import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function verifyAdapterToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const enc = new TextEncoder();
    const signingInput = parts.slice(0, 2).join(".");
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(signingInput));

    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sandbox_instance_id || !payload.project_id) return null;
    return payload;
  } catch { return null; }
}

function maskRecipient(email: string): string {
  return email.replace(/^([^@]{2})[^@]*(@.*)$/, "$1***$2");
}

function sanitizeHtmlPreview(text: string): string {
  if (!text) return "";
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<object[^>]*>.*?<\/object>/gi, "")
    .replace(/<embed[^>]*>.*?<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .substring(0, 500);
}

function isAllowedAttachment(filename: string, mimeType: string): { allowed: boolean; reason?: string } {
  const lowerName = filename.toLowerCase();
  const blockedExts = [".exe", ".bat", ".cmd", ".sh", ".php", ".jsp", ".asp", ".aspx", ".jar", ".msi", ".dll", ".scr", ".com", ".html", ".htm", ".svg", ".zip", ".rar", ".7z", ".tar", ".gz", ".docm", ".xlsm", ".pptm"];
  if (blockedExts.some((ext) => lowerName.endsWith(ext))) {
    return { allowed: false, reason: "Blocked file type" };
  }
  const blockedMimes = [
    "application/x-msdownload", "application/x-sh", "text/html", "image/svg+xml",
    "application/zip", "application/x-rar", "application/x-7z-compressed",
    "application/x-tar", "application/gzip", "application/vnd.ms-word.document.macroEnabled.12",
    "application/vnd.ms-excel.sheet.macroEnabled.12", "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  ];
  if (blockedMimes.some((m) => mimeType.toLowerCase().startsWith(m))) {
    return { allowed: false, reason: "Blocked MIME type" };
  }
  return { allowed: true };
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const adapterSecret = Deno.env.get("UAT_PROJECT_ADAPTER_SECRET") || "dfp-uat-adapter-secret";

    const authHeader = req.headers.get("X-Sandbox-Adapter-Token") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Missing adapter token" }), { status: 401 });
    }

    const tokenPayload = await verifyAdapterToken(token, adapterSecret);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ success: false, message: "Invalid adapter token" }), { status: 401 });
    }

    const sandboxInstanceId = tokenPayload.sandbox_instance_id as string;
    const projectId = tokenPayload.project_id as string;

    const client = createClient(supabaseUrl, supabaseKey);

    const bodyText = await req.text();
    let body: Record<string, unknown>;
    try { body = JSON.parse(bodyText); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400 });
    }

    const {
      sender, recipient, subject, content_text,
      content_html, template_reference, provider_name, provider_reference,
    } = body;

    if (!recipient || typeof recipient !== "string") {
      return new Response(JSON.stringify({ success: false, message: "recipient is required" }), { status: 400 });
    }

    // Check communication settings
    const { data: settings } = await client
      .from("uat_sandbox_communication_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!settings || !(settings as any).email_interception_enabled) {
      return new Response(JSON.stringify({ success: false, message: "Email interception not enabled" }), { status: 403 });
    }

    const maxSize = (settings as any).maximum_message_size_bytes || 1048576;
    if (bodyText.length > maxSize) {
      return new Response(JSON.stringify({ success: false, message: "Message too large" }), { status: 413 });
    }

    // Check blocked recipients
    const blockUnapproved = (settings as any).block_unapproved_recipients !== false;
    let status = "intercepted";
    let deliverySimulation = (settings as any).delivery_simulation_mode || "intercept_only";

    if (blockUnapproved) {
      const allowedDomains = (settings as any).allowed_email_domains || [];
      const recipientDomain = recipient.split("@")[1]?.toLowerCase();
      const defaultDomains = ["dfp-test.local", "example.test", "digital-footprint.uk", "dfp.test"];
      const allAllowed = [...defaultDomains, ...allowedDomains];
      if (!allAllowed.includes(recipientDomain)) {
        status = "blocked";
      }
    }

    if (deliverySimulation === "simulate_delivered" && status !== "blocked") status = "simulated_delivered";
    if (deliverySimulation === "simulate_failed" && status !== "blocked") status = "simulated_failed";

    const safePreview = sanitizeHtmlPreview((content_text || subject || "") as string);
    const safeRecipient = maskRecipient(recipient);

    // Insert message
    const { data: messageRow, error: msgErr } = await client
      .from("uat_sandbox_messages")
      .insert({
        project_id: projectId,
        sandbox_instance_id: sandboxInstanceId,
        assignment_id: tokenPayload.assignment_id as string,
        session_id: tokenPayload.session_id as string || null,
        tester_id: tokenPayload.tester_id as string,
        message_type: "email",
        direction: "outbound",
        provider_name: (provider_name as string) || null,
        provider_message_reference: (provider_reference as string) || null,
        sender_address: (sender as string) || null,
        recipient_address: safeRecipient,
        recipient_display: recipient,
        subject: (subject as string) || null,
        safe_preview: safePreview,
        content_text: (content_text as string) || null,
        content_html_reference: (content_html as string) || null,
        template_reference: (template_reference as string) || null,
        status,
        delivery_simulation: deliverySimulation,
        intercepted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + ((settings as any).retention_days || 90) * 86400000).toISOString(),
      })
      .select("id, status")
      .single();

    if (msgErr || !messageRow) {
      return new Response(JSON.stringify({ success: false, message: msgErr?.message || "Insert failed" }), { status: 500 });
    }

    // Insert event
    await client.from("uat_sandbox_message_events").insert({
      message_id: (messageRow as any).id,
      event_type: status === "blocked" ? "blocked" : "captured",
      safe_metadata: { size: bodyText.length, recipient_domain: recipient.split("@")[1] },
    });

    // Handle attachments if any
    const attachments = body.attachments;
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        const attCheck = isAllowedAttachment((att as any).filename || "", (att as any).mime_type || "");
        if (!attCheck.allowed) continue;

        await client.from("uat_sandbox_message_attachments").insert({
          message_id: (messageRow as any).id,
          original_filename: (att as any).filename,
          safe_filename: `safe_${(att as any).filename}`,
          mime_type: (att as any).mime_type,
          file_size_bytes: (att as any).size || 0,
          storage_path: (att as any).storage_path || "",
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      intercepted: true,
      message_id: (messageRow as any).id,
      status: (messageRow as any).status,
      simulated: deliverySimulation !== "intercept_only",
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
