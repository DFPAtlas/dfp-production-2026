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

const ALLOWED_COUNTRIES = new Set([
  "GB", "US", "CA", "AU", "IE", "DE", "FR", "ES", "IT", "NL", "SE",
  "NO", "DK", "FI", "BE", "CH", "AT", "PT", "NZ", "SG",
]);

const ALLOWED_CONTACT_METHODS = new Set(["email", "phone", "either"]);
const IDEMPOTENCY_WINDOW_MS = 15 * 60 * 1000;

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
    // Non-browser requests
  }
  return {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "cache-control": "no-store",
    "vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: cors(req) });
}

interface WebsitePackageDef {
  id: string;
  name: string;
  fullPriceMinor: number;
  depositMinor: number;
  secondMilestoneMinor: number;
  finalMilestoneMinor: number;
  currency: string;
}

interface ExistingOrder {
  id: string;
  project_reference: string;
  package_id: string;
  customer_email: string;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_status: string;
}

const PACKAGE_CATALOGUE: Record<string, WebsitePackageDef> = {
  launch: {
    id: "launch",
    name: "Launch",
    fullPriceMinor: 149500,
    depositMinor: 74750,
    secondMilestoneMinor: 44850,
    finalMilestoneMinor: 29900,
    currency: "gbp",
  },
  growth: {
    id: "growth",
    name: "Growth",
    fullPriceMinor: 299500,
    depositMinor: 149750,
    secondMilestoneMinor: 89850,
    finalMilestoneMinor: 59900,
    currency: "gbp",
  },
  commerce: {
    id: "commerce",
    name: "Commerce",
    fullPriceMinor: 499500,
    depositMinor: 249750,
    secondMilestoneMinor: 149850,
    finalMilestoneMinor: 99900,
    currency: "gbp",
  },
};

function generateProjectReference(): string {
  const year = new Date().getFullYear().toString();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DFP-${year}-${suffix}`;
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function bytesToUuid(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.slice(0, 16));
  copy[6] = (copy[6] & 0x0f) | 0x40;
  copy[8] = (copy[8] & 0x3f) | 0x80;
  const hex = Array.from(copy, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function checkoutOrderId(email: string, packageId: string, bucket: number): Promise<string> {
  const payload = new TextEncoder().encode(`dfp-checkout|${email}|${packageId}|${bucket}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", payload));
  return bytesToUuid(digest);
}

