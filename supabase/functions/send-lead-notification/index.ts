import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN") || "digital-footprint.uk";
const NOTIFICATION_EMAIL = Deno.env.get("DFP_LEADS_NOTIFICATION_EMAIL") || Deno.env.get("NOTIFICATION_EMAIL") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://digital-footprint.uk";

const MAX_ATTEMPTS = 5;
const RATE_MAX = 60;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_TABLES = new Set([
  "leads",
  "partner_applications",
  "career_applications",
  "digital_footprint_support",
  "uat_tester_applications",
]);

const ALLOWED_ORIGINS = new Set([
  "https://digital-footprint.uk",
  "https://www.digital-footprint.uk",
]);

const rateStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateStore) {
    if (now > v.resetAt) rateStore.delete(k);
  }
}, 60_000);

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  let allowedOrigin = SITE_URL;
  try {
    const url = new URL(origin);
    if (ALLOWED_ORIGINS.has(url.origin) || url.hostname.endsWith(".readdy.ai")) {
      allowedOrigin = url.origin;
    }
  } catch {
    // ignore
  }
  return {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escLines(v: unknown): string {
  return esc(v).replace(/\n/g, "<br/>");
}

function field(label: string, v: unknown): string {
  const s = esc(v);
  if (!s) return "";
  return `<tr><td style="padding:7px 0;vertical-align:top;width:150px;color:#475569;font-weight:600;font-size:14px;">${esc(label)}</td><td style="padding:7px 0;color:#0f172a;font-size:14px;word-break:break-word;">${s}</td></tr>`;
}

function fieldLines(label: string, v: unknown): string {
  const s = escLines(v);
  if (!s) return "";
  return `<tr><td style="padding:7px 0;vertical-align:top;width:150px;color:#475569;font-weight:600;font-size:14px;">${esc(label)}</td><td style="padding:7px 0;color:#0f172a;font-size:14px;word-break:break-word;">${s}</td></tr>`;
}

function deriveType(sourceTable: string, record: Record<string, unknown>): string {
  if (sourceTable === "leads") {
    const t = record.enquiry_type;
    if (t === "demo_request") return "demo_request";
    if (t === "product_enquiry") return "product_enquiry";
    if (t === "pbx_early_access") return "pbx_early_access";
    if (t === "newsletter") return "newsletter";
    if (t === "strategy_review") return "strategy_review";
    return "contact";
  }
  if (sourceTable === "partner_applications") {
    return record.application_type ? `partner_${record.application_type}` : "partner";
  }
  if (sourceTable === "career_applications") return "career";
  if (sourceTable === "digital_footprint_support") return "support";
  if (sourceTable === "uat_tester_applications") return "uat";
  return "contact";
}

function subjectFor(type: string): string {
  const map: Record<string, string> = {
    contact: "New DFP enquiry — Contact",
    demo_request: "New DFP enquiry — Demo Request",
    product_enquiry: "New DFP enquiry — Product Enquiry",
    pbx_early_access: "New DFP enquiry — PBX Early Access",
    partner: "New DFP enquiry — Partner Application",
    partner_referral_registration: "New DFP enquiry — Partner Referral",
    partner_supplier_interest: "New DFP enquiry — Supplier Interest",
    partner_technology_integration: "New DFP enquiry — Technology Partner",
    career: "New DFP enquiry — Career Application",
    support: "New DFP enquiry — Support Request",
    uat: "New DFP enquiry — UAT Tester Application",
    strategy_review: "New DFP enquiry — Roadmap / Strategy Review",
  };
  return map[type] || "New DFP enquiry";
}

function buildRows(type: string, r: Record<string, unknown>): string {
  if (type === "partner" || type.startsWith("partner_")) {
    return [
      field("Applicant", r.applicant_name),
      field("Email", r.email),
      field("Company", r.company_name),
      field("Telephone", r.telephone),
      field("Website", r.website),
      field("Region", r.region),
      field("Partner type", r.application_type),
      field("Relationship", r.proposed_relationship),
      fieldLines("Summary", r.experience_summary),
    ].join("");
  }
  if (type === "career") {
    return [
      field("Candidate", r.candidate_name),
      field("Email", r.candidate_email),
      field("Telephone", r.telephone),
      field("Location", r.location),
      field("Vacancy", r.vacancy_id),
      fieldLines("Cover note", r.cover_note),
    ].join("");
  }
  if (type === "support") {
    return [
      field("Title", r.ticket_title),
      field("Requester", r.submitted_by),
      field("Email", r.submitted_email),
      field("Priority", r.priority),
      field("Status", r.status),
      fieldLines("Description", r.ticket_description),
    ].join("");
  }
  if (type === "uat") {
    return [
      field("Applicant", r.legal_name),
      field("Email", r.email),
      field("Reference", r.application_reference),
      field("Experience", r.experience_level),
      fieldLines("Motivation", r.motivation),
    ].join("");
  }
  const enquiryData = (r.enquiry_data as Record<string, unknown>) || {};
  const product = r.service_interest || enquiryData.product;
  return [
    field("Name", r.name),
    field("Email", r.email),
    field("Company", r.company_name),
    field("Phone", r.phone),
    field(type === "demo_request" || type === "product_enquiry" ? "Product/Service" : "Service interest", product),
    field("Source", r.source),
    fieldLines("Message", r.message),
  ].join("");
}

function buildHtml(type: string, r: Record<string, unknown>, sourceTable: string, sourceId: string): string {
  const rows = buildRows(type, r);
  const adminLink = sourceTable === "leads" ? `${SITE_URL}/admin/leads/${sourceId}` : "";
  const refLine = adminLink
    ? `<p style="margin:14px 0 0;color:#64748b;font-size:13px;">Record: <a href="${adminLink}" style="color:#06b6d4;">${esc(sourceTable)} / ${esc(sourceId)}</a></p>`
    : `<p style="margin:14px 0 0;color:#64748b;font-size:13px;">Record: ${esc(sourceTable)} / ${esc(sourceId)}</p>`;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0f172a;padding:20px 24px;">
      <h2 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Digital Footprint — New Enquiry</h2>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${esc(subjectFor(type))}</p>
    </div>
    <div style="padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${refLine}
    </div>
    <div style="background:#f8fafc;padding:14px 24px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
      Sent automatically by the Digital Footprint enquiry system.
    </div>
  </div>`;
}

function buildSummary(type: string, r: Record<string, unknown>): string {
  const name = (r.name || r.applicant_name || r.candidate_name || r.legal_name || r.submitted_by || "A visitor") as string;
  const email = (r.email || r.candidate_email || r.submitted_email || "") as string;
  const company = (r.company_name || "") as string;
  const parts = [String(name)];
  if (email) parts.push(String(email));
  if (company) parts.push(String(company));
  return parts.join(" \u00b7 ");
}

async function createInAppNotification(
  supabase: ReturnType<typeof createClient>,
  type: string,
  subject: string,
  record: Record<string, unknown>,
  sourceTable: string,
  sourceId: string,
): Promise<void> {
  try {
    const { data: admins } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("active", true)
      .in("role", ["owner", "super_admin", "admin"]);

    if (!admins || admins.length === 0) return;

    const summary = buildSummary(type, record);
    const eventType = type === "uat" ? "uat.application_submitted" : "lead.created";
    const category = type === "uat" ? "uat" : "client";

    const rows = admins.map((a: { id: string }) => ({
      recipient_user_id: a.id,
      event_type: eventType,
      category,
      severity: "info",
      title: subject,
      message: summary,
      related_module: sourceTable === "leads" ? "leads" : sourceTable,
      related_record_type: sourceTable,
      related_record_id: sourceId,
      source_system: "public_website",
      dedup_key: `enquiry:${sourceTable}:${sourceId}`,
      metadata: { notification_type: type },
    }));

    await supabase.from("notifications").insert(rows);
  } catch {
    // in-app notification is best-effort; never fail the request over it
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }

  if (req.method !== "POST") {
    return Response.json({ code: "ERROR", message: "method_not_allowed" }, { status: 405, headers: cors(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (entry && now <= entry.resetAt && entry.count >= RATE_MAX) {
    return Response.json({ code: "ERROR", message: "too_many_requests" }, { status: 429, headers: cors(req) });
  }
  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    entry.count++;
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return Response.json({ code: "ERROR", message: "service_not_configured" }, { status: 500, headers: cors(req) });
  }

  let body: { source_table?: string; source_id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ code: "ERROR", message: "invalid_json" }, { status: 400, headers: cors(req) });
  }

  const sourceTable = String(body.source_table ?? "");
  const sourceId = String(body.source_id ?? "");

  if (!ALLOWED_TABLES.has(sourceTable) || !sourceId || sourceId.length > 100) {
    return Response.json({ code: "ERROR", message: "invalid_request" }, { status: 400, headers: cors(req) });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: record, error: fetchError } = await supabase
    .from(sourceTable)
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();

  if (fetchError || !record) {
    return Response.json({ code: "ERROR", message: "record_not_found" }, { status: 404, headers: cors(req) });
  }

  const type = deriveType(sourceTable, record as Record<string, unknown>);

  if (type === "newsletter") {
    return Response.json({ code: "OK", skipped: true }, { headers: cors(req) });
  }

  const eventKey = `${sourceTable}:${sourceId}`;

  const { data: existing } = await supabase
    .from("lead_notification_events")
    .select("id, state, attempts")
    .eq("event_key", eventKey)
    .maybeSingle();

  if (existing && (existing.state === "sent" || existing.state === "queued")) {
    return Response.json({ code: "OK", dedup: true }, { headers: cors(req) });
  }

  const attemptNumber = existing ? (existing.attempts || 0) + 1 : 1;
  if (attemptNumber > MAX_ATTEMPTS) {
    return Response.json({ code: "ERROR", message: "retry_limit_exceeded" }, { status: 200, headers: cors(req) });
  }

  if (!RESEND_API_KEY) {
    return Response.json({ code: "ERROR", message: "email_service_not_configured" }, { status: 500, headers: cors(req) });
  }

  if (!NOTIFICATION_EMAIL) {
    return Response.json({ code: "ERROR", message: "notification_recipient_not_configured" }, { status: 500, headers: cors(req) });
  }

  const subject = subjectFor(type);
  const html = buildHtml(type, record as Record<string, unknown>, sourceTable, sourceId);

  if (existing) {
    await supabase.from("lead_notification_events").update({
      state: "queued",
      attempts: attemptNumber,
      error_message: null,
      requested_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("lead_notification_events").insert({
      event_key: eventKey,
      source_table: sourceTable,
      source_id: sourceId,
      notification_type: type,
      recipient: NOTIFICATION_EMAIL,
      state: "queued",
      attempts: 1,
    });
  }

  let providerMessageId: string | null = null;
  let sendError: string | null = null;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: `Digital Footprint Leads <noreply@${RESEND_FROM_DOMAIN}>`,
        to: [NOTIFICATION_EMAIL],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      sendError = data?.message || `resend_http_${res.status}`;
    } else {
      providerMessageId = data?.id || null;
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_error";
  }

  const completedAt = new Date().toISOString();

  if (sendError) {
    await supabase.from("lead_notification_events").update({
      state: "failed",
      error_message: sendError.slice(0, 1000),
      completed_at: completedAt,
    }).eq("event_key", eventKey);

    await createInAppNotification(supabase, type, subject, record as Record<string, unknown>, sourceTable, sourceId);

    return Response.json({ code: "ERROR", message: "notification_failed", delivered: false }, { status: 502, headers: cors(req) });
  }

  await supabase.from("lead_notification_events").update({
    state: "sent",
    provider_message_id: providerMessageId,
    completed_at: completedAt,
  }).eq("event_key", eventKey);

  await createInAppNotification(supabase, type, subject, record as Record<string, unknown>, sourceTable, sourceId);

  return Response.json({ code: "OK", delivered: true, notification_type: type }, { headers: cors(req) });
});
