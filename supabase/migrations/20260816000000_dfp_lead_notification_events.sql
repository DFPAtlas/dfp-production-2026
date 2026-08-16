create table if not exists public.lead_notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  source_table text not null,
  source_id text not null,
  notification_type text not null,
  recipient text not null,
  state text not null default 'queued',
  provider_message_id text,
  attempts integer not null default 1,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lead_notification_events_source_idx
  on public.lead_notification_events (source_table, source_id);

alter table public.lead_notification_events enable row level security;

create policy "lead_notification_events_internal_select"
  on public.lead_notification_events
  for select
  to authenticated
  using (app_private.is_internal());