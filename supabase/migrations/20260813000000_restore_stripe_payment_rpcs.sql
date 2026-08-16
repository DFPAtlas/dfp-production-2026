-- Restore Stripe invoice payment + refund RPCs.
-- Compatibiltiy + idempotency corrections for the current live schema.

alter table public.invoices
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists refunds_provider_refund_id_uidx
  on public.refunds (provider_refund_id)
  where provider_refund_id is not null;

create or replace function public.record_stripe_invoice_payment(
  p_invoice_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_payment_intent_id text,
  p_event_id text,
  p_checkout_session_id text,
  p_paid_at timestamp with time zone
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_invoice public.invoices%rowtype;
  v_amount numeric(18, 2);
  v_total numeric(18, 2);
  v_previous_paid numeric(18, 2);
  v_new_paid numeric(18, 2);
  v_outstanding numeric(18, 2);
  v_payment_id uuid;
begin
  if current_user not in ('service_role', 'postgres') then
    raise exception 'Stripe payment function is restricted to service role';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Stripe payment amount must be positive';
  end if;
  if coalesce(p_payment_intent_id, '') = '' or coalesce(p_event_id, '') = '' then
    raise exception 'Stripe payment identifiers are required';
  end if;

  if exists (
    select 1 from public.payments
    where idempotency_key = 'stripe-event:' || p_event_id
  ) then
    return jsonb_build_object('duplicate', true);
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice % was not found', p_invoice_id;
  end if;
  if lower(coalesce(v_invoice.currency, 'GBP')) <> lower(coalesce(p_currency, '')) then
    raise exception 'Stripe payment currency does not match invoice currency';
  end if;

  v_amount := round((p_amount_minor::numeric / 100), 2);
  v_total := round(coalesce(v_invoice.total, v_invoice.amount), 2);
  v_previous_paid := round(coalesce(v_invoice.amount_paid, 0), 2);
  v_outstanding := round(
    coalesce(v_invoice.amount_outstanding, greatest(0, v_total - v_previous_paid)),
    2
  );

  if v_amount <> v_outstanding then
    raise exception 'Stripe payment amount does not match outstanding invoice balance';
  end if;

  insert into public.payments (
    invoice_id,
    client_id,
    amount,
    currency,
    payment_date,
    method,
    status,
    provider,
    provider_payment_id,
    provider_event_id,
    idempotency_key,
    reconciliation_state,
    confirmed_at,
    confirmation_reason
  )
  values (
    v_invoice.id,
    v_invoice.client_id,
    v_amount,
    upper(p_currency),
    coalesce(p_paid_at, now()),
    'stripe',
    'succeeded',
    'stripe',
    p_payment_intent_id,
    p_event_id,
    'stripe-event:' || p_event_id,
    'matched',
    now(),
    'Verified Stripe webhook'
  )
  returning id into v_payment_id;

  v_new_paid := least(v_total, v_previous_paid + v_amount);
  update public.invoices
  set
    amount_paid = v_new_paid,
    amount_outstanding = greatest(0, v_total - v_new_paid),
    status = case when v_new_paid >= v_total then 'paid' else 'partially_paid' end,
    paid_at = case when v_new_paid >= v_total then coalesce(p_paid_at, now()) else paid_at end,
    stripe_payment_intent_id = p_payment_intent_id,
    stripe_checkout_session_id = p_checkout_session_id,
    updated_at = now()
  where id = v_invoice.id;

  return jsonb_build_object(
    'duplicate', false,
    'payment_id', v_payment_id,
    'invoice_id', v_invoice.id,
    'amount', v_amount
  );
end;
$$;

create or replace function public.record_stripe_refund(
  p_payment_intent_id text,
  p_event_id text,
  p_refund_id text,
  p_amount_minor bigint,
  p_currency text,
  p_reason text,
  p_refunded_at timestamp with time zone
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_amount numeric(18, 2);
  v_refund_id uuid;
  v_total_refunded numeric(18, 2);
  v_invoice_total numeric(18, 2);
  v_new_paid numeric(18, 2);
begin
  if current_user not in ('service_role', 'postgres') then
    raise exception 'Stripe refund function is restricted to service role';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Stripe refund amount must be positive';
  end if;
  if coalesce(p_payment_intent_id, '') = '' or coalesce(p_refund_id, '') = '' then
    raise exception 'Stripe refund identifiers are required';
  end if;

  if exists (
    select 1 from public.refunds where provider_refund_id = p_refund_id
  ) then
    return jsonb_build_object('duplicate', true);
  end if;

  select *
  into v_payment
  from public.payments
  where provider = 'stripe'
    and provider_payment_id = p_payment_intent_id
    and status <> 'failed'
  for update;

  if not found then
    raise exception 'Stripe payment % was not found', p_payment_intent_id;
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice for Stripe payment was not found';
  end if;
  if lower(v_payment.currency) <> lower(coalesce(p_currency, '')) then
    raise exception 'Stripe refund currency does not match payment currency';
  end if;

  v_amount := round((p_amount_minor::numeric / 100), 2);
  insert into public.refunds (
    payment_id,
    invoice_id,
    amount,
    currency,
    reason,
    status,
    provider_refund_id,
    processed_at,
    notes
  )
  values (
    v_payment.id,
    v_payment.invoice_id,
    v_amount,
    upper(p_currency),
    p_reason,
    'completed',
    p_refund_id,
    coalesce(p_refunded_at, now()),
    'Verified Stripe webhook event ' || p_event_id
  )
  returning id into v_refund_id;

  select coalesce(sum(amount), 0)
  into v_total_refunded
  from public.refunds
  where payment_id = v_payment.id and status = 'completed';

  update public.payments
  set
    status = case
      when v_total_refunded >= amount then 'refunded'
      else 'partially_refunded'
    end,
    updated_at = now()
  where id = v_payment.id;

  v_invoice_total := round(coalesce(v_invoice.total, v_invoice.amount), 2);
  v_new_paid := greatest(0, round(coalesce(v_invoice.amount_paid, 0) - v_amount, 2));
  update public.invoices
  set
    amount_paid = v_new_paid,
    amount_outstanding = greatest(0, v_invoice_total - v_new_paid),
    status = case when v_new_paid > 0 then 'partially_paid' else 'issued' end,
    paid_at = case when v_new_paid < v_invoice_total then null else paid_at end,
    updated_at = now()
  where id = v_invoice.id;

  return jsonb_build_object(
    'duplicate', false,
    'refund_id', v_refund_id,
    'invoice_id', v_invoice.id,
    'amount', v_amount
  );
end;
$$;

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