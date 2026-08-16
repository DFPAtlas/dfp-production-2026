import Stripe from "npm:stripe@22.1.1";
import { createClient } from "npm:@supabase/supabase-js@2.106.2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type AdminClient = ReturnType<typeof createClient>;

function objectId(event: Stripe.Event): string | null {
  const object = event.data.object;
  return typeof object === "object" && object && "id" in object
    ? String(object.id)
    : null;
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function completeInvoicePayment(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
): Promise<void> {
  const invoiceId = session.metadata?.invoice_id || session.metadata?.invoiceId;
  if (!invoiceId) throw new Error("Invoice checkout is missing invoice_id metadata");
  if (session.payment_status !== "paid") {
    throw new Error("Invoice checkout session is not marked paid");
  }
  if ((session.currency ?? "").toLowerCase() !== "gbp") {
    throw new Error("Unexpected invoice checkout currency");
  }

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id, amount, total, amount_paid, amount_outstanding, currency, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoiceError || !invoice) {
    throw new Error("Invoice metadata does not match a database record");
  }

  const total = Number(invoice.total ?? invoice.amount);
  const paid = Number(invoice.amount_paid ?? 0);
  const outstanding = Number(invoice.amount_outstanding ?? Math.max(0, total - paid));
  const expectedMinor = Math.round(outstanding * 100);
  if (!Number.isSafeInteger(expectedMinor) || session.amount_total !== expectedMinor) {
    throw new Error("Invoice payment amount mismatch");
  }
  if (String(invoice.currency || "GBP").toLowerCase() !== "gbp") {
    throw new Error("Invoice database currency mismatch");
  }

  const intentId = paymentIntentId(session.payment_intent);
  if (!intentId) throw new Error("Paid invoice checkout has no PaymentIntent");

  const { error: rpcError } = await admin.rpc("record_stripe_invoice_payment", {
    p_invoice_id: invoiceId,
    p_amount_minor: session.amount_total,
    p_currency: session.currency,
    p_payment_intent_id: intentId,
    p_event_id: event.id,
    p_checkout_session_id: session.id,
    p_paid_at: new Date(event.created * 1000).toISOString(),
  });
  if (rpcError) throw rpcError;
}

async function completeMilestonePayment(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const milestoneId = session.metadata?.milestone_id;
  if (!milestoneId) throw new Error("Milestone checkout is missing milestone_id metadata");
  if (session.payment_status !== "paid") {
    throw new Error("Milestone checkout session is not marked paid");
  }
  if ((session.currency ?? "").toLowerCase() !== "gbp") {
    throw new Error("Unexpected milestone checkout currency");
  }

  const { data: milestone, error: milestoneError } = await admin
    .from("milestones")
    .select("id, amount, payment_status")
    .eq("id", milestoneId)
    .maybeSingle();
  if (milestoneError || !milestone) {
    throw new Error("Milestone metadata does not match a database record");
  }
  const expectedMinor = Math.round(Number(milestone.amount) * 100);
  if (!Number.isSafeInteger(expectedMinor) || session.amount_total !== expectedMinor) {
    throw new Error("Milestone payment amount mismatch");
  }

  const intentId = paymentIntentId(session.payment_intent);
  if (!intentId) throw new Error("Paid milestone checkout has no PaymentIntent");

  const { error: updateError } = await admin
    .from("milestones")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_id: intentId,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", milestone.id)
    .neq("payment_status", "paid");
  if (updateError) throw updateError;
}

async function completeWebsiteStartingPayment(
  admin: AdminClient,
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
): Promise<void> {
  const projectReference = session.metadata?.project_reference;
  if (!projectReference) throw new Error("Website checkout is missing project_reference metadata");
  if (session.payment_status !== "paid") {
    throw new Error("Website checkout session is not marked paid");
  }
  if ((session.currency ?? "").toLowerCase() !== "gbp") {
    throw new Error("Unexpected website checkout currency");
  }

  const { data: order, error: orderError } = await admin
    .from("dfp_checkout_orders")
    .select("id, starting_payment_minor, payment_status, project_reference")
    .eq("project_reference", projectReference)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error("Website checkout order not found for project_reference");
  }

  if (order.payment_status === "paid") {
    console.log("Order already marked paid, skipping", { projectReference });
    return;
  }

  if (!Number.isSafeInteger(order.starting_payment_minor) || session.amount_total !== order.starting_payment_minor) {
    throw new Error("Website starting payment amount mismatch");
  }

  const intentId = paymentIntentId(session.payment_intent);
  if (!intentId) throw new Error("Paid website checkout has no PaymentIntent");

  const { error: updateError } = await admin
    .from("dfp_checkout_orders")
    .update({
      payment_status: "paid",
      project_status: "confirmed",
      stripe_payment_intent_id: intentId,
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("payment_status", "paid");

  if (updateError) throw updateError;

  const { error: paymentInsertError } = await admin.from("payments").insert({
    invoice_id: null,
    client_id: null,
    amount: session.amount_total ? session.amount_total / 100 : 0,
    currency: String(session.currency || "gbp").toUpperCase(),
    payment_date: new Date(event.created * 1000).toISOString(),
    method: "stripe",
    status: "completed",
    provider: "stripe",
    provider_payment_id: intentId,
    provider_event_id: event.id,
    idempotency_key: `stripe-event:${event.id}`,
    reconciliation_state: "matched",
  });
  if (paymentInsertError?.code !== "23505" && paymentInsertError) {
    console.error("Failed to insert payment record", paymentInsertError);
  }
}

async function recordFailedPayment(
  admin: AdminClient,
  intent: Stripe.PaymentIntent,
  event: Stripe.Event,
): Promise<void> {
  const invoiceId = intent.metadata?.invoice_id;
  if (!invoiceId) return;

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id, client_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoiceError || !invoice) throw new Error("Failed PaymentIntent invoice was not found");

  const { error: insertError } = await admin.from("payments").insert({
    invoice_id: invoice.id,
    client_id: invoice.client_id,
    amount: Number(intent.amount) / 100,
    currency: String(intent.currency || invoice.currency || "GBP").toUpperCase(),
    payment_date: new Date(event.created * 1000).toISOString(),
    method: "stripe",
    status: "failed",
    provider: "stripe",
    provider_payment_id: intent.id,
    provider_event_id: event.id,
    idempotency_key: `stripe-event:${event.id}`,
    reconciliation_state: "unmatched",
    failure_reason: intent.last_payment_error?.message?.slice(0, 1000) || "Payment failed",
  });
  if (insertError?.code !== "23505" && insertError) throw insertError;
}

