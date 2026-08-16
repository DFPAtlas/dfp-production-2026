import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_DOMAIN = Deno.env.get("RESEND_FROM_DOMAIN");
const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL") || "noreply@digital-footprint.uk";
const SITE_URL = Deno.env.get("SITE_URL") || "https://digital-footprint.uk";
const INTERNAL_SECRET = Deno.env.get("INVOICE_REMINDER_SECRET") || "";

function getFromAddress(label?: string): string {
  const domain = RESEND_FROM_DOMAIN || "digital-footprint.uk";
  if (label) return `${label} <noreply@${domain}>`;
  return `Digital Footprint <noreply@${domain}>`;
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{{ ${key} }}`, value);
  }
  return result;
}

function buildUrgencyMeta(daysOverdue: number) {
  const urgencyColor = daysOverdue > 14 ? "#dc2626" : daysOverdue > 7 ? "#f59e0b" : "#3b82f6";
  const urgencyText = daysOverdue > 14 ? "URGENT" : daysOverdue > 7 ? "Second Reminder" : "Friendly Reminder";
  const overdueText = daysOverdue > 0 ? `Payment Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : "Payment Due";
  return { urgencyColor, urgencyText, overdueText };
}

interface Invoice {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  due_date: string;
  client_id: string;
  client_email?: string;
  client_name?: string;
}

