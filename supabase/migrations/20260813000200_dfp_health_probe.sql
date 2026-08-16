create table if not exists public.dfp_service_health (
  id uuid primary key default gen_random_uuid(),
  service text not null unique,
  display_name text not null,
  category text not null default 'core',
  status text not null default 'unknown',
  status_code integer,
  response_time_ms integer,
  message text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dfp_health_checks (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  status text not null,
  status_code integer,
  response_time_ms integer,
  message text,
  error_code text,
  checked_at timestamptz not null default now()
);

create index if not exists dfp_health_checks_service_checked_idx
  on public.dfp_health_checks (service, checked_at desc);

alter table public.dfp_service_health enable row level security;
alter table public.dfp_health_checks enable row level security;

create policy "internal read dfp_service_health"
  on public.dfp_service_health
  for select to authenticated
  using (app_private.is_internal());

create policy "internal read dfp_health_checks"
  on public.dfp_health_checks
  for select to authenticated
  using (app_private.is_internal());

insert into public.dfp_service_health (service, display_name, category, status)
values
  ('website', 'Public Website', 'availability', 'unknown'),
  ('supabase_database', 'Supabase Database', 'supabase', 'unknown'),
  ('supabase_auth', 'Supabase Auth', 'supabase', 'unknown'),
  ('supabase_storage', 'Supabase Storage', 'supabase', 'unknown')
on conflict (service) do nothing;