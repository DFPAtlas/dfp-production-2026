import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const workerUrl = Deno.env.get("UAT_SANDBOX_WORKER_URL");
    const workerToken = Deno.env.get("UAT_SANDBOX_WORKER_TOKEN") || "";

    if (!workerUrl) {
      return new Response(
        JSON.stringify({ success: false, message: "UAT sandbox worker URL not configured", error_code: "worker_not_configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const authToken = authHeader.replace("Bearer ", "");
    if (!authToken) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }

    const userClient = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authErr } = await userClient.auth.getUser(authToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, message: "Invalid session" }), { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400 });
    }

    const { action, sandbox_instance_id, assignment_id, session_id, payload: workerPayload } = body;

    if (!action) {
      return new Response(JSON.stringify({ success: false, message: "Action is required" }), { status: 400 });
    }

    let testerId: string | null = null;
    const { data: testerData } = await userClient.rpc("resolve_tester_from_auth");
    if (testerData) testerId = testerData as string;

    let isInternal = false;
    if (!testerId) {
      const { data: adminProfile } = await userClient
        .from("admin_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (adminProfile) {
        isInternal = true;
      } else {
        const { data: staffProfile } = await userClient
          .from("staff_profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (staffProfile) isInternal = true;
      }
    }

    if (!testerId && !isInternal) {
      return new Response(JSON.stringify({ success: false, message: "Approved tester or staff access required" }), { status: 403 });
    }

    if (action !== "health" && !testerId) {
      return new Response(JSON.stringify({ success: false, message: "Approved tester not found" }), { status: 403 });
    }

    let targetUrl = workerUrl;
    let method = "GET";
    let workerBody: unknown = null;

    if (action === "health") {
      targetUrl = `${workerUrl}/health`;
    } else if (action === "status" || action === "health_check") {
      if (!sandbox_instance_id) {
        return new Response(JSON.stringify({ success: false, message: "sandbox_instance_id required" }), { status: 400 });
      }
      targetUrl = `${workerUrl}/uat/sandbox/${sandbox_instance_id}/status`;
    } else if (action === "create") {
      method = "POST";
      targetUrl = `${workerUrl}/uat/sandbox/create`;
      workerBody = workerPayload;
      if (!assignment_id || !session_id) {
        return new Response(JSON.stringify({ success: false, message: "assignment_id and session_id required" }), { status: 400 });
      }
      const { data: assignment } = await userClient
        .from("uat_assignments")
        .select("id, tester_id")
        .eq("id", assignment_id)
        .maybeSingle();
      if (!assignment || (assignment as any).tester_id !== testerId) {
        return new Response(JSON.stringify({ success: false, message: "Assignment access denied" }), { status: 403 });
      }
      const { data: session } = await userClient
        .from("uat_sessions")
        .select("id, status")
        .eq("id", session_id)
        .maybeSingle();
      if (!session || ((session as any).status !== "active" && (session as any).status !== "paused")) {
        return new Response(JSON.stringify({ success: false, message: "Session not active" }), { status: 403 });
      }
    } else if (["launch", "pause", "resume", "reset", "destroy"].includes(action as string)) {
      if (!sandbox_instance_id) {
        return new Response(JSON.stringify({ success: false, message: "sandbox_instance_id required" }), { status: 400 });
      }
      method = "POST";
      targetUrl = `${workerUrl}/uat/sandbox/${action}`;
      workerBody = { sandbox_instance_id, ...(workerPayload as Record<string, unknown> || {}) };
      const { data: instance } = await userClient
        .from("uat_sandbox_instances")
        .select("id, tester_id")
        .eq("id", sandbox_instance_id)
        .maybeSingle();
      if (!instance || (instance as any).tester_id !== testerId) {
        return new Response(JSON.stringify({ success: false, message: "Sandbox access denied" }), { status: 403 });
      }
    } else {
      return new Response(JSON.stringify({ success: false, message: "Unknown action" }), { status: 400 });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Token": workerToken,
      },
      signal: AbortSignal.timeout(30000),
    };

    if (workerBody) {
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(workerBody);
    }

    const workerRes = await fetch(targetUrl, fetchOptions);
    const workerData = await workerRes.json();

    if (!workerRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        message: (workerData as any).error || (workerData as any).message || `Worker returned ${workerRes.status}`,
        worker_status: workerRes.status,
      }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, ...workerData }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false, message: "Worker unavailable",
      error_code: "worker_unavailable",
    }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
});
