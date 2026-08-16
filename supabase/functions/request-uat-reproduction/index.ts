import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPPORTED_ACTIONS = new Set([
  "navigate", "click", "fill", "select", "check", "uncheck",
  "upload_test_file", "wait_for", "assert_visible", "assert_text",
  "assert_url", "custom_checkpoint",
]);

const FORBIDDEN_PATTERNS = [
  /eval/i, /Function\s*\(/, /\.exec\(/, /\.run\(/,
  /script/i, /process\./, /require\(/, /import\(/,
  /fetch\(/, /XMLHttpRequest/, /localStorage/,
  /sessionStorage/, /document\.cookie/, /\.innerHTML/,
];

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

    const { data: adminProfile } = await userClient
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminProfile) {
      return new Response(JSON.stringify({ success: false, message: "Staff access required" }), { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400 });
    }

    const {
      feedback_id, execution_mode, sandbox_instance_id,
      browser_name, viewport_width, viewport_height,
      steps, credential_references,
    } = body;

    if (!feedback_id || !execution_mode || !steps || !Array.isArray(steps) || steps.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "feedback_id, execution_mode, and steps are required" }), { status: 400 });
    }

    if (!["existing_sandbox", "fresh_sandbox"].includes(execution_mode as string)) {
      return new Response(JSON.stringify({ success: false, message: "Invalid execution mode" }), { status: 400 });
    }

    const { data: feedback } = await userClient
      .from("uat_feedback")
      .select("*, uat_assignments!inner(id, tester_id, project_id)")
      .eq("id", feedback_id)
      .maybeSingle();

    if (!feedback) {
      return new Response(JSON.stringify({ success: false, message: "Bug not found" }), { status: 404 });
    }

    const fb = feedback as any;
    const projectId = fb.project_id;
    const assignmentId = fb.assignment_id;
    const sessionId = fb.session_id;
    const testCaseId = fb.test_case_id;

    for (const step of steps as any[]) {
      const action = step.action_type;
      if (!action || !SUPPORTED_ACTIONS.has(action)) {
        return new Response(JSON.stringify({ success: false, message: `Unsupported action type: ${action}` }), { status: 400 });
      }

      const combined = `${action} ${step.safe_selector || ""} ${step.input_reference || ""}`;
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(combined)) {
          return new Response(JSON.stringify({ success: false, message: "Forbidden pattern detected in step" }), { status: 400 });
        }
      }

      const needsSelector = ["click", "fill", "select", "check", "uncheck", "wait_for", "assert_visible", "assert_text"].includes(action);
      if (needsSelector && !step.safe_selector) {
        return new Response(JSON.stringify({ success: false, message: `Action ${action} requires safe_selector` }), { status: 400 });
      }

      if (action === "fill" && !step.input_reference) {
        return new Response(JSON.stringify({ success: false, message: "Fill action requires input_reference" }), { status: 400 });
      }
    }

    if (execution_mode === "existing_sandbox") {
      if (!sandbox_instance_id) {
        return new Response(JSON.stringify({ success: false, message: "sandbox_instance_id required for existing_sandbox mode" }), { status: 400 });
      }

      const { data: sandbox } = await userClient
        .from("uat_sandbox_instances")
        .select("id, project_id, assignment_id, status")
        .eq("id", sandbox_instance_id)
        .maybeSingle();

      if (!sandbox) {
        return new Response(JSON.stringify({ success: false, message: "Sandbox not found" }), { status: 404 });
      }

      const sb = sandbox as any;
      if (sb.project_id !== projectId || sb.assignment_id !== assignmentId) {
        return new Response(JSON.stringify({ success: false, message: "Sandbox does not belong to this project/assignment" }), { status: 403 });
      }

      if (!["active", "ready"].includes(sb.status)) {
        return new Response(JSON.stringify({ success: false, message: `Sandbox not in usable state: ${sb.status}` }), { status: 400 });
      }
    }

    let workerOnline = false;
    try {
      const healthRes = await fetch(`${workerUrl}/health`, {
        headers: { "X-Worker-Token": workerToken },
        signal: AbortSignal.timeout(5000),
      });
      workerOnline = healthRes.ok;
    } catch { /* worker offline */ }

    if (!workerOnline) {
      return new Response(JSON.stringify({ success: false, message: "Playwright worker unavailable" }), { status: 503 });
    }

    const attemptRes = await userClient
      .from("uat_reproduction_runs")
      .select("attempt_number")
      .eq("feedback_id", feedback_id)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = ((attemptRes.data && attemptRes.data[0]) ? (attemptRes.data[0] as any).attempt_number : 0) + 1;

    const { data: runData, error: runErr } = await userClient
      .from("uat_reproduction_runs")
      .insert({
        feedback_id,
        project_id: projectId,
        environment_id: fb.environment_id || null,
        assignment_id: assignmentId,
        session_id: sessionId || null,
        sandbox_instance_id: (sandbox_instance_id as string) || null,
        test_case_id: testCaseId || null,
        assignment_test_case_id: fb.assignment_test_case_id || null,
        requested_by: user.id,
        status: "queued",
        attempt_number: attemptNumber,
        execution_mode: execution_mode as string,
        browser_name: (browser_name as string) || "chromium",
        viewport_width: (viewport_width as number) || 1280,
        viewport_height: (viewport_height as number) || 720,
      })
      .select("id")
      .single();

    if (runErr || !runData) {
      return new Response(JSON.stringify({ success: false, message: `Failed to create run: ${runErr?.message}` }), { status: 500 });
    }

    const runId = runData.id;

    const stepInserts = (steps as any[]).map((step: any, idx: number) => ({
      reproduction_run_id: runId,
      step_number: idx + 1,
      action_type: step.action_type,
      target_description: (step.target_description || "").substring(0, 500) || null,
      safe_selector: (step.safe_selector || "").substring(0, 500) || null,
      input_reference: step.input_reference || null,
      expected_outcome: (step.expected_outcome || "").substring(0, 500) || null,
      status: "pending",
    }));

    await userClient.from("uat_reproduction_steps").insert(stepInserts);

    let startUrl = "";
    if (fb.environment_id) {
      const { data: env } = await userClient
        .from("uat_environments")
        .select("url")
        .eq("id", fb.environment_id)
        .maybeSingle();
      startUrl = (env as any)?.url || "";
    }
    if (!startUrl) {
      startUrl = fb.page_url || "";
    }

    const { data: sandboxSettings } = await userClient
      .from("uat_sandbox_settings")
      .select("allowed_origins")
      .eq("project_id", projectId)
      .maybeSingle();

    const allowedOrigins: string[] = (sandboxSettings as any)?.allowed_origins || [];
    if (!startUrl && allowedOrigins.length > 0) {
      startUrl = allowedOrigins[0];
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/uat-sandbox-callback`;

    const workerRequest = {
      reproduction_run_id: runId,
      sandbox_instance_id: sandbox_instance_id || null,
      execution_mode,
      start_url: startUrl,
      allowed_origins: allowedOrigins,
      browser_type: browser_name || "chromium",
      viewport: {
        width: viewport_width || 1280,
        height: viewport_height || 720,
      },
      steps: (steps as any[]).map((s: any, idx: number) => ({
        step_number: idx + 1,
        action_type: s.action_type,
        target_description: (s.target_description || "").substring(0, 500) || null,
        safe_selector: (s.safe_selector || "").substring(0, 500) || null,
        input_reference: s.input_reference || null,
        expected_outcome: (s.expected_outcome || "").substring(0, 500) || null,
      })),
      credential_references: credential_references || {},
      trace_enabled: true,
      callback_url: callbackUrl,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    let workerErrorMsg = "";
    try {
      const workerRes = await fetch(`${workerUrl}/uat/reproduce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Token": workerToken,
        },
        body: JSON.stringify(workerRequest),
        signal: AbortSignal.timeout(15000),
      });

      if (!workerRes.ok) {
        const errData = await workerRes.json();
        workerErrorMsg = (errData as any).error || `Worker returned ${workerRes.status}`;
      }
    } catch (workerErr: any) {
      workerErrorMsg = workerErr.message || "Worker request failed";
    }

    if (workerErrorMsg) {
      await userClient
        .from("uat_reproduction_runs")
        .update({ status: "failed", failure_code: "worker_unavailable", safe_summary: workerErrorMsg })
        .eq("id", runId);

      return new Response(JSON.stringify({ success: false, message: workerErrorMsg }), { status: 502 });
    }

    await userClient
      .from("uat_reproduction_runs")
      .update({ status: "preparing" })
      .eq("id", runId);

    await userClient.from("uat_audit_log").insert({
      action: "reproduction_requested",
      entity_type: "uat_feedback",
      entity_id: feedback_id,
      new_value: {
        reproduction_run_id: runId,
        execution_mode,
        attempt_number: attemptNumber,
        requested_by: user.id,
      },
    });

    return new Response(JSON.stringify({ success: true, reproduction_run_id: runId, status: "preparing", attempt_number: attemptNumber }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
