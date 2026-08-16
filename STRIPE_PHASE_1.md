# Stripe Phase 1 deployment guide

This branch establishes the secure one-time payment foundation for Digital
Footprint. It does not yet add subscription Checkout, Customer Portal, Stripe
Invoicing or Terminal.

## Required Supabase secrets

Configure these in the Supabase project. Never commit their values:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://digital-footprint.uk
```

Use test-mode values until the complete payment test plan passes.

## Deployment order

1. Apply `supabase/migrations/20260726220000_stripe_phase_1_foundation.sql`.
2. Deploy `create-checkout` with JWT verification enabled.
3. Deploy `milestone-checkout` with JWT verification enabled.
4. Deploy `stripe-webhook` with JWT verification disabled. This endpoint
   authenticates Stripe using the mandatory webhook signature.
5. Configure the Stripe webhook endpoint for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
6. Point Stripe to:
   `https://zjqftnkrmqhmbrtkvafy.supabase.co/functions/v1/stripe-webhook`

## Test-mode acceptance checks

- An unauthenticated Checkout request returns 401.
- A client cannot pay another client's invoice.
- Browser-supplied amounts and customer emails are ignored.
- Paid, cancelled, disputed and draft invoices cannot open Checkout.
- Checkout charges exactly the invoice outstanding balance.
- Repeated Checkout creation returns the same logical Stripe operation.
- An unsigned or incorrectly signed webhook returns 400.
- A repeated Stripe event is acknowledged without creating another payment.
- A successful payment creates one `payments` row and closes the balance.
- A failed PaymentIntent creates one failed payment record.
- A full refund creates one refund and reopens the invoice balance.
- A partial refund changes both the payment and invoice to partial states.

## Deferred to later phases

- Stripe Products and recurring Prices
- Subscription Checkout and Customer Portal
- Stripe-hosted Invoices and invoice PDFs
- Smart Retries and subscription entitlement handling
- Terminal locations, readers and in-person PaymentIntents
- Live-mode keys and production launch

