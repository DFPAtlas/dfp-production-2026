-- DFP FIX 15 — Stripe RPC least-privilege repair.
-- Re-applies the REVOKE that was part of 20260813000000 but did not land in the
-- live database. Restricts the two financial RPCs to the server-side Stripe
-- webhook (service_role) only. Idempotent and safe to re-run.

revoke all on function public.record_stripe_invoice_payment(
  uuid, bigint, text, text, text, text, timestamp with time zone
) from public, anon, authenticated;
grant execute on function public.record_stripe_invoice_payment(
  uuid, bigint, text, text, text, text, timestamp with time zone
) to service_role;

revoke all on function public.record_stripe_refund(
  text, text, text, bigint, text, text, timestamp with time zone
) from public, anon, authenticated;
grant execute on function public.record_stripe_refund(
  text, text, text, bigint, text, text, timestamp with time zone
) to service_role;