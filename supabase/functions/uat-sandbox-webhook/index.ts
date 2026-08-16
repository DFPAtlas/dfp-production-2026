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

function sanitizeWebhookPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  const forbiddenKeys = new Set([
    "authorization", "auth", "token", "api_key", "secret", "password",
    "cookie", "session", "cookie_header", "x-api-key", "x-auth-token",
    "stripe_signature", "webhook_secret", "private_key", "client_secret",
  ]);
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (forbiddenKeys.has(lower)) continue;
    if (typeof v === "string" && v.length > 4000) continue;
    if (typeof v === "string") cleaned[k] = v;
    else if (typeof v === "number" || typeof v === "boolean" || v === null) cleaned[k] = v;
  }
  return cleaned;
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
    const { event_name, http_method, destination_url, safe_summary, provider_name } = body;

    if (!event_name || typeof event_name !== "string") {
      return new Response(JSON.stringify({ success: false, message: "event_name is required" }), { status: 400 });
    }

    const { data: settings } = await client
      .from("uat_sandbox_communication_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!settings || !(settings as any).webhook_interception_enabled) {
      return new Response(JSON.stringify({ success: false, message: "Webhook interception not enabled" }), { status: 403 });
    }

    let status = "intercepted";
    const deliverySimulation = (settings as any).delivery_simulation_mode || "intercept_only";
    if (deliverySimulation === "simulate_delivered") status = "simulated_delivered";
    if (deliverySimulation === "simulate_failed") status = "simulated_failed";

    const safePayload = sanitizeWebhookPayload(safe_summary);

    const { data: messageRow, error: msgErr } = await client
      .from("uat_sandbox_messages")
      .insert({
        project_id: projectId,
        sandbox_instance_id: sandboxInstanceId,
        assignment_id: tokenPayload.assignment_id as string,
        session_id: tokenPayload.session_id as string || null,
        tester_id: tokenPayload.tester_id as string,
        message_type: "webhook",
        direction: "outbound",
        provider_name: (provider_name as string) || null,
        recipient_address: (destination_url as string) || null,
        subject: (event_name as string),
        safe_preview: JSON.stringify(safePayload).substring(0, 500),
        content_text: JSON.stringify(safePayload).substring(0, 4000),
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
      safe_metadata: {
        method: (http_method as string) || "POST",
        destination: (destination_url as string) || null,
        event_name: (event_name as string),
        payload_keys: Object.keys(safePayload),
      },
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