async function checkoutOrderIds(email: string, packageId: string): Promise<string[]> {
  const currentBucket = Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS);
  return await Promise.all([
    checkoutOrderId(email, packageId, currentBucket),
    checkoutOrderId(email, packageId, currentBucket - 1),
  ]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req) });
  }
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(req, { error: "Payment service is not configured" }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body" }, 400);
  }

  const packageId = String(body.packageId ?? body.package_id ?? "").toLowerCase().trim();
  const pkg = PACKAGE_CATALOGUE[packageId];
  if (!pkg) {
    return json(req, { error: "Invalid package selected" }, 400);
  }

  const totalCheck = pkg.depositMinor + pkg.secondMilestoneMinor + pkg.finalMilestoneMinor;
  if (totalCheck !== pkg.fullPriceMinor) {
    console.error("Package milestone total mismatch", { packageId, totalCheck, expected: pkg.fullPriceMinor });
    return json(req, { error: "Checkout configuration error" }, 503);
  }

  const customerName = String(body.customerName ?? body.customer_name ?? "").trim();
  const customerEmail = normaliseEmail(String(body.customerEmail ?? body.customer_email ?? ""));
  const customerPhone = String(body.customerPhone ?? body.customer_phone ?? "").trim();
  const businessName = String(body.businessName ?? body.business_name ?? "").trim();
  const billingAddress = String(body.billingAddress ?? body.billing_address ?? "").trim();
  const billingPostcode = String(body.billingPostcode ?? body.billing_postcode ?? "").trim();
  const billingCountry = String(body.billingCountry ?? body.billing_country ?? "GB").trim().toUpperCase();
  const existingWebsite = String(body.existingWebsite ?? body.existing_website ?? "").trim();
  const projectDescription = String(body.projectDescription ?? body.project_description ?? "").trim();
  const preferredContact = String(body.preferredContact ?? body.preferred_contact ?? "email").trim().toLowerCase();

  if (!customerName || customerName.length < 2) {
    return json(req, { error: "A valid full name is required" }, 400);
  }
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return json(req, { error: "A valid email address is required" }, 400);
  }
  if (!billingAddress || billingAddress.length < 5) {
    return json(req, { error: "A valid billing address is required" }, 400);
  }
  if (!ALLOWED_COUNTRIES.has(billingCountry)) {
    return json(req, { error: "Unsupported billing country" }, 400);
  }
  if (!ALLOWED_CONTACT_METHODS.has(preferredContact)) {
    return json(req, { error: "Invalid preferred contact method" }, 400);
  }
  if (customerEmail.length > 254) {
    return json(req, { error: "Email address is too long" }, 400);
  }
  if (customerName.length > 200 || businessName.length > 200) {
    return json(req, { error: "Name is too long" }, 400);
  }
  if (customerPhone.length > 50 || billingAddress.length > 500 || billingPostcode.length > 30) {
    return json(req, { error: "Customer details are too long" }, 400);
  }
  if (existingWebsite.length > 500 || projectDescription.length > 2000) {
    return json(req, { error: "Project details are too long" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const candidateOrderIds = await checkoutOrderIds(customerEmail, pkg.id);
  let orderId = candidateOrderIds[0];
  let projectReference = generateProjectReference();
  let existingOrder: ExistingOrder | null = null;
  let orderReady = false;

  const { data: candidateOrders, error: candidateLookupError } = await admin
    .from("dfp_checkout_orders")
    .select(
      "id, project_reference, package_id, customer_email, stripe_customer_id, stripe_checkout_session_id, payment_status",
    )
    .in("id", candidateOrderIds);

  if (candidateLookupError) {
    console.error("Failed to check recent checkout orders", candidateLookupError);
    return json(req, { error: "Unable to prepare checkout" }, 500);
  }

  if (candidateOrders?.length) {
    const ordersById = new Map(
      (candidateOrders as ExistingOrder[]).map((order) => [order.id, order]),
    );
    const recentOrder = candidateOrderIds
      .map((candidateId) => ordersById.get(candidateId))
      .find((order): order is ExistingOrder => Boolean(order));

    if (recentOrder) {
      if (
        recentOrder.package_id !== pkg.id ||
        normaliseEmail(recentOrder.customer_email) !== customerEmail
      ) {
        return json(req, { error: "Checkout request conflict" }, 409);
      }
      existingOrder = recentOrder;
      orderId = recentOrder.id;
      projectReference = recentOrder.project_reference;
      orderReady = true;
    }
  }

  if (!orderReady) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { error: insertError } = await admin
        .from("dfp_checkout_orders")
        .insert({
          id: orderId,
          project_reference: projectReference,
          package_id: pkg.id,
          package_name: pkg.name,
          full_price_minor: pkg.fullPriceMinor,
          starting_payment_minor: pkg.depositMinor,
          remaining_balance_minor: pkg.fullPriceMinor - pkg.depositMinor,
          second_milestone_minor: pkg.secondMilestoneMinor,
          final_milestone_minor: pkg.finalMilestoneMinor,
          currency: "gbp",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          business_name: businessName || null,
          billing_address: billingAddress,
          billing_postcode: billingPostcode || null,
          billing_country: billingCountry,
          existing_website: existingWebsite || null,
          project_description: projectDescription || null,
          preferred_contact: preferredContact,
          payment_status: "pending",
          project_status: "new",
        });

      if (!insertError) {
        orderReady = true;
        break;
      }

      if (insertError.code !== "23505") {
        console.error("Failed to reserve checkout order", insertError);
        return json(req, { error: "Unable to record order" }, 500);
      }

      const { data: duplicate, error: duplicateError } = await admin
        .from("dfp_checkout_orders")
        .select(
          "id, project_reference, package_id, customer_email, stripe_customer_id, stripe_checkout_session_id, payment_status",
        )
        .eq("id", orderId)
        .maybeSingle();

      if (duplicateError) {
        console.error("Failed to read existing checkout order", duplicateError);
        return json(req, { error: "Unable to recover checkout" }, 500);
      }

      if (duplicate) {
        existingOrder = duplicate as ExistingOrder;
        if (
          existingOrder.package_id !== pkg.id ||
          normaliseEmail(existingOrder.customer_email) !== customerEmail
        ) {
          return json(req, { error: "Checkout request conflict" }, 409);
        }
        projectReference = existingOrder.project_reference;
        orderReady = true;
        break;
      }

      projectReference = generateProjectReference();
    }
  }

  if (!orderReady) {
    return json(req, { error: "Unable to reserve a project reference" }, 503);
  }

  const successUrl = `${SITE_URL}/checkout/success?ref=${encodeURIComponent(projectReference)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${SITE_URL}/checkout/cancelled?ref=${encodeURIComponent(projectReference)}`;

  if (existingOrder?.payment_status === "paid" && existingOrder.stripe_checkout_session_id) {
    return json(req, {
      url: `${SITE_URL}/checkout/success?ref=${encodeURIComponent(projectReference)}&session_id=${encodeURIComponent(existingOrder.stripe_checkout_session_id)}`,
      sessionId: existingOrder.stripe_checkout_session_id,
      projectReference,
      reused: true,
    });
  }

  if (existingOrder?.stripe_checkout_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingOrder.stripe_checkout_session_id,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return json(req, {
          url: existingSession.url,
          sessionId: existingSession.id,
          projectReference,
          reused: true,
        });
      }
      if (existingSession.status === "complete") {
        return json(req, {
          url: `${SITE_URL}/checkout/success?ref=${encodeURIComponent(projectReference)}&session_id=${encodeURIComponent(existingSession.id)}`,
          sessionId: existingSession.id,
          projectReference,
          reused: true,
        });
      }
    } catch (error) {
      console.error(
        "Failed to recover existing Stripe Checkout session",
        error instanceof Error ? error.message : error,
      );
      return json(req, { error: "Unable to recover the existing payment session" }, 502);
    }

    return json(
      req,
      { error: "The previous payment session has expired. Please try again shortly." },
      409,
    );
  }

  const metadata: Record<string, string> = {
    type: "website_starting_payment",
    order_id: orderId,
    package_id: pkg.id,
    package_name: pkg.name,
    payment_type: "website_starting_payment",
    payment_percentage: "50",
    full_price_minor: String(pkg.fullPriceMinor),
    remaining_balance_minor: String(pkg.fullPriceMinor - pkg.depositMinor),
    project_reference: projectReference,
    source: "dfp_pricing_page",
    venture_code: "digital-footprint",
  };

  let stripeCustomerId = existingOrder?.stripe_customer_id ?? null;
  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone || undefined,
        address: {
          line1: billingAddress,
          postal_code: billingPostcode || undefined,
          country: billingCountry,
        },
        metadata: {
          order_id: orderId,
          project_reference: projectReference,
          venture_code: "digital-footprint",
        },
      }, {
        idempotencyKey: `dfp-customer-${orderId}`,
      });
      stripeCustomerId = customer.id;
    } catch (error) {
      console.error("Failed to create Stripe customer", error instanceof Error ? error.message : error);
      return json(req, { error: "Unable to create payment session" }, 502);
    }

    const { error: customerUpdateError } = await admin
      .from("dfp_checkout_orders")
      .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("stripe_customer_id", null);
    if (customerUpdateError) {
      console.error("Failed to save Stripe customer", customerUpdateError);
      return json(req, { error: "Unable to record payment customer" }, 500);
    }
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      client_reference_id: projectReference,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: pkg.depositMinor,
          product_data: {
            name: `DFP ${pkg.name} Website — Starting Payment`,
            description: `50% starting payment for the ${pkg.name} website package. Full package price: £${(pkg.fullPriceMinor / 100).toFixed(2)}. Remaining balance payable through project milestones.`,
            metadata: {
              order_id: orderId,
              package_id: pkg.id,
              venture_code: "digital-footprint",
            },
          },
        },
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: {
          message: `Only the 50% starting payment of £${(pkg.depositMinor / 100).toFixed(2)} is collected today.`,
        },
      },
    }, {
      idempotencyKey: `website-checkout-${orderId}`,
    });
  } catch (error) {
    console.error("Failed to create Stripe Checkout session", error instanceof Error ? error.message : error);
    return json(req, { error: "Unable to create payment session" }, 502);
  }

  if (!session.url) {
    return json(req, { error: "Stripe did not return a checkout URL" }, 502);
  }

  const { error: sessionUpdateError } = await admin
    .from("dfp_checkout_orders")
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (sessionUpdateError) {
    console.error("Failed to save Stripe Checkout session", sessionUpdateError);
    return json(req, { error: "Unable to record payment session" }, 500);
  }

  return json(req, {
    url: session.url,
    sessionId: session.id,
    projectReference,
  });
});