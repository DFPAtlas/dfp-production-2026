import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET_NAMES = {
  monitoringSecret: "UAT_MONITORING_SECRET",
};

const SENSITIVE_PARAMS = new Set([
  "token", "access_token", "refresh_token", "code", "secret", "password",
  "key", "session", "invite", "signature", "email", "phone",
  "payment_intent", "client_secret",
]);

const VALID_EVENT_TYPES = new Set([
  "session_started", "session_resumed", "session_paused", "session_finished",
  "heartbeat", "page_view", "route_change", "page_hidden", "page_visible",
  "javascript_error", "unhandled_rejection", "api_failure", "api_slow",
  "performance", "tester_checkpoint", "monitoring_started", "monitoring_stopped",
]);

const FORBIDDEN_METADATA_KEYS = new Set([
  "request_body", "response_body", "headers", "cookies", "authorization",
  "auth", "form_values", "form_data", "token", "password", "secret",
  "storage", "local_storage", "session_storage", "clipboard",
]);

const MAX_BATCH_SIZE = 50;
const MAX_PAYLOAD_BYTES = 256 * 1024;

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
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
    return payload;
  } catch { return null; }
}

function sanitizeUrl(raw: string, extraMaskedParams: string[] = []): { url: string | null; path: string | null } {
  if (!raw || typeof raw !== "string") return { url: null, path: null };
  try {
    let u = new URL(raw);
    const allMasked = [...SENSITIVE_PARAMS, ...extraMaskedParams];
    for (const key of allMasked) {
      if (u.searchParams.has(key)) {
        u.searchParams.set(key, "[REDACTED]");
      }
    }
    u.username = "";
    u.password = "";
    u.hash = "";
    return { url: u.toString(), path: u.pathname + (u.search || "") };
  } catch {
    let safe = raw;
    try { safe = raw.replace(/token=[^&\s]+/gi, "token=[REDACTED]"); } catch { /* ignore */ }
    return { url: safe, path: safe };
  }
}

function sanitizeMessage(msg: unknown): string | null {
  if (!msg || typeof msg !== "string") return null;
  let s = msg;
  s = s.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
  s = s.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
  s = s.replace(/[A-Za-z0-9_-]{32,}/g, "[TOKEN]");
  s = s.replace(/(?:sk|pk|api[_-]?key)[=:]\s*\S+/gi, "$1=[REDACTED]");
  s = s.replace(/password[=:]\s*\S+/gi, "password=[REDACTED]");
  return s.substring(0, 2000);
}

