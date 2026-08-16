import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SITE_URL = Deno.env.get("SITE_URL") || "https://digital-footprint.uk";

const ALLOWED_ORIGINS = new Set([
  "https://digital-footprint.uk",
  "https://www.digital-footprint.uk",
]);

const ALLOWED_METHODS = new Set(["GET", "POST", "OPTIONS"]);

const MAX_BODY_SIZE = 64 * 1024;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const VALID_UPDATE_FIELDS = new Set([
  "workflow_name",
  "status",
  "last_run_at",
  "last_success_at",
  "last_failure_at",
  "latest_error",
  "leads_generated",
  "health_score",
]);

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 60_000);

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  let allowedOrigin = SITE_URL;
  try {
    const url = new URL(origin);
    if (ALLOWED_ORIGINS.has(url.origin) || url.hostname.endsWith(".readdy.ai")) {
      allowedOrigin = url.origin;
    }
  } catch {
    // non-browser
  }
  return {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-n8n-webhook-secret",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "cache-control": "no-store",
    "vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: cors(req) });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }

  if (!ALLOWED_METHODS.has(req.method)) {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId)) {
    return json(req, { error: "Too many requests" }, 429);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const n8nWebhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(req, { error: "Service configuration error" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let authenticated = false;

  const machineSecret = req.headers.get("x-n8n-webhook-secret");
  if (machineSecret && n8nWebhookSecret) {
    authenticated = await constantTimeEqual(machineSecret, n8nWebhookSecret);
  }

  if (!authenticated) {
    const authorization = req.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (token) {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData.user) {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("id")
          .eq("id", userData.user.id)
          .eq("active", true)
          .maybeSingle();
        authenticated = Boolean(adminProfile);
      }
    }
  }

  if (!authenticated) {
    return json(req, { error: "Not authorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const agentId = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      if (agentId && agentId !== "n8n-webhook" && agentId.length > 30) {
        const { data: agent, error } = await supabase
          .from("digital_footprint_n8n_agents")
          .select("id, workflow_name, status, last_run_at, last_success_at, last_failure_at, health_score, leads_generated, updated_at")
          .eq("id", agentId)
          .maybeSingle();

        if (error) return json(req, { error: "Lookup error" }, 500);
        if (!agent) return json(req, { error: "Agent not found" }, 404);
        return json(req, { success: true, agent });
      }

      const { data: agents, error } = await supabase
        .from("digital_footprint_n8n_agents")
        .select("id, workflow_name, status, last_run_at, last_success_at, last_failure_at, health_score, leads_generated, updated_at")
        .order("created_at", { ascending: false });

      if (error) return json(req, { error: "Lookup error" }, 500);
      return json(req, { success: true, agents });
    }

    if (req.method === "POST") {
      const contentLength = Number(req.headers.get("content-length") || 0);
      if (contentLength > MAX_BODY_SIZE) {
        return json(req, { error: "Payload too large" }, 413);
      }

      let body: Record<string, unknown>;
      try {
        const rawText = await req.text();
        if (rawText.length > MAX_BODY_SIZE) {
          return json(req, { error: "Payload too large" }, 413);
        }
        body = JSON.parse(rawText);
      } catch {
        return json(req, { error: "Invalid JSON payload" }, 400);
      }

      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return json(req, { error: "Invalid payload shape" }, 400);
      }

      const targetAgentId = String(body.agent_id || agentId || "");
      if (!targetAgentId || targetAgentId === "n8n-webhook" || targetAgentId.length < 30) {
        return json(req, { error: "Valid agent_id is required" }, 400);
      }

      const idempotencyKey = String(body.idempotency_key || "");
      if (idempotencyKey && idempotencyKey.length <= 200) {
        const { data: duplicate } = await supabase
          .from("workflow_executions")
          .select("id")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (duplicate) {
          return json(req, { success: true, dedup: true, reason: "duplicate" });
        }
      }

      const updatePayload: Record<string, unknown> = {};
      for (const key of VALID_UPDATE_FIELDS) {
        if (body[key] !== undefined) {
          const val = body[key];
          if (typeof val === "string" && val.length > 5000) {
            updatePayload[key] = val.slice(0, 5000);
          } else {
            updatePayload[key] = val;
          }
        }
      }

      updatePayload.updated_at = new Date().toISOString();

      if (Object.keys(updatePayload).length <= 1) {
        return json(req, { error: "No valid fields to update" }, 400);
      }

      const { data: agent, error } = await supabase
        .from("digital_footprint_n8n_agents")
        .update(updatePayload)
        .eq("id", targetAgentId)
        .select("id, workflow_name, status, updated_at")
        .maybeSingle();

      if (error) return json(req, { error: "Update failed" }, 500);
      if (!agent) return json(req, { error: "Agent not found" }, 404);

      if (idempotencyKey) {
        await supabase.from("workflow_executions").insert({
          idempotency_key: idempotencyKey,
          agent_id: targetAgentId,
          status: "completed",
          executed_at: new Date().toISOString(),
        });
      }

      return json(req, { success: true, agent });
    }

    return json(req, { error: "Method not allowed" }, 405);
  } catch {
    return json(req, { error: "Internal error" }, 500);
  }
});
