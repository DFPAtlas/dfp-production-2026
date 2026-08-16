-- DFP UAT Phase 2C-1: Monitoring Backend, Consent and Event Ingestion
-- Safe additive migration. Executed in steps due to array/jsonb default constraints.

-- 1. uat_monitoring_settings
CREATE TABLE IF NOT EXISTS public.uat_monitoring_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.uat_projects(id) on delete cascade,
  environment_id uuid references public.uat_environments(id) on delete set null,
  monitoring_enabled boolean not null default false,
  capture_navigation boolean not null default true,
  capture_visibility boolean not null default true,
  capture_console_errors boolean not null default true,
  capture_unhandled_rejections boolean not null default true,
  capture_failed_requests boolean not null default true,
  capture_slow_requests boolean not null default true,
  capture_performance boolean not null default true,
  slow_request_threshold_ms integer not null default 3000,
  allowed_origins text[] not null,
  masked_url_parameters text[] not null,
  blocked_url_patterns text[] not null,
  retention_days integer not null default 90,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_ums_project ON public.uat_monitoring_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_ums_environment ON public.uat_monitoring_settings(environment_id);
CREATE INDEX IF NOT EXISTS idx_ums_enabled ON public.uat_monitoring_settings(monitoring_enabled);

-- 2. uat_monitoring_acknowledgements
CREATE TABLE IF NOT EXISTS public.uat_monitoring_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid not null references public.uat_testers(id) on delete cascade,
  assignment_id uuid not null references public.uat_assignments(id) on delete cascade,
  session_id uuid references public.uat_sessions(id) on delete set null,
  notice_version text not null,
  monitoring_categories jsonb not null,
  acknowledged_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_uma_tester ON public.uat_monitoring_acknowledgements(tester_id);
CREATE INDEX IF NOT EXISTS idx_uma_assignment ON public.uat_monitoring_acknowledgements(assignment_id);
CREATE INDEX IF NOT EXISTS idx_uma_session ON public.uat_monitoring_acknowledgements(session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uma_unique_active
  ON public.uat_monitoring_acknowledgements(tester_id, assignment_id, notice_version)
  WHERE withdrawn_at IS NULL;

-- 3. uat_session_events
CREATE TABLE IF NOT EXISTS public.uat_session_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.uat_projects(id) on delete cascade,
  environment_id uuid references public.uat_environments(id) on delete set null,
  assignment_id uuid not null references public.uat_assignments(id) on delete cascade,
  session_id uuid not null references public.uat_sessions(id) on delete cascade,
  tester_id uuid not null references public.uat_testers(id) on delete cascade,
  assignment_test_case_id uuid references public.uat_assignment_test_cases(id) on delete set null,
  event_type text not null,
  event_timestamp timestamptz not null default now(),
  page_url text,
  page_path text,
  page_title text,
  event_name text,
  severity text,
  message text,
  source_file text,
  source_line integer,
  source_column integer,
  request_method text,
  request_path text,
  response_status integer,
  duration_ms integer,
  performance_data jsonb,
  safe_metadata jsonb,
  event_hash text,
  created_at timestamptz not null default now(),
  constraint uat_session_events_type_check check (
    event_type in (
      'session_started', 'session_resumed', 'session_paused', 'session_finished',
      'heartbeat', 'page_view', 'route_change', 'page_hidden', 'page_visible',
      'javascript_error', 'unhandled_rejection', 'api_failure', 'api_slow',
      'performance', 'tester_checkpoint', 'monitoring_started', 'monitoring_stopped'
    )
  ),
  constraint uat_session_events_severity_check check (
    severity is null or severity in ('debug', 'info', 'warning', 'error', 'critical')
  ),
  constraint uat_session_events_message_len check (char_length(coalesce(message, '')) <= 2000),
  constraint uat_session_events_metadata_size check (octet_length(coalesce(safe_metadata::text, '')) <= 16384)
);

