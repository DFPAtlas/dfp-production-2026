import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") ?? "digital-footprint.uk";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";

const resend = new Resend(RESEND_API_KEY);

const COOLDOWN_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_WINDOW_MS = 5 * 60_000;

interface RateEntry {
  count: number;
  resetAt: number;
}

const ipRateMap = new Map<string, RateEntry>();
const emailRateMap = new Map<string, RateEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function checkRate(map: Map<string, RateEntry>, key: string): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const map of [ipRateMap, emailRateMap]) {
    for (const [key, entry] of map) {
      if (now > entry.resetAt) map.delete(key);
    }
  }
}, 60_000);

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY || !token) return false;

  try {
    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (ip && ip !== "unknown") {
      formData.append("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

async function hashEmail(email: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function resolveDestinationsByEmail(email: string): Promise<{ destinations: string[]; hasAccount: boolean }> {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const destinations: string[] = [];

  const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
  const matchedUser = authUser?.users?.find(
    (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!matchedUser) return { destinations, hasAccount: false };
  const userId = matchedUser.id;

  const checks = await Promise.all([
    supabaseAdmin.from("admin_profiles").select("id").eq("id", userId).eq("active", true).maybeSingle(),
    supabaseAdmin.from("staff_profiles").select("id").eq("id", userId).eq("active", true).maybeSingle(),
    supabaseAdmin.from("portal_access").select("id, access_role").eq("user_id", userId).eq("is_revoked", false).maybeSingle(),
    supabaseAdmin.from("uat_testers").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (checks[0].data) destinations.push("admin");
  if (checks[1].data) destinations.push("staff");
  if (checks[2].data) destinations.push("client");
  if (checks[3].data) destinations.push("uat");

  return { destinations, hasAccount: destinations.length > 0 };
}

function buildGuidanceEmail(destinations: string[]): string {
  const lines: string[] = [];
  lines.push("Hi,");
  lines.push("");
  lines.push("You requested sign-in guidance for your Digital Footprint account.");
  lines.push("");

  if (destinations.length === 0) {
    lines.push("We looked up the email address you provided and could not locate an active Digital Footprint portal account. If you believe you should have access, please contact your Digital Footprint account manager or reply to this email.");
  } else {
    lines.push("Based on the email you provided, you may have access to the following Digital Footprint services:");
    lines.push("");

    for (const dest of destinations) {
      switch (dest) {
        case "admin":
          lines.push("Administrator Portal: https://digital-footprint.uk/admin/login");
          break;
        case "staff":
          lines.push("Staff Gateway: https://digital-footprint.uk/staff/login");
          break;
        case "client":
          lines.push("Client Portal: https://digital-footprint.uk/portal/login");
          break;
        case "uat":
          lines.push("UAT TestLab: https://digital-footprint.uk/uat/jobs");
          break;
      }
    }

    lines.push("");
    lines.push("Please use the link(s) above to sign in. If you have any questions, reply to this email.");
  }

  lines.push("");
  lines.push("Digital Footprint");
  lines.push("https://digital-footprint.uk");

  return lines.join("\n");
}

const GENERIC_RESPONSE = {
  message: "If an account or invitation is associated with that address, we will send the appropriate sign-in guidance.",
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  const clientIp = getClientIp(req);

  if (!checkRate(ipRateMap, clientIp)) {
    return Response.json(GENERIC_RESPONSE, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { email?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(GENERIC_RESPONSE, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (TURNSTILE_SECRET_KEY) {
    const token = String(body.turnstileToken || body["cf-turnstile-response"] || "");
    if (!token) {
      return Response.json(GENERIC_RESPONSE, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const captchaValid = await verifyTurnstile(token, clientIp);
    if (!captchaValid) {
      return Response.json(GENERIC_RESPONSE, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) {
    return Response.json(GENERIC_RESPONSE, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const emailHash = await hashEmail(email);

  if (!checkRate(emailRateMap, emailHash)) {
    return Response.json(GENERIC_RESPONSE, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const correlationId = `guidance:${emailHash}:${Math.floor(Date.now() / COOLDOWN_MS)}`;

  const { data: recentRequest } = await supabaseAdmin
    .from("admin_security_audit_log")
    .select("id")
    .eq("correlation_id", correlationId)
    .eq("action", "account_guidance_request")
    .maybeSingle();

  if (recentRequest) {
    return Response.json(GENERIC_RESPONSE, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ipHash = await hashEmail(clientIp + "salt-dfp-guidance");

  await supabaseAdmin.from("admin_security_audit_log").insert({
    correlation_id: correlationId,
    action: "account_guidance_request",
    target_email: emailHash,
    success: true,
    result: "processed",
    details: { ip_hash: ipHash },
    source: "edge_function",
    created_at: new Date().toISOString(),
  });

  try {
    const { destinations, hasAccount } = await resolveDestinationsByEmail(email);
    const emailBody = buildGuidanceEmail(hasAccount ? destinations : []);

    await resend.emails.send({
      from: `Digital Footprint <noreply@${RESEND_FROM_DOMAIN}>`,
      to: email,
      subject: "Your Digital Footprint sign-in guidance",
      text: emailBody,
    });
  } catch {
    // silently fail
  }

  return Response.json(GENERIC_RESPONSE, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