async function handlePaymentIntentFailed(
  admin: AdminClient,
  intent: Stripe.PaymentIntent,
  event: Stripe.Event,
): Promise<void> {
  const projectReference = intent.metadata?.project_reference;
  if (!projectReference) return;

  const paymentType = intent.metadata?.payment_type;
  if (paymentType !== "website_starting_payment") return;

  const { data: order, error: orderError } = await admin
    .from("dfp_checkout_orders")
    .select("id, payment_status")
    .eq("project_reference", projectReference)
    .maybeSingle();

  if (orderError || !order) return;

  if (order.payment_status === "paid") return;

  const { error: updateError } = await admin
    .from("dfp_checkout_orders")
    .update({
      payment_status: "payment_failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("payment_status", "pending");

  if (updateError) {
    console.error("Failed to update order payment status to failed", updateError);
  }
}

async function recordRefunds(
  admin: AdminClient,
  charge: Stripe.Charge,
  event: Stripe.Event,
): Promise<void> {
  const intentId = paymentIntentId(charge.payment_intent);
  if (!intentId) return;

  for (const refund of charge.refunds?.data ?? []) {
    if (refund.status !== "succeeded") continue;

    const { error: rpcError } = await admin.rpc("record_stripe_refund", {
      p_payment_intent_id: intentId,
      p_event_id: event.id,
      p_refund_id: refund.id,
      p_amount_minor: refund.amount,
      p_currency: refund.currency,
      p_reason: refund.reason || "requested_by_customer",
      p_refunded_at: new Date(refund.created * 1000).toISOString(),
    });
    if (rpcError) throw rpcError;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("stripe-webhook missing required secrets");
    return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    console.error(
      "Stripe signature verification failed",
      error instanceof Error ? error.message : error,
    );
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: ledgerError } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    status: "processing",
    object_id: objectId(event),
  });
  if (ledgerError?.code === "23505") {
    const { data: existing, error: existingError } = await admin
      .from("stripe_webhook_events")
      .select("status")
      .eq("event_id", event.id)
      .maybeSingle();
    if (existingError || !existing) {
      return Response.json({ error: "Unable to read webhook ledger" }, { status: 500 });
    }
    if (existing.status === "processed") {
      return Response.json({ received: true, duplicate: true });
    }
    if (existing.status === "processing") {
      return Response.json({ error: "Webhook event is already processing" }, { status: 409 });
    }
    const { error: retryError } = await admin
      .from("stripe_webhook_events")
      .update({ status: "processing", processed_at: null, error_message: null })
      .eq("event_id", event.id)
      .eq("status", "failed");
    if (retryError) {
      return Response.json({ error: "Unable to retry webhook event" }, { status: 500 });
    }
  }
  if (ledgerError && ledgerError.code !== "23505") {
    console.error("Unable to create Stripe event ledger entry", ledgerError);
    return Response.json({ error: "Unable to record webhook" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") {
          break;
        }
        const type = session.metadata?.type;
        if (type === "website_starting_payment") {
          await completeWebsiteStartingPayment(admin, session, event);
        } else if (type === "invoice_payment" || session.metadata?.invoice_id) {
          await completeInvoicePayment(admin, session, event);
        } else if (type === "milestone_payment") {
          await completeMilestonePayment(admin, session);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const projectReference = session.metadata?.project_reference;
        const type = session.metadata?.type;
        if (type === "website_starting_payment" && projectReference) {
          const { error: updateError } = await admin
            .from("dfp_checkout_orders")
            .update({
              payment_status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("project_reference", projectReference)
            .eq("payment_status", "pending");
          if (updateError) console.error("Failed to mark order cancelled on expiry", updateError);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(admin, intent, event);
        await recordFailedPayment(admin, intent, event);
        break;
      }
      case "charge.refunded": {
        await recordRefunds(admin, event.data.object as Stripe.Charge, event);
        break;
      }
      default:
        break;
    }

    const { error: processedError } = await admin
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("event_id", event.id);
    if (processedError) throw processedError;

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook processing error";
    await admin
      .from("stripe_webhook_events")
      .update({
        status: "failed",
        processed_at: new Date().toISOString(),
        error_message: message.slice(0, 2000),
      })
      .eq("event_id", event.id);
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      message,
    });

    const alertTitle = `Stripe webhook failed: ${event.type}`;
    const { data: existingAlert } = await admin
      .from("digital_footprint_alerts")
      .select("id")
      .eq("source", "payment")
      .eq("title", alertTitle)
      .eq("is_resolved", false)
      .maybeSingle();
    if (!existingAlert) {
      await admin.from("digital_footprint_alerts").insert({
        alert_type: "critical",
        title: alertTitle,
        description: `Event ${event.id} failed to process and payment/refund recording may be incomplete. ${message.slice(0, 300)}`,
        source: "payment",
        is_read: false,
        is_resolved: false,
      });
    }

    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
});