CREATE INDEX IF NOT EXISTS idx_use_session ON public.uat_session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_use_assignment ON public.uat_session_events(assignment_id);
CREATE INDEX IF NOT EXISTS idx_use_tester ON public.uat_session_events(tester_id);
CREATE INDEX IF NOT EXISTS idx_use_project ON public.uat_session_events(project_id);
CREATE INDEX IF NOT EXISTS idx_use_type ON public.uat_session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_use_timestamp ON public.uat_session_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_use_status ON public.uat_session_events(response_status);
CREATE INDEX IF NOT EXISTS idx_use_severity ON public.uat_session_events(severity);
CREATE INDEX IF NOT EXISTS idx_use_hash ON public.uat_session_events(event_hash);

-- 4. Enable RLS
ALTER TABLE public.uat_monitoring_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uat_monitoring_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uat_session_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: uat_monitoring_settings
CREATE POLICY testers_read_monitoring_settings ON public.uat_monitoring_settings FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.uat_testers t
    where t.user_id = auth.uid() and t.status = 'approved'
    and exists (
      select 1 from public.uat_assignments a
      join public.uat_jobs j on a.job_id = j.id
      where a.tester_id = t.id and j.project_id = uat_monitoring_settings.project_id
    )
  )
);

CREATE POLICY staff_manage_monitoring_settings ON public.uat_monitoring_settings FOR ALL TO authenticated USING (
  exists (select 1 from public.admin_profiles where id = auth.uid() and active = true)
);

-- 6. RLS Policies: uat_monitoring_acknowledgements
CREATE POLICY testers_read_own_acks ON public.uat_monitoring_acknowledgements FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.uat_testers t
    where t.user_id = auth.uid() and t.status = 'approved'
    and t.id = tester_id
  )
);

CREATE POLICY staff_read_all_acks ON public.uat_monitoring_acknowledgements FOR SELECT TO authenticated USING (
  exists (select 1 from public.admin_profiles where id = auth.uid() and active = true)
);

-- 7. RLS Policies: uat_session_events
CREATE POLICY testers_read_own_events ON public.uat_session_events FOR SELECT TO authenticated USING (
  exists (
    select 1 from public.uat_testers t
    where t.user_id = auth.uid() and t.status = 'approved'
    and t.id = tester_id
  )
);

CREATE POLICY staff_read_all_events ON public.uat_session_events FOR SELECT TO authenticated USING (
  exists (select 1 from public.admin_profiles where id = auth.uid() and active = true)
);

-- 8. acknowledge_uat_monitoring RPC function
CREATE OR REPLACE FUNCTION public.acknowledge_uat_monitoring(
  p_assignment_id uuid,
  p_session_id uuid,
  p_notice_version text,
  p_monitoring_categories jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_tester_id uuid;
  v_existing uuid;
  v_ack_id uuid;
begin
  v_tester_id := public.resolve_tester_from_auth();

  if not exists (
    select 1 from public.uat_assignments a
    where a.id = p_assignment_id and a.tester_id = v_tester_id
  ) then
    return jsonb_build_object('success', false, 'message', 'Assignment not found or not yours.');
  end if;

  if p_session_id is not null and not exists (
    select 1 from public.uat_sessions s
    where s.id = p_session_id and s.assignment_id = p_assignment_id and s.tester_id = v_tester_id
  ) then
    return jsonb_build_object('success', false, 'message', 'Session not found or not yours.');
  end if;

  select id into v_existing
  from public.uat_monitoring_acknowledgements
  where tester_id = v_tester_id
    and assignment_id = p_assignment_id
    and notice_version = p_notice_version
    and withdrawn_at is null
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('success', true, 'id', v_existing, 'message', 'Already acknowledged.');
  end if;

  insert into public.uat_monitoring_acknowledgements
    (tester_id, assignment_id, session_id, notice_version, monitoring_categories)
  values
    (v_tester_id, p_assignment_id, p_session_id, p_notice_version, p_monitoring_categories)
  returning id into v_ack_id;

  return jsonb_build_object('success', true, 'id', v_ack_id, 'message', 'Acknowledgement recorded.');
end;
$$;