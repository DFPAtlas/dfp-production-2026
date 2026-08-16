import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(request: Request): { headers: Record<string, string>; originAllowed: boolean } {
  const origin = request.headers.get("origin");
  const appOrigin = Deno.env.get("DFP_APP_ORIGIN") || "https://digital-footprint.uk";
  const adminOrigin = Deno.env.get("DFP_ADMIN_ORIGIN") || "https://digital-footprint.uk";
  const devOrigin = Deno.env.get("DFP_DEV_ORIGIN");
  const allowedOrigins = Deno.env.get("DFP_ALLOWED_ORIGINS");

  let originAllowed = false;
  if (origin) {
    if (origin === appOrigin || origin === adminOrigin) originAllowed = true;
    if (devOrigin && origin === devOrigin) originAllowed = true;
    if (allowedOrigins) {
      const origins = allowedOrigins.split(",").map(function (o) { return o.trim(); });
      if (origins.includes(origin)) originAllowed = true;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (originAllowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
    headers["Access-Control-Allow-Headers"] = "authorization, x-client-info, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return { headers, originAllowed };
}

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string;
}

serve(async (req: Request) => {
  const { headers: corsH, originAllowed } = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed) return new Response(null, { status: 204 });
    return new Response("ok", { headers: corsH });
  }

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: corsH });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: corsH });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsH });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser?.user) {
      return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsH });
    }

    const { data: adminProfile } = await supabase
      .from("admin_profiles").select("role, active").eq("id", authUser.user.id).eq("active", true).maybeSingle();

    let isAuthorised = adminProfile && ["owner", "super_admin", "admin"].includes(adminProfile.role);

    if (!isAuthorised) {
      const { data: staffProfile } = await supabase
        .from("staff_profiles").select("role, active").eq("id", authUser.user.id).eq("active", true).maybeSingle();
      isAuthorised = !!staffProfile;
    }

    if (!isAuthorised) {
      return new Response(JSON.stringify({ error: "permission_required" }), { status: 403, headers: corsH });
    }

    const body: EmailRequest = await req.json();

    if (!body.to || !body.subject) {
      return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400, headers: corsH });
    }

    if (!body.html && !body.text) {
      return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400, headers: corsH });
    }

    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    if (recipients.length > 50) {
      return new Response(JSON.stringify({ error: "recipient_limit_exceeded" }), { status: 400, headers: corsH });
    }

    const payload: Record<string, unknown> = {
      from: body.from || "Digital Footprint <noreply@digital-footprint.uk>",
      to: body.to,
      subject: body.subject,
    };
    if (body.html) payload.html = body.html;
    if (body.text) payload.text = body.text;
    if (body.cc) payload.cc = body.cc;
    if (body.bcc) payload.bcc = body.bcc;
    if (body.reply_to) payload.reply_to = body.reply_to;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "email_send_failed" }), { status: res.status, headers: corsH });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: corsH });

  } catch (_err) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
  }
});
