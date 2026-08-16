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

interface TemplateRequest {
  template_id: string;
  to: string;
  variables?: Record<string, string>;
  from?: string;
  cc?: string;
  bcc?: string;
  reply_to?: string;
  subject_prefix?: string;
  subject_override?: string;
  preview_text_override?: string;
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{{ ${key} }}`, value);
  }
  return result;
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

  const authHeader = req.headers.get("Authorization") || "";
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    const { data: authUser } = await supabaseClient.auth.getUser();
    if (!authUser?.user) {
      return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsH });
    }

    const body: TemplateRequest = await req.json();

    if (!body.template_id || !body.to) {
      return new Response(JSON.stringify({ error: "invalid_request" }), { status: 400, headers: corsH });
    }

    const { data: template, error: templateError } = await supabaseClient
      .from("email_templates").select("*").eq("id", body.template_id).maybeSingle();

    if (templateError || !template) {
      return new Response(JSON.stringify({ error: "template_not_found" }), { status: 404, headers: corsH });
    }

    const vars = body.variables || {};
    let renderedSubject: string;
    if (body.subject_override) {
      renderedSubject = (body.subject_prefix || '') + body.subject_override;
    } else {
      renderedSubject = (body.subject_prefix || '') + renderTemplate(template.subject, vars);
    }

    let renderedHtml = renderTemplate(template.html_content, vars);

    if (body.preview_text_override) {
      const previewSpan = `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${body.preview_text_override}${'\u00A0'.repeat(100)}</span>`;
      renderedHtml = renderedHtml.replace(/<body[^>]*>/i, `$&${previewSpan}`);
    }

    const toList = Array.isArray(body.to) ? body.to : [body.to];
    if (toList.length > 100) {
      return new Response(JSON.stringify({ error: "recipient_limit_exceeded" }), { status: 400, headers: corsH });
    }

    const payload: Record<string, unknown> = {
      from: body.from || "Digital Footprint <noreply@digital-footprint.uk>",
      to: body.to,
      subject: renderedSubject,
      html: renderedHtml,
    };
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
