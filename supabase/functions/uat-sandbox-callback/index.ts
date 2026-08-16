import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VALID_EVENT_TYPES = new Set([
  "sandbox_ready", "sandbox_active", "sandbox_paused", "sandbox_resumed",
  "sandbox_resetting", "sandbox_reset_complete", "sandbox_degraded",
  "sandbox_unhealthy", "sandbox_destroyed", "sandbox_expired", "sandbox_failed",
  "reproduction_started", "reproduction_step_started", "reproduction_step_completed",
  "reproduction_evidence_uploaded", "reproduction_completed",
  "reproduction_failed", "reproduction_cancelled",
]);

function getEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) throw new Error(`Missing env: ${name}`);
  return val;
}

async function verifyCallbackSignature(body: string, headerSig: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = new Uint8Array(headerSig.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    return await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(body));
  } catch {
    return false;
  }
}

async function handleSandboxEvent(
  client: any, payload: Record<string, unknown>
): Promise<Response> {
  const {
    sandbox_instance_id, event_type, status, health_status,
    worker_instance_id, safe_message, timestamp,
  } = payload;

  if (!sandbox_instance_id || !event_type || !status || !health_status || !worker_instance_id) {
    return new Response(JSON.stringify({ success: false, message: "Missing required callback fields" }), { status: 400 });
  }

  const { data: instance } = await client
    .from("uat_sandbox_instances")
    .select("id, status, project_id, assignment_id, tester_id")
    .eq("id", sandbox_instance_id)
    .maybeSingle();

  if (!instance) {
    return new Response(JSON.stringify({ success: false, message: "Sandbox instance not found" }), { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    health_status: health_status,
    last_health_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const eventStr = event_type as string;

  if (eventStr === "sandbox_ready") {
    updateData.status = "ready";
    updateData.ready_at = new Date().toISOString();
  } else if (eventStr === "sandbox_active") {
    updateData.status = "active";
    if (!(instance as any).started_at) {
      updateData.started_at = new Date().toISOString();
    }
  } else if (eventStr === "sandbox_paused") {
    updateData.status = "paused";
    updateData.paused_at = new Date().toISOString();
  } else if (eventStr === "sandbox_resumed") {
    updateData.status = "active";
    updateData.paused_at = null;
  } else if (eventStr === "sandbox_resetting") {
    updateData.status = "resetting";
  } else if (eventStr === "sandbox_reset_complete") {
    updateData.status = "ready";
  } else if (eventStr === "sandbox_destroyed" || eventStr === "sandbox_expired") {
    updateData.status = eventStr === "sandbox_expired" ? "expired" : "ended";
    updateData.ended_at = new Date().toISOString();
  } else if (eventStr === "sandbox_failed") {
    updateData.status = "failed";
  }

  const { error: updateErr } = await client
    .from("uat_sandbox_instances")
    .update(updateData)
    .eq("id", sandbox_instance_id);

  if (updateErr) {
    return new Response(JSON.stringify({ success: false, message: `Update failed: ${updateErr.message}` }), { status: 500 });
  }

  const actionTypeMap: Record<string, string> = {
    sandbox_ready: "provision",
    sandbox_active: "launch",
    sandbox_paused: "pause",
    sandbox_resumed: "resume",
    sandbox_resetting: "reset_data",
    sandbox_reset_complete: "reset_data",
    sandbox_destroyed: "end",
    sandbox_expired: "expire",
    sandbox_failed: "health_check",
    sandbox_degraded: "health_check",
    sandbox_unhealthy: "health_check",
  };

  const actionType = actionTypeMap[eventStr] || "health_check";
  const actionStatus = eventStr === "sandbox_reset_complete" ? "completed" :
    eventStr === "sandbox_failed" ? "failed" : "completed";

  await client.from("uat_sandbox_actions").insert({
    sandbox_instance_id: sandbox_instance_id,
    assignment_id: (instance as any).assignment_id,
    tester_id: (instance as any).tester_id,
    action_type: actionType,
    status: actionStatus,
    requested_by_user_id: null,
    safe_message: safe_message || null,
    started_at: timestamp || new Date().toISOString(),
    completed_at: new Date().toISOString(),
    metadata: { worker_instance_id, callback_event: event_type },
  });

  await client.from("uat_audit_log").insert({
    action: eventStr,
    entity_type: "uat_sandbox_instance",
    entity_id: sandbox_instance_id,
    new_value: {
      status: updateData.status,
      health_status: health_status,
      worker_instance_id,
      safe_message: safe_message || null,
    },
  });

  return new Response(JSON.stringify({ success: true, instance_id: sandbox_instance_id }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleReproductionEvent(
  client: any, payload: Record<string, unknown>
): Promise<Response> {
  const {
    reproduction_run_id, event_type, status, step_number,
    reproduced, safe_summary, failure_code,
    worker_instance_id, timestamp,
  } = payload;

  if (!reproduction_run_id || !status || !worker_instance_id) {
    return new Response(JSON.stringify({ success: false, message: "Missing required reproduction callback fields" }), { status: 400 });
  }

  const { data: run } = await client
    .from("uat_reproduction_runs")
    .select("id, status, feedback_id, started_at")
    .eq("id", reproduction_run_id)
    .maybeSingle();

  if (!run) {
    return new Response(JSON.stringify({ success: false, message: "Reproduction run not found" }), { status: 404 });
  }

  const eventStr = event_type as string;
  const updateData: Record<string, unknown> = {
    worker_instance_id: (worker_instance_id as string) || null,
    updated_at: new Date().toISOString(),
  };

  if (eventStr === "reproduction_started") {
    updateData.status = "running";
    updateData.started_at = timestamp || new Date().toISOString();
  } else if (eventStr === "reproduction_step_completed") {
    updateData.status = "running";
  } else if (eventStr === "reproduction_completed") {
    updateData.status = "completed";
    updateData.completed_at = timestamp || new Date().toISOString();
    updateData.reproduced = reproduced ?? null;
    updateData.safe_summary = safe_summary || null;

    if ((run as any).started_at) {
      const start = new Date((run as any).started_at).getTime();
      const end = timestamp ? new Date(timestamp as string).getTime() : Date.now();
      updateData.duration_ms = end - start;
    }
  } else if (eventStr === "reproduction_failed") {
    updateData.status = "failed";
    updateData.completed_at = timestamp || new Date().toISOString();
    updateData.failure_code = failure_code || "execution_failed";
    updateData.safe_summary = safe_summary || null;

    if ((run as any).started_at) {
      const start = new Date((run as any).started_at).getTime();
      const end = timestamp ? new Date(timestamp as string).getTime() : Date.now();
      updateData.duration_ms = end - start;
    }
  } else if (eventStr === "reproduction_cancelled") {
    updateData.status = "cancelled";
    updateData.completed_at = timestamp || new Date().toISOString();
    updateData.safe_summary = safe_summary || null;
  } else if (eventStr === "reproduction_evidence_uploaded") {
    updateData.status = "running";
  } else if (eventStr === "reproduction_step_started") {
    updateData.status = "running";
  }

  await client
    .from("uat_reproduction_runs")
    .update(updateData)
    .eq("id", reproduction_run_id);

  if (step_number != null && eventStr === "reproduction_step_completed") {
    await client
      .from("uat_reproduction_steps")
      .update({
        status: status as string,
        completed_at: timestamp || new Date().toISOString(),
        safe_result: safe_summary || null,
      })
      .eq("reproduction_run_id", reproduction_run_id)
      .eq("step_number", step_number);
  }

  if (eventStr === "reproduction_started") {
    await client
      .from("uat_reproduction_steps")
      .update({ status: "pending" })
      .eq("reproduction_run_id", reproduction_run_id);
  }

  await client.from("uat_audit_log").insert({
    action: eventStr,
    entity_type: "uat_reproduction_run",
    entity_id: reproduction_run_id,
    new_value: {
      status: updateData.status,
      reproduced: reproduced ?? null,
      safe_summary: safe_summary || null,
      failure_code: failure_code || null,
      step_number: step_number || null,
    },
  });

  return new Response(JSON.stringify({ success: true, reproduction_run_id }), {
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), { status: 405 });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const workerSecret = Deno.env.get("UAT_WORKER_CALLBACK_SECRET") || "dfp-uat-worker-callback-secret";

    const bodyText = await req.text();
    const receivedSig = req.headers.get("X-Callback-Signature") || "";
    const receivedTs = req.headers.get("X-Callback-Timestamp") || "";

    if (!receivedSig || !receivedTs) {
      return new Response(JSON.stringify({ success: false, message: "Missing signature headers" }), { status: 401 });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const ts = parseInt(receivedTs, 10);
    if (isNaN(ts) || Math.abs(nowSec - ts) > 300) {
      return new Response(JSON.stringify({ success: false, message: "Timestamp outside tolerance" }), { status: 401 });
    }

    const sigPayload = `${receivedTs}.${bodyText}`;
    const isValid = await verifyCallbackSignature(sigPayload, receivedSig, workerSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, message: "Invalid callback signature" }), { status: 401 });
    }

    let payload: Record<string, unknown>;
    try { payload = JSON.parse(bodyText); } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400 });
    }

    const eventStr = (payload.event_type as string) || "";

    if (!VALID_EVENT_TYPES.has(eventStr)) {
      return new Response(JSON.stringify({ success: false, message: "Unknown event type" }), { status: 400 });
    }

    const client = createClient(supabaseUrl, supabaseKey);

    if (eventStr.startsWith("reproduction_")) {
      return await handleReproductionEvent(client, payload);
    }

    return await handleSandboxEvent(client, payload);

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
});