async function sendReminderEmail(
  supabase: ReturnType<typeof createClient>,
  invoice: Invoice,
  daysOverdue: number,
  isManual: boolean = false
) {
  if (!RESEND_API_KEY) return false;

  const formattedAmount = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(invoice.amount));
  const { urgencyColor, urgencyText, overdueText } = buildUrgencyMeta(daysOverdue);
  const dueDateStr = new Date(invoice.due_date).toLocaleDateString("en-GB");
  const paymentLink = `${SITE_URL}/portal/billing`;

  const { data: clientTemplate } = await supabase
    .from("email_templates").select("subject, html_content").eq("name", "Invoice Reminder").eq("category", "invoice").maybeSingle();

  const { data: adminTemplate } = await supabase
    .from("email_templates").select("subject, html_content").eq("name", "Invoice Reminder Admin").eq("category", "invoice").maybeSingle();

  let clientSubject: string;
  let clientHtml: string;
  const vars: Record<string, string> = {
    client_name: invoice.client_name || "Valued Client",
    invoice_number: invoice.invoice_number,
    invoice_description: invoice.description,
    invoice_amount: formattedAmount,
    invoice_due_date: dueDateStr,
    days_overdue: String(daysOverdue),
    urgency_text: urgencyText,
    overdue_text: overdueText,
    urgency_color: urgencyColor,
    payment_link: paymentLink,
  };

  if (clientTemplate) {
    clientSubject = renderTemplate(clientTemplate.subject, vars);
    clientHtml = renderTemplate(clientTemplate.html_content, vars);
  } else {
    clientSubject = `${urgencyText}: Invoice ${invoice.invoice_number} - ${formattedAmount} ${daysOverdue > 0 ? 'Overdue' : 'Due'}`;
    clientHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;"><div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1f2937; margin: 0;">Digital Footprint</h1><p style="color: #6b7280; margin: 5px 0 0 0;">Invoice Reminder</p></div><div style="background: ${urgencyColor}; color: white; padding: 10px 20px; border-radius: 6px; text-align: center; margin-bottom: 20px;"><strong>${urgencyText}: ${overdueText}</strong></div><p style="color: #374151; line-height: 1.6;">Dear ${vars.client_name},</p><p style="color: #374151; line-height: 1.6;">This is a reminder regarding the following invoice:</p><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td><td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${vars.invoice_number}</td></tr><tr><td style="padding: 8px 0; color: #6b7280;">Description:</td><td style="padding: 8px 0; color: #1f2937; text-align: right;">${vars.invoice_description}</td></tr><tr><td style="padding: 8px 0; color: #6b7280;">Amount Due:</td><td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 18px; text-align: right;">${vars.invoice_amount}</td></tr><tr><td style="padding: 8px 0; color: #6b7280;">Due Date:</td><td style="padding: 8px 0; color: #1f2937; text-align: right;">${vars.invoice_due_date}</td></tr></table></div><div style="text-align: center; margin: 30px 0;"><a href="${paymentLink}" style="display: inline-block; background: #007AFF; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Pay Now</a></div><p style="color: #374151; line-height: 1.6;">If you have already made this payment, please disregard this reminder.</p><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated reminder from Digital Footprint.</p></div></div>`;
  }

  let adminSubject: string;
  let adminHtml: string;
  const adminVars: Record<string, string> = {
    invoice_number: invoice.invoice_number,
    invoice_amount: formattedAmount,
    days_overdue: daysOverdue > 0 ? String(daysOverdue) : "Not yet due",
    client_email: invoice.client_email || "Not available",
    client_name: invoice.client_name || "Unknown",
    invoice_description: invoice.description,
    is_manual: isManual ? "Manual " : "",
    urgency_color: urgencyColor,
    urgency_text: urgencyText,
  };

  if (adminTemplate) {
    adminSubject = renderTemplate(adminTemplate.subject, adminVars);
    adminHtml = renderTemplate(adminTemplate.html_content, adminVars);
  } else {
    adminSubject = `${isManual ? 'Manual ' : ''}Reminder Sent: ${invoice.invoice_number}`;
    adminHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: ${urgencyColor}; border-bottom: 2px solid ${urgencyColor}; padding-bottom: 10px;">Invoice Reminder Sent</h2><div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 10px 0;"><strong>Invoice:</strong> ${vars.invoice_number}</p><p style="margin: 10px 0;"><strong>Amount:</strong> ${vars.invoice_amount}</p><p style="margin: 10px 0;"><strong>Days Overdue:</strong> ${adminVars.days_overdue}</p><p style="margin: 10px 0;"><strong>Client Email:</strong> ${adminVars.client_email}</p></div><p style="color: #6b7280; font-size: 12px;">A reminder email has been sent to the client${isManual ? ' (manually triggered)' : ''}.</p></div>`;
  }

  try {
    const emailPromises = [];
    if (invoice.client_email) {
      emailPromises.push(fetch("https://api.resend.com/emails", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: getFromAddress("Invoice Reminders"), to: [invoice.client_email], subject: clientSubject, html: clientHtml }),
      }));
    }
    emailPromises.push(fetch("https://api.resend.com/emails", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: getFromAddress(), to: [NOTIFICATION_EMAIL], subject: adminSubject, html: adminHtml }),
    }));
    await Promise.all(emailPromises);
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const { headers: corsH, originAllowed } = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!originAllowed) return new Response(null, { status: 204 });
    return new Response("ok", { headers: corsH });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }

    const { invoice_id } = body as { invoice_id?: string };

    if (invoice_id) {
      if (!originAllowed) {
        return new Response(JSON.stringify({ error: "origin_not_allowed" }), { status: 403, headers: corsH });
      }

      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsH });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: authUser, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser?.user) {
        return new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsH });
      }

      const { data: profile } = await supabase
        .from("admin_profiles").select("role, active").eq("id", authUser.user.id).eq("active", true).maybeSingle();

      const isStaff = profile && ["owner", "super_admin", "admin"].includes(profile.role);

      if (!isStaff) {
        const { data: staffProfile } = await supabase
          .from("staff_profiles").select("role, active").eq("id", authUser.user.id).eq("active", true).maybeSingle();
        if (!staffProfile) {
          return new Response(JSON.stringify({ error: "admin_permission_required" }), { status: 403, headers: corsH });
        }
      }

      const { data: invoice, error: fetchError } = await supabase
        .from("invoices").select("*, profiles(email, full_name)")
        .eq("id", invoice_id).maybeSingle();

      if (fetchError || !invoice) {
        return new Response(JSON.stringify({ error: "invoice_not_found" }), { status: 404, headers: corsH });
      }

      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const invoiceWithClient = { ...invoice, client_email: invoice.profiles?.email, client_name: invoice.profiles?.full_name };
      const sent = await sendReminderEmail(supabase, invoiceWithClient, daysOverdue, true);

      if (sent) {
        await supabase.from("invoices").update({ last_reminder_sent: new Date().toISOString() }).eq("id", invoice.id);
      }

      return new Response(JSON.stringify({ success: sent, message: sent ? "Reminder sent successfully" : "Failed to send reminder", invoice_number: invoice.invoice_number }), { headers: corsH });
    }

    // Batch mode: require internal secret
    const providedSecret = req.headers.get("x-internal-secret") || "";
    if (!INTERNAL_SECRET || providedSecret !== INTERNAL_SECRET) {
      if (originAllowed) {
        return new Response(JSON.stringify({ error: "Batch processing requires internal invocation" }), { status: 403, headers: corsH });
      }
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsH });
    }

    const { data: overdueInvoices, error: fetchError } = await supabase
      .from("invoices").select("*, profiles(email, full_name)")
      .eq("status", "pending").lt("due_date", today.toISOString());

    if (fetchError) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue invoices found", reminders_sent: 0 }), { headers: corsH });
    }

    let remindersSent = 0;
    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const shouldSendReminder = daysOverdue === 1 || daysOverdue === 3 || daysOverdue === 7 || daysOverdue === 14 || daysOverdue % 7 === 0;

      if (shouldSendReminder) {
        const invoiceWithClient = { ...invoice, client_email: invoice.profiles?.email, client_name: invoice.profiles?.full_name };
        const sent = await sendReminderEmail(supabase, invoiceWithClient, daysOverdue);
        if (sent) {
          remindersSent++;
          await supabase.from("invoices").update({ status: daysOverdue > 7 ? "overdue" : "pending", last_reminder_sent: new Date().toISOString() }).eq("id", invoice.id);
        }
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${overdueInvoices.length} overdue invoices`, reminders_sent: remindersSent }), { headers: corsH });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), { status: 500, headers: corsH });
  }
});
