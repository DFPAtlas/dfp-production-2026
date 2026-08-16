import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET_NAMES = {
  monitoringSecret: "UAT_MONITORING_SECRET",
};

const TOKEN_LIFETIME_SECONDS = 900; // 15 minutes

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const parts = [
    btoa(JSON.stringify(header)),
    btoa(JSON.stringify(payload)),
  ];
  const signingInput = parts.join(".");
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${signingInput}.${sigB64}`;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const monitoringSecret = getEnv(SECRET_NAMES.monitoringSecret);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }

    const userClient = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Invalid session" }), { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON body" }), { status: 400 });
    }

    const { assignment_id, session_id, origin: requestOrigin } = body;
    if (!assignment_id || !session_id || !requestOrigin || typeof requestOrigin !== "string") {
      return new Response(JSON.stringify({ success: false, message: "assignment_id, session_id and origin are required" }), { status: 400 });
    }

    // Resolve tester via RPC
    const { data: testerData, error: testerErr } = await userClient.rpc("resolve_tester_from_auth");
    if (testerErr || !testerData) {
      return new Response(JSON.stringify({ success: false, message: "Approved tester not found" }), { status: 403 });
    }
    const testerId = testerData as string;

    // Verify assignment ownership
    const { data: assignment, error: assignErr } = await userClient
      .from("uat_assignments")
      .select("id, tester_id, status, access_starts_at, access_expires_at, job_id")
      .eq("id", assignment_id)
      .maybeSingle();
    if (assignErr || !assignment) {
      return new Response(JSON.stringify({ success: false, message: "Assignment not found" }), { status: 404 });
    }
    if ((assignment as any).tester_id !== testerId) {
      return new Response(JSON.stringify({ success: false, message: "This test assignment is not available." }), { status: 403 });
    }
    const now = new Date().toISOString();
    const accessStarts = (assignment as any).access_starts_at;
    const accessExpires = (assignment as any).access_expires_at;
    if (accessStarts && now < accessStarts) {
      return new Response(JSON.stringify({ success: false, message: "Assignment not yet available" }), { status: 403 });
    }
    if (accessExpires && now > accessExpires) {
      return new Response(JSON.stringify({ success: false, message: "Assignment has expired" }), { status: 403 });
    }

    // Verify session is active
    const { data: session, error: sessErr } = await userClient
      .from("uat_sessions")
      .select("id, status, assignment_id, tester_id, project_id, environment_id")
      .eq("id", session_id)
      .maybeSingle();
    if (sessErr || !session) {
      return new Response(JSON.stringify({ success: false, message: "Session not found" }), { status: 404 });
    }
    if ((session as any).status !== "active") {
      return new Response(JSON.stringify({ success: false, message: "Session is not active" }), { status: 403 });
    }
    if ((session as any).tester_id !== testerId || (session as any).assignment_id !== assignment_id) {
      return new Response(JSON.stringify({ success: false, message: "Session ownership mismatch" }), { status: 403 });
    }

    // Get job for project_id
    const { data: job } = await userClient
      .from("uat_jobs")
      .select("project_id")
      .eq("id", (assignment as any).job_id)
      .maybeSingle();

    const projectId = (session as any).project_id || (job as any)?.project_id;
    if (!projectId) {
      return new Response(JSON.stringify({ success: false, message: "Project not found" }), { status: 500 });
    }

    // Get monitoring settings
    const { data: settings } = await userClient
      .from("uat_monitoring_settings")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (!(settings as any)?.monitoring_enabled) {
      return new Response(JSON.stringify({ success: false, message: "Monitoring is not enabled for this project" }), { status: 403 });
    }

    // Check allowed origins
    const allowedOrigins: string[] = (settings as any).allowed_origins || [];
    const originStr = requestOrigin as string;
    const originAllowed = allowedOrigins.some((ao: string) => {
      try {
        const allowed = new URL(ao);
        const reqOrigin = new URL(originStr);
        return allowed.hostname === reqOrigin.hostname || originStr === ao;
      } catch { return originStr === ao; }
    });

    if (!originAllowed) {
      return new Response(JSON.stringify({ success: false, message: "Origin not allowed" }), { status: 403 });
    }

    // Verify monitoring acknowledgement
    const { data: ack } = await userClient
      .from("uat_monitoring_acknowledgements")
      .select("id")
      .eq("tester_id", testerId)
      .eq("assignment_id", assignment_id)
      .is("withdrawn_at", null)
      .order("acknowledged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ack) {
      return new Response(JSON.stringify({ success: false, message: "Monitoring notice not yet acknowledged" }), { status: 403 });
    }

    // Generate token
    const nowSec = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      jti: crypto.randomUUID(),
      session_id: session_id,
      assignment_id: assignment_id,
      project_id: projectId,
      environment_id: (session as any).environment_id || null,
      tester_id: testerId,
      allowed_origin: originStr,
      iat: nowSec,
      exp: nowSec + TOKEN_LIFETIME_SECONDS,
    };

    const signedToken = await signToken(tokenPayload, monitoringSecret);

    // Record audit log
    await userClient.from("uat_audit_log").insert({
      actor_id: user.id,
      action: "token_issued",
      entity_type: "uat_monitoring_token",
      entity_id: tokenPayload.jti,
      new_value: { session_id, assignment_id, project_id, origin: originStr },
    });

    return new Response(JSON.stringify({
      success: true,
      token: signedToken,
      token_id: tokenPayload.jti,
      expires_at: new Date((nowSec + TOKEN_LIFETIME_SECONDS) * 1000).toISOString(),
      settings: {
        capture_navigation: (settings as any).capture_navigation,
        capture_visibility: (settings as any).capture_visibility,
        capture_console_errors: (settings as any).capture_console_errors,
        capture_unhandled_rejections: (settings as any).capture_unhandled_rejections,
        capture_failed_requests: (settings as any).capture_failed_requests,
        capture_slow_requests: (settings as any).capture_slow_requests,
        capture_performance: (settings as any).capture_performance,
        slow_request_threshold_ms: (settings as any).slow_request_threshold_ms,
      },
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
