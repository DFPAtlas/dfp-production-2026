import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") || "digital-footprint.uk";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getCorsHeaders(request: Request): { headers: Record<string, string>; originAllowed: boolean } {
  const origin = request.headers.get("origin");
  const adminOrigin = Deno.env.get("DFP_ADMIN_ORIGIN") || "https://digital-footprint.uk";
  const devOrigin = Deno.env.get("DFP_DEV_ORIGIN");
  const allowedOrigins = Deno.env.get("DFP_ALLOWED_ORIGINS");

  let originAllowed = false;
  if (origin) {
    if (origin === adminOrigin) originAllowed = true;
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

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*(@.*)/, "$1***$2");
}

serve(async (req: Request) => {
  const { headers: corsH, originAllowed } = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed) {
      return new Response(null, { status: 204 });
    }
    return new Response("ok", { headers: corsH });
  }

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers: corsH,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: corsH,
    });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "authentication_required" }), {
        status: 401,
        headers: corsH,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      return new Response(JSON.stringify({ error: "authentication_required" }), {
        status: 401,
        headers: corsH,
      });
    }

    const callerId = authUser.user.id;

    const { data: callerProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("role, active")
      .eq("id", callerId)
      .eq("active", true)
      .maybeSingle();

    if (!callerProfile || !["owner", "super_admin"].includes(callerProfile.role)) {
      await supabaseAdmin.from("admin_security_audit_log").insert({
        actor_id: callerId,
        action: "admin_reset_email_rejected",
        success: false,
        details: { reason: "insufficient_privileges" },
        created_at: new Date().toISOString(),
        module: "admin-repair-7",
        source: "edge_function",
      });

      return new Response(JSON.stringify({ error: "admin_permission_required" }), {
        status: 403,
        headers: corsH,
      });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentRequests } = await supabaseAdmin
      .from("admin_security_audit_log")
      .select("id")
      .eq("actor_id", callerId)
      .eq("action", "admin_reset_email_sent")
      .gte("created_at", fiveMinutesAgo);

    if (recentRequests && recentRequests.length >= 5) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: corsH,
      });
    }

    const body = await req.json();
    const targetEmail = (body.email || "").trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "invalid_request" }), {
        status: 400,
        headers: corsH,
      });
    }

    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), {
        status: 500,
        headers: corsH,
      });
    }

    const goTrueResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/generate_link`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          type: "recovery",
          email: targetEmail,
          options: {
            redirect_to: "https://digital-footprint.uk/admin/reset-password",
          },
        }),
      }
    );

    const goTrueData = await goTrueResponse.json();

    if (!goTrueResponse.ok) {
      await supabaseAdmin.from("admin_security_audit_log").insert({
        actor_id: callerId,
        action: "admin_reset_email_failed",
        success: false,
        details: { reason: "supabase_error", target_email_masked: maskEmail(targetEmail) },
        created_at: new Date().toISOString(),
        module: "admin-repair-7",
        source: "edge_function",
      });

      return new Response(
        JSON.stringify({ message: "If an eligible account exists, recovery instructions have been sent." }),
        { status: 200, headers: corsH }
      );
    }

    const resetLink = goTrueData?.properties?.action_link;
    if (!resetLink) {
      return new Response(
        JSON.stringify({ message: "If an eligible account exists, recovery instructions have been sent." }),
        { status: 200, headers: corsH }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), {
        status: 500,
        headers: corsH,
      });
    }

    const resendPayload = {
      from: `Digital Footprint Admin <noreply@${RESEND_FROM_DOMAIN}>`,
      to: targetEmail,
      subject: "Reset Your Admin Password — Digital Footprint",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F172A; color: #E2E8F0;">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 6px 0;">Digital Footprint</h1>
            <p style="font-size: 13px; color: #64748B; margin: 0;">Admin Portal — Password Reset</p>
          </div>
          <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px 24px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #CBD5E1; margin: 0 0 20px 0; line-height: 1.6;">
              You requested a password reset for your admin account. Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06B6D4, #0891B2); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px;">
                Reset Your Password
              </a>
            </div>
            <p style="font-size: 12px; color: #64748B; margin: 0 0 8px 0; line-height: 1.5;">
              This link will expire in 60 minutes. If you didn&apos;t request this, you can safely ignore this email.
            </p>
          </div>
          <p style="font-size: 11px; color: #475569; text-align: center; margin: 0;">
            Digital Footprint &middot; One Contact. One Relationship. One Vision.
          </p>
        </div>
      `,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    if (!res.ok) {
      await supabaseAdmin.from("admin_security_audit_log").insert({
        actor_id: callerId,
        action: "admin_reset_email_failed",
        success: false,
        details: { reason: "resend_error", target_email_masked: maskEmail(targetEmail) },
        created_at: new Date().toISOString(),
        module: "admin-repair-7",
        source: "edge_function",
      });

      return new Response(
        JSON.stringify({ message: "If an eligible account exists, recovery instructions have been sent." }),
        { status: 200, headers: corsH }
      );
    }

    await supabaseAdmin.from("admin_security_audit_log").insert({
      actor_id: callerId,
      action: "admin_reset_email_sent",
      success: true,
      details: { target_email_masked: maskEmail(targetEmail) },
      created_at: new Date().toISOString(),
      module: "admin-repair-7",
      source: "edge_function",
    });

    return new Response(
      JSON.stringify({ message: "If an eligible account exists, recovery instructions have been sent." }),
      { status: 200, headers: corsH }
    );

  } catch (_err) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), {
      status: 500,
      headers: corsH,
    });
  }
});