function sanitizeMetadata(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const obj = meta as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (FORBIDDEN_METADATA_KEYS.has(lower)) continue;
    if (typeof v === "string" && v.length > 4000) continue;
    if (typeof v === "string") {
      cleaned[k] = sanitizeMessage(v) || "" as string;
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

function generateEventHash(event: Record<string, unknown>): string | null {
  const type = event.event_type;
  if (!["javascript_error", "unhandled_rejection"].includes(type as string)) return null;
  const msg = (event.message || "") as string;
  const file = (event.source_file || "") as string;
  const line = event.source_line || 0;
  const simple = `${type}|${msg.substring(0, 200)}|${file}|${line}`;
  let hash = 0;
  for (let i = 0; i < simple.length; i++) {
    const ch = simple.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return `evt_${Math.abs(hash).toString(36)}`;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
    }

    const origin = req.headers.get("Origin") || "";

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Missing monitoring token" }), { status: 401 });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const monitoringSecret = getEnv(SECRET_NAMES.monitoringSecret);

    const tokenPayload = await verifyToken(token, monitoringSecret);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or expired monitoring token" }), { status: 401 });
    }

    if (tokenPayload.allowed_origin && origin && tokenPayload.allowed_origin !== origin) {
      return new Response(JSON.stringify({ success: false, message: "Origin not allowed" }), { status: 403 });
    }

    const sessionId = tokenPayload.session_id as string;
    const assignmentId = tokenPayload.assignment_id as string;
    const projectId = tokenPayload.project_id as string;
    const environmentId = (tokenPayload.environment_id || null) as string | null;
    const testerId = tokenPayload.tester_id as string;

    const client = createClient(supabaseUrl, supabaseKey);

    // Verify session is still active
    const { data: session } = await client
      .from("uat_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .maybeSingle();
    if (!session || ((session as any).status !== "active" && (session as any).status !== "paused")) {
      return new Response(JSON.stringify({ success: false, message: "Session is not active" }), { status: 403 });
    }
    if ((session as any).status === "paused") {
      return new Response(JSON.stringify({ success: false, message: "Session is paused. Event ingestion paused." }), { status: 423 });
    }

    // Verify assignment is still valid
    const { data: assignment } = await client
      .from("uat_assignments")
      .select("status, access_expires_at")
      .eq("id", assignmentId)
      .maybeSingle();
    if (!assignment) {
      return new Response(JSON.stringify({ success: false, message: "Assignment not found" }), { status: 404 });
    }
    const now = new Date().toISOString();
    if ((assignment as any).access_expires_at && now > (assignment as any).access_expires_at) {
      return new Response(JSON.stringify({ success: false, message: "Assignment has expired" }), { status: 403 });
    }

    // Parse body
    const bodyText = await req.text();
    if (bodyText.length > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ success: false, message: "Payload too large" }), { status: 413 });
    }

    let events: unknown[];
    try { events = JSON.parse(bodyText); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400 });
    }

    if (!Array.isArray(events)) {
      return new Response(JSON.stringify({ success: false, message: "Expected array of events" }), { status: 400 });
    }

    if (events.length > MAX_BATCH_SIZE) {
      return new Response(JSON.stringify({ success: false, message: `Maximum ${MAX_BATCH_SIZE} events per batch` }), { status: 400 });
    }

    // Get monitoring settings for masked params
    const { data: settings } = await client
      .from("uat_monitoring_settings")
      .select("masked_url_parameters, blocked_url_patterns")
      .eq("project_id", projectId)
      .maybeSingle();

    const extraMaskedParams: string[] = (settings as any)?.masked_url_parameters || [];
    const blockedPatterns: string[] = (settings as any)?.blocked_url_patterns || [];

    const rows: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const evt = events[i] as Record<string, unknown> | null | undefined;
      if (!evt || typeof evt !== "object") {
        errors.push(`Event ${i}: invalid event object`);
        continue;
      }

      const eventType = evt.event_type;
      if (!eventType || typeof eventType !== "string" || !VALID_EVENT_TYPES.has(eventType)) {
        errors.push(`Event ${i}: invalid or unknown event_type`);
        continue;
      }

      // Check blocked URL patterns
      const pageUrl = evt.page_url;
      if (pageUrl && typeof pageUrl === "string") {
        const blocked = blockedPatterns.some((p: string) => pageUrl.includes(p));
        if (blocked) {
          errors.push(`Event ${i}: URL matches blocked pattern, skipped`);
          continue;
        }
      }

      const { url: safeUrl, path: safePath } = sanitizeUrl(
        (evt.page_url || "") as string, extraMaskedParams
      );

      const sanitizedMeta = sanitizeMetadata(evt.safe_metadata);

      const row: Record<string, unknown> = {
        project_id: projectId,
        environment_id: environmentId,
        assignment_id: assignmentId,
        session_id: sessionId,
        tester_id: testerId,
        assignment_test_case_id: evt.assignment_test_case_id || null,
        event_type: eventType,
        event_timestamp: evt.event_timestamp || now,
        page_url: safeUrl,
        page_path: safePath,
        page_title: typeof evt.page_title === "string" ? evt.page_title.substring(0, 500) : null,
        event_name: typeof evt.event_name === "string" ? evt.event_name.substring(0, 255) : null,
        severity: evt.severity || null,
        message: sanitizeMessage(evt.message),
        source_file: typeof evt.source_file === "string" ? evt.source_file.substring(0, 1000) : null,
        source_line: typeof evt.source_line === "number" ? evt.source_line : null,
        source_column: typeof evt.source_column === "number" ? evt.source_column : null,
        request_method: evt.request_method || null,
        request_path: ((evt.request_path as string) || "").substring(0, 1000),
        response_status: evt.response_status || null,
        duration_ms: evt.duration_ms || null,
        performance_data: evt.performance_data || null,
        safe_metadata: sanitizedMeta,
        event_hash: generateEventHash({ ...evt, message: sanitizeMessage(evt.message) }),
      };

      rows.push(row);
    }

    let inserted = 0;
    if (rows.length > 0) {
      const { error: insertErr } = await client.from("uat_session_events").insert(rows);
      if (insertErr) {
        return new Response(JSON.stringify({
          success: false, message: `Insert failed: ${insertErr.message}`, accepted: 0, rejected: rows.length, errors: [insertErr.message],
        }), { status: 500 });
      }
      inserted = rows.length;
    }

    const responsePayload = {
      success: true,
      accepted: inserted,
      rejected: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(responsePayload), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
