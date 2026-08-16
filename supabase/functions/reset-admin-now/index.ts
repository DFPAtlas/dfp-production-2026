import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ALLOWED_ORIGIN = Deno.env.get("DFP_ADMIN_ORIGIN") || "https://digital-footprint.uk";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin === ALLOWED_ORIGIN ||
    (Deno.env.get("DFP_DEV_ORIGIN") && origin === Deno.env.get("DFP_DEV_ORIGIN"));
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowed ? (origin || ALLOWED_ORIGIN) : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  try {
    await supabaseAdmin.from("admin_security_audit_log").insert({
      action: "unsafe_admin_endpoint_rejected",
      success: false,
      details: {
        reason: "endpoint_retired",
        endpoint: "reset-admin-now",
        ip: req.headers.get("x-forwarded-for") || null,
      },
      created_at: new Date().toISOString(),
      module: "admin-repair-2",
      source: "edge_function",
    });
  } catch {
    // audit best-effort
  }

  return new Response(JSON.stringify({
    error: "This emergency reset endpoint has been retired.",
    detail: "Use the Supabase password recovery flow instead: /admin/recovery",
    status: 410,
  }), {
    status: 410,
    headers: corsHeaders(origin),
  });
});
