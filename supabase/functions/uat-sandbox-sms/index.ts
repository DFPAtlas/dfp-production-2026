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

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const { sender, recipient, content_text, provider_name } = body;

    if (!recipient || typeof recipient !== "string") {
      return new Response(JSON.stringify({ success: false, message: "recipient is required" }), { status: 400 });
    }

    const { data: settings } = await client
      .from("uat_sandbox_communication_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!settings || !(settings as any).sms_interception_enabled) {
      return new Response(JSON.stringify({ success: false, message: "SMS interception not enabled" }), { status: 403 });
    }

    if ((content_text as string || "").length > 1600) {
      return new Response(JSON.stringify({ success: false, message: "SMS content too long" }), { status: 413 });
    }

    let status = "intercepted";
    const deliverySimulation = (settings as any).delivery_simulation_mode || "intercept_only";
    if (deliverySimulation === "simulate_delivered") status = "simulated_delivered";
    if (deliverySimulation === "simulate_failed") status = "simulated_failed";

    const safeRecipient = (recipient as string).substring(0, 4) + "****";

    const { data: messageRow, error: msgErr } = await client
      .from("uat_sandbox_messages")
      .insert({
        project_id: projectId,
        sandbox_instance_id: sandboxInstanceId,
        assignment_id: tokenPayload.assignment_id as string,
        session_id: tokenPayload.session_id as string || null,
        tester_id: tokenPayload.tester_id as string,
        message_type: "sms",
        direction: "outbound",
        provider_name: (provider_name as string) || null,
        sender_address: (sender as string) || null,
        recipient_address: safeRecipient,
        recipient_display: recipient,
        subject: "SMS",
        safe_preview: ((content_text as string) || "").substring(0, 200),
        content_text: (content_text as string) || null,
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

    await client.from("uat_sandbox_message_events").insert({
      message_id: (messageRow as any).id,
      event_type: "captured",
      safe_metadata: { type: "sms", size: (content_text as string || "").length },
    });

    return new Response(JSON.stringify({
      success: true,
      intercepted: true,
      message_id: (messageRow as any).id,
      status: (messageRow as any).status,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
