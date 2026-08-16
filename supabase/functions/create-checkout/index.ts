import Stripe from "npm:stripe@22.1.1";
import { createClient } from "npm:@supabase/supabase-js@2.106.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://digital-footprint.uk";
const ALLOWED_HOSTS = new Set([
  "digital-footprint.uk",
  "www.digital-footprint.uk",
  "localhost",
]);

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".readdy.ai");
}

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  let allowedOrigin = SITE_URL;
  try {
    const url = new URL(origin);
    if (isAllowedHost(url.hostname)) allowedOrigin = origin;
  } catch {
    // Non-browser requests do not need a reflected Origin.
  }
  return {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: cors(req) });
}

function redirectUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value) return fallback;
  try {
    const url = new URL(value);
    const validProtocol = url.protocol === "https:" ||
      (url.protocol === "http:" && url.hostname === "localhost");
    return isAllowedHost(url.hostname) && validProtocol ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(req, { error: "Payment service is not configured" }, 503);
  }

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return json(req, { error: "Authentication required" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) return json(req, { error: "Invalid session" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body" }, 400);
  }

  const invoiceId = String(body.invoiceId ?? body.invoice_id ?? "");
  if (!isUuid(invoiceId)) return json(req, { error: "A valid invoice ID is required" }, 400);

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select(
      "id, invoice_number, description, amount, total, amount_paid, amount_outstanding, currency, type, status, client_id, project_id, updated_at, clients(id,user_id,email,contact_name,company_name,stripe_customer_id)",
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoiceError || !invoice) return json(req, { error: "Invoice not found" }, 404);

  if (invoice.status === "paid" || Number(invoice.amount_outstanding) === 0) {
    return json(req, { error: "This invoice is already paid" }, 409);
  }
  if (["draft", "cancelled", "written_off", "archived", "disputed"].includes(invoice.status)) {
    return json(req, { error: "This invoice is not available for payment" }, 409);
  }
  if (invoice.type === "subscription") {
    return json(req, { error: "Recurring billing must use a subscription plan" }, 400);
  }

  const currency = String(invoice.currency || "GBP").toUpperCase();
  if (currency !== "GBP") {
    return json(req, { error: "Only GBP invoice payments are currently supported" }, 400);
  }

  const total = Number(invoice.total ?? invoice.amount);
  const recordedPaid = Number(invoice.amount_paid ?? 0);
  const outstanding = Number(
    invoice.amount_outstanding ?? Math.max(0, total - recordedPaid),
  );
  const amountMinor = Math.round(outstanding * 100);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 100_000_000) {
    return json(req, { error: "Invoice outstanding balance is invalid" }, 400);
  }

  const [{ data: adminProfile }, { data: staffProfile }] = await Promise.all([
    admin.from("admin_profiles").select("id").eq("id", user.id).eq("active", true).maybeSingle(),
    admin.from("staff_profiles").select("id").eq("id", user.id).eq("active", true).maybeSingle(),
  ]);
  let authorised = Boolean(
    adminProfile || staffProfile || invoice.clients?.user_id === user.id,
  );

  if (!authorised && invoice.project_id) {
    const { data: directAccess } = await admin
      .from("project_access")
      .select("id")
      .eq("project_id", invoice.project_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    authorised = Boolean(directAccess);
    if (!authorised) {
      const { data: ownClient } = await admin
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (ownClient) {
        const { data: clientAccess } = await admin
          .from("project_access")
          .select("id")
          .eq("project_id", invoice.project_id)
          .eq("client_id", ownClient.id)
          .limit(1)
          .maybeSingle();
        authorised = Boolean(clientAccess);
      }
    }
  }
  if (!authorised) return json(req, { error: "You do not have access to this invoice" }, 403);

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  let stripeCustomerId = invoice.clients?.stripe_customer_id as string | null;
  if (!stripeCustomerId && invoice.client_id) {
    const customer = await stripe.customers.create({
      email: invoice.clients?.email || user.email || undefined,
      name: invoice.clients?.company_name || invoice.clients?.contact_name || undefined,
      metadata: {
        client_id: invoice.client_id,
        venture_code: "digital-footprint",
      },
    }, { idempotencyKey: `dfp-customer-${invoice.client_id}` });
    stripeCustomerId = customer.id;
    const { error: customerUpdateError } = await admin
      .from("clients")
      .update({ stripe_customer_id: customer.id })
      .eq("id", invoice.client_id)
      .is("stripe_customer_id", null);
    if (customerUpdateError) throw customerUpdateError;
  }

  const successUrl = redirectUrl(
    body.successUrl ?? body.success_url,
    `${SITE_URL}/portal/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`,
  );
  const cancelUrl = redirectUrl(
    body.cancelUrl ?? body.cancel_url,
    `${SITE_URL}/portal/invoices?payment=cancelled`,
  );
  const metadata: Record<string, string> = {
    type: "invoice_payment",
    invoice_id: invoice.id,
    client_id: invoice.client_id || "",
    project_id: invoice.project_id || "",
    user_id: user.id,
    venture_code: "digital-footprint",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : invoice.clients?.email || user.email || undefined,
    client_reference_id: invoice.id,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: amountMinor,
        product_data: {
          name: `Invoice ${invoice.invoice_number}`,
          description: invoice.description,
          metadata: {
            invoice_id: invoice.id,
            venture_code: "digital-footprint",
          },
        },
      },
    }],
    metadata,
    payment_intent_data: { metadata },
    success_url: successUrl,
    cancel_url: cancelUrl,
  }, {
    idempotencyKey: `invoice-checkout-${invoice.id}-${amountMinor}`,
  });

  if (!session.url) return json(req, { error: "Stripe did not return a checkout URL" }, 502);

  const { error: sessionUpdateError } = await admin
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", invoice.id);
  if (sessionUpdateError) throw sessionUpdateError;

  return json(req, { url: session.url, sessionId: session.id });
});

