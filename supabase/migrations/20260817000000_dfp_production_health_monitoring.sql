alter table public.dfp_service_health
  add column if not exists environment text not null default 'production';

create table if not exists public.dfp_health_scheduler_state (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  interval_minutes integer not null default 10,
  mechanism text not null default 'supabase_scheduled_function',
  last_auto_run_at timestamptz,
  last_auto_run_status text,
  updated_at timestamptz not null default now()
);

alter table public.dfp_health_scheduler_state enable row level security;

create policy "internal read dfp_health_scheduler_state"
  on public.dfp_health_scheduler_state
  for select to authenticated
  using (app_private.is_internal());

insert into public.dfp_service_health (service, display_name, category, status)
values
  ('website', 'Public Website', 'availability', 'unknown'),
  ('supabase_database', 'Supabase Database', 'supabase', 'unknown'),
  ('supabase_auth', 'Supabase Auth', 'supabase', 'unknown'),
  ('supabase_storage', 'Supabase Storage', 'supabase', 'unknown'),
  ('stripe', 'Stripe Payments', 'payments', 'not_configured'),
  ('email_resend', 'Email (Resend)', 'communications', 'not_configured'),
  ('n8n', 'n8n Automation', 'automation', 'not_configured'),
  ('pbx', 'PBX Telephony', 'communications', 'not_configured'),
  ('uat_worker', 'UAT Worker', 'testing', 'not_configured'),
  ('backups', 'Backups', 'data', 'unknown'),
  ('deployment', 'Deployment', 'delivery', 'unknown')
on conflict (service) do nothing;

insert into public.dfp_health_scheduler_state (id, enabled, interval_minutes, mechanism)
values (true, true, 10, 'supabase_scheduled_function')
on conflict (id) do nothing;