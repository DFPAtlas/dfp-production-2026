-- DFP FIX 32 — Materialize health scheduler + remove localhost fallback references
-- This migration creates the pg_cron job that invokes the health probe automatically.

-- 1. Idempotent Vault secret for scheduler authentication token
do $$
declare
  secret_exists boolean;
begin
  select exists(select 1 from vault.decrypted_secrets where name = 'dfp_scheduler_secret') into secret_exists;
  if not secret_exists then
    perform vault.create_secret(gen_random_uuid()::text, 'dfp_scheduler_secret');
  end if;
end $$;

-- 2. RPC function to verify scheduler token (security definer so it can read Vault)
create or replace function public.dfp_verify_scheduler_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  return exists (
    select 1
    from vault.decrypted_secrets
    where name = 'dfp_scheduler_secret'
      and decrypted_secret = p_token
  );
end;
$$;

-- 3. Ensure all expected services are seeded (idempotent)
insert into public.dfp_service_health (service, display_name, category, status, environment)
values
  ('website', 'Public Website', 'availability', 'unknown', 'production'),
  ('supabase_database', 'Supabase Database', 'supabase', 'unknown', 'production'),
  ('supabase_auth', 'Supabase Auth', 'supabase', 'unknown', 'production'),
  ('supabase_storage', 'Supabase Storage', 'supabase', 'unknown', 'production'),
  ('stripe', 'Stripe Payments', 'payments', 'not_configured', 'production'),
  ('email_resend', 'Email (Resend)', 'communications', 'not_configured', 'production'),
  ('n8n', 'n8n Automation', 'automation', 'not_configured', 'production'),
  ('pbx', 'PBX Telephony', 'communications', 'not_configured', 'production'),
  ('uat_worker', 'UAT Worker', 'testing', 'not_configured', 'production'),
  ('backups', 'Backups', 'data', 'unknown', 'production'),
  ('deployment', 'Deployment', 'delivery', 'unknown', 'production')
on conflict (service) do update set
  display_name = excluded.display_name,
  category = excluded.category,
  environment = excluded.environment;

-- 4. pg_cron job to invoke health probe every 10 minutes
do $$
begin
  if exists (select 1 from cron.job where jobname = 'dfp-health-probe-auto') then
    perform cron.unschedule('dfp-health-probe-auto');
  end if;

  perform cron.schedule(
    'dfp-health-probe-auto',
    '*/10 * * * *',
    $cron$
      select net.http_post(
        url := 'https://zjqftnkrmqhmbrtkvafy.supabase.co/functions/v1/dfp-health-probe',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-DFP-Scheduler-Token', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'dfp_scheduler_secret'
            order by created_at desc
            limit 1
          )
        ),
        body := '{}'::jsonb
      ) as request_id;
    $cron$
  );
end $$;

-- 5. Update scheduler state
insert into public.dfp_health_scheduler_state (id, enabled, interval_minutes, mechanism, last_auto_run_at, last_auto_run_status)
values (true, true, 10, 'pg_cron', null, null)
on conflict (id) do update set
  enabled = true,
  interval_minutes = 10,
  mechanism = 'pg_cron',
  updated_at = now();