-- DFP UAT Phase 2A — Test Suites, Cases, Sessions & Results
-- Additive migration: extends existing tables, creates new ones

begin;

-- ============================================================================
-- 1. EXTEND uat_test_cases with suite-oriented columns
-- ============================================================================
alter table public.uat_test_cases
  add column if not exists suite_id uuid,
  add column if not exists project_id uuid references public.uat_projects(id) on delete set null,
  add column if not exists job_id uuid references public.uat_jobs(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  add column if not exists case_status text not null default 'draft' check (case_status in ('draft', 'active', 'archived')),
  add column if not exists sort_order integer not null default 0,
  add column if not exists estimated_minutes integer,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists archived_at timestamp with time zone;

create index if not exists idx_uat_test_cases_suite on public.uat_test_cases (suite_id);
create index if not exists idx_uat_test_cases_project on public.uat_test_cases (project_id);
create index if not exists idx_uat_test_cases_job on public.uat_test_cases (job_id);
create index if not exists idx_uat_test_cases_case_status on public.uat_test_cases (case_status);
create index if not exists idx_uat_test_cases_priority on public.uat_test_cases (priority);

-- ============================================================================
-- 2. CREATE uat_test_suites
-- ============================================================================
create table if not exists public.uat_test_suites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.uat_projects(id) on delete cascade,
  job_id uuid references public.uat_jobs(id) on delete set null,
  name text not null,
  description text,
  testing_type text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  archived_at timestamp with time zone
);

create index if not exists idx_uat_test_suites_project on public.uat_test_suites (project_id);
create index if not exists idx_uat_test_suites_job on public.uat_test_suites (job_id);
create index if not exists idx_uat_test_suites_status on public.uat_test_suites (status);

-- ============================================================================
-- 3. CREATE uat_test_case_steps
-- ============================================================================
create table if not exists public.uat_test_case_steps (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid not null references public.uat_test_cases(id) on delete cascade,
  step_number integer not null,
  instruction text not null,
  expected_result text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(test_case_id, step_number)
);

create index if not exists idx_uat_test_case_steps_case on public.uat_test_case_steps (test_case_id);

-- ============================================================================
-- 4. CREATE uat_assignment_test_cases
-- ============================================================================
create table if not exists public.uat_assignment_test_cases (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.uat_assignments(id) on delete cascade,
  test_case_id uuid not null references public.uat_test_cases(id) on delete cascade,
  tester_id uuid not null references public.uat_testers(id) on delete cascade,
  sort_order integer not null default 0,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'passed', 'failed', 'blocked', 'skipped', 'needs_retest')),
  assigned_at timestamp with time zone not null default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(assignment_id, test_case_id)
);

create index if not exists idx_uat_assignment_tc_assignment on public.uat_assignment_test_cases (assignment_id);
create index if not exists idx_uat_assignment_tc_tester on public.uat_assignment_test_cases (tester_id);
create index if not exists idx_uat_assignment_tc_status on public.uat_assignment_test_cases (status);
create index if not exists idx_uat_assignment_tc_test_case on public.uat_assignment_test_cases (test_case_id);

-- ============================================================================
-- 5. EXTEND uat_sessions
-- ============================================================================
alter table public.uat_sessions
  add column if not exists project_id uuid references public.uat_projects(id) on delete set null,
  add column if not exists job_id uuid references public.uat_jobs(id) on delete set null,
  add column if not exists paused_at timestamp with time zone,
  add column if not exists resumed_at timestamp with time zone,
  add column if not exists finished_at timestamp with time zone,
  add column if not exists last_activity_at timestamp with time zone not null default now(),
  add column if not exists active_seconds integer not null default 0,
  add column if not exists pause_seconds integer not null default 0,
  add column if not exists browser_name text,
  add column if not exists browser_version text,
  add column if not exists operating_system text,
  add column if not exists viewport_width integer,
  add column if not exists viewport_height integer,
  add column if not exists user_agent text;

alter table public.uat_sessions
  alter column status type text,
  alter column status set default 'active',
  drop constraint if exists uat_sessions_status_check;

alter table public.uat_sessions
  add constraint uat_sessions_status_check check (status in ('active', 'paused', 'completed', 'abandoned', 'expired'));

create index if not exists idx_uat_sessions_status on public.uat_sessions (status);
create index if not exists idx_uat_sessions_tester on public.uat_sessions (tester_id);
create index if not exists idx_uat_sessions_assignment on public.uat_sessions (assignment_id);

-- ============================================================================
-- 6. CREATE uat_test_case_results
-- ============================================================================
create table if not exists public.uat_test_case_results (
  id uuid primary key default gen_random_uuid(),
  assignment_test_case_id uuid not null references public.uat_assignment_test_cases(id) on delete cascade,
  assignment_id uuid not null references public.uat_assignments(id) on delete cascade,
  test_case_id uuid not null references public.uat_test_cases(id) on delete cascade,
  session_id uuid not null references public.uat_sessions(id) on delete cascade,
  tester_id uuid not null references public.uat_testers(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'passed', 'failed', 'blocked', 'skipped', 'needs_retest')),
  actual_result text,
  tester_notes text,
  blocker_reason text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_seconds integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_uat_tc_results_assignment on public.uat_test_case_results (assignment_id);
create index if not exists idx_uat_tc_results_session on public.uat_test_case_results (session_id);
create index if not exists idx_uat_tc_results_tester on public.uat_test_case_results (tester_id);
create index if not exists idx_uat_tc_results_test_case on public.uat_test_case_results (test_case_id);
create index if not exists idx_uat_tc_results_status on public.uat_test_case_results (status);
create index if not exists idx_uat_tc_results_assign_tc on public.uat_test_case_results (assignment_test_case_id);

-- ============================================================================
-- 7. EXTEND uat_feedback with test-case linking columns
-- ============================================================================
alter table public.uat_feedback
  add column if not exists assignment_test_case_id uuid references public.uat_assignment_test_cases(id) on delete set null,
  add column if not exists session_id uuid references public.uat_sessions(id) on delete set null;

-- ============================================================================
-- 8. ENABLE RLS on new tables
-- ============================================================================
alter table public.uat_test_suites enable row level security;
alter table public.uat_test_case_steps enable row level security;
alter table public.uat_assignment_test_cases enable row level security;
alter table public.uat_sessions enable row level security;
alter table public.uat_test_case_results enable row level security;

-- ============================================================================
-- 9. RLS POLICIES: uat_test_suites
-- ============================================================================
drop policy if exists "staff_manage_test_suites" on public.uat_test_suites;
create policy "staff_manage_test_suites" on public.uat_test_suites
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

drop policy if exists "testers_read_assigned_suites" on public.uat_test_suites;
create policy "testers_read_assigned_suites" on public.uat_test_suites
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_assignments a
      join public.uat_testers t on t.id = a.tester_id
      where a.project_id = uat_test_suites.project_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

-- ============================================================================
-- 10. RLS POLICIES: uat_test_cases (tester read)
-- ============================================================================
drop policy if exists "testers_read_assigned_cases" on public.uat_test_cases;
create policy "testers_read_assigned_cases" on public.uat_test_cases
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_assignment_test_cases atc
      join public.uat_testers t on t.id = atc.tester_id
      where atc.test_case_id = uat_test_cases.id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
    or
    exists (
      select 1 from public.uat_test_suites s
      join public.uat_assignments a on a.project_id = s.project_id
      join public.uat_testers t on t.id = a.tester_id
      where s.id = uat_test_cases.suite_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

-- ============================================================================
-- 11. RLS POLICIES: uat_test_case_steps
-- ============================================================================
drop policy if exists "testers_read_assigned_steps" on public.uat_test_case_steps;
create policy "testers_read_assigned_steps" on public.uat_test_case_steps
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_assignment_test_cases atc
      join public.uat_testers t on t.id = atc.tester_id
      where atc.test_case_id = uat_test_case_steps.test_case_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "staff_manage_case_steps" on public.uat_test_case_steps;
create policy "staff_manage_case_steps" on public.uat_test_case_steps
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- 12. RLS POLICIES: uat_assignment_test_cases
-- ============================================================================
drop policy if exists "testers_read_own_assignment_cases" on public.uat_assignment_test_cases;
create policy "testers_read_own_assignment_cases" on public.uat_assignment_test_cases
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_assignment_test_cases.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_update_own_assignment_cases" on public.uat_assignment_test_cases;
create policy "testers_update_own_assignment_cases" on public.uat_assignment_test_cases
  for update to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_assignment_test_cases.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_assignment_test_cases.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "staff_manage_assignment_cases" on public.uat_assignment_test_cases;
create policy "staff_manage_assignment_cases" on public.uat_assignment_test_cases
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- 13. RLS POLICIES: uat_sessions
-- ============================================================================
drop policy if exists "testers_read_own_sessions" on public.uat_sessions;
create policy "testers_read_own_sessions" on public.uat_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_sessions.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_insert_own_sessions" on public.uat_sessions;
create policy "testers_insert_own_sessions" on public.uat_sessions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_sessions.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_update_own_sessions" on public.uat_sessions;
create policy "testers_update_own_sessions" on public.uat_sessions
  for update to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_sessions.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "staff_read_all_sessions" on public.uat_sessions;
create policy "staff_read_all_sessions" on public.uat_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- 14. RLS POLICIES: uat_test_case_results
-- ============================================================================
drop policy if exists "testers_read_own_results" on public.uat_test_case_results;
create policy "testers_read_own_results" on public.uat_test_case_results
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_test_case_results.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_insert_own_results" on public.uat_test_case_results;
create policy "testers_insert_own_results" on public.uat_test_case_results
  for insert to authenticated
  with check (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_test_case_results.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_update_own_results" on public.uat_test_case_results;
create policy "testers_update_own_results" on public.uat_test_case_results
  for update to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_test_case_results.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "staff_read_all_results" on public.uat_test_case_results;
create policy "staff_read_all_results" on public.uat_test_case_results
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- 15. RPC FUNCTION: resolve_tester_from_auth
-- ============================================================================
create or replace function public.resolve_tester_from_auth()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
begin
  select t.id into v_tester_id
  from public.uat_testers t
  where t.user_id = auth.uid()
  and t.status = 'approved'
  limit 1;

  if v_tester_id is null then
    raise exception 'Approved tester not found for authenticated user';
  end if;

  return v_tester_id;
end;
$$;

-- ============================================================================
-- 16. RPC FUNCTION: start_uat_session
-- ============================================================================
create or replace function public.start_uat_session(
  p_assignment_id uuid,
  p_browser_name text default null,
  p_browser_version text default null,
  p_operating_system text default null,
  p_viewport_width integer default null,
  p_viewport_height integer default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_assignment public.uat_assignments%rowtype;
  v_existing_session_id uuid;
  v_session_id uuid;
  v_project_id uuid;
  v_job_id uuid;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_assignment
  from public.uat_assignments
  where id = p_assignment_id
  and tester_id = v_tester_id;

  if v_assignment.id is null then
    return jsonb_build_object('success', false, 'message', 'Assignment not found or does not belong to you.');
  end if;

  if v_assignment.status in ('cancelled', 'expired') then
    return jsonb_build_object('success', false, 'message', 'This assignment is no longer available.');
  end if;

  if v_assignment.access_expires_at is not null and v_assignment.access_expires_at < now() then
    return jsonb_build_object('success', false, 'message', 'Assignment access has expired.');
  end if;

  select id into v_existing_session_id
  from public.uat_sessions
  where assignment_id = p_assignment_id
  and tester_id = v_tester_id
  and status in ('active', 'paused')
  limit 1;

  if v_existing_session_id is not null then
    return jsonb_build_object('success', true, 'session_id', v_existing_session_id, 'status', 'existing');
  end if;

  select j.project_id, j.id into v_project_id, v_job_id
  from public.uat_assignments a
  join public.uat_jobs j on j.id = a.job_id
  where a.id = p_assignment_id;

  insert into public.uat_sessions (
    assignment_id, tester_id, project_id, job_id, status,
    started_at, last_activity_at,
    browser_name, browser_version, operating_system,
    viewport_width, viewport_height, user_agent
  ) values (
    p_assignment_id, v_tester_id, v_project_id, v_job_id, 'active',
    now(), now(),
    p_browser_name, p_browser_version, p_operating_system,
    p_viewport_width, p_viewport_height, p_user_agent
  )
  returning id into v_session_id;

  update public.uat_assignments
  set status = 'testing', started_at = coalesce(started_at, now()), updated_at = now()
  where id = p_assignment_id and tester_id = v_tester_id;

  return jsonb_build_object('success', true, 'session_id', v_session_id, 'status', 'active');
end;
$$;

-- ============================================================================
-- 17. RPC FUNCTION: pause_uat_session
-- ============================================================================
create or replace function public.pause_uat_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_session public.uat_sessions%rowtype;
  v_elapsed integer;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_session
  from public.uat_sessions
  where id = p_session_id
  and tester_id = v_tester_id;

  if v_session.id is null then
    return jsonb_build_object('success', false, 'message', 'Session not found.');
  end if;

  if v_session.status != 'active' then
    return jsonb_build_object('success', false, 'message', 'Session is not active. Current status: ' || v_session.status);
  end if;

  v_elapsed := extract(epoch from (now() - v_session.last_activity_at))::integer;

  update public.uat_sessions
  set status = 'paused',
      paused_at = now(),
      active_seconds = active_seconds + v_elapsed,
      last_activity_at = now(),
      updated_at = now()
  where id = p_session_id;

  return jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'paused');
end;
$$;

-- ============================================================================
-- 18. RPC FUNCTION: resume_uat_session
-- ============================================================================
create or replace function public.resume_uat_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_session public.uat_sessions%rowtype;
  v_pause_duration integer;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_session
  from public.uat_sessions
  where id = p_session_id
  and tester_id = v_tester_id;

  if v_session.id is null then
    return jsonb_build_object('success', false, 'message', 'Session not found.');
  end if;

  if v_session.status != 'paused' then
    return jsonb_build_object('success', false, 'message', 'Session is not paused. Current status: ' || v_session.status);
  end if;

  v_pause_duration := extract(epoch from (now() - v_session.paused_at))::integer;

  update public.uat_sessions
  set status = 'active',
      resumed_at = now(),
      pause_seconds = pause_seconds + v_pause_duration,
      last_activity_at = now(),
      updated_at = now()
  where id = p_session_id;

  return jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'active');
end;
$$;

-- ============================================================================
-- 19. RPC FUNCTION: finish_uat_session
-- ============================================================================
create or replace function public.finish_uat_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_session public.uat_sessions%rowtype;
  v_elapsed integer;
  v_incomplete_count integer;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_session
  from public.uat_sessions
  where id = p_session_id
  and tester_id = v_tester_id;

  if v_session.id is null then
    return jsonb_build_object('success', false, 'message', 'Session not found.');
  end if;

  if v_session.status not in ('active', 'paused') then
    return jsonb_build_object('success', false, 'message', 'Session not in a finishable state. Current status: ' || v_session.status);
  end if;

  select count(*) into v_incomplete_count
  from public.uat_assignment_test_cases
  where assignment_id = v_session.assignment_id
  and tester_id = v_tester_id
  and status in ('not_started', 'in_progress');

  if v_incomplete_count > 0 then
    return jsonb_build_object('success', false, 'incomplete_count', v_incomplete_count, 'message', v_incomplete_count || ' test case(s) not yet completed. Finish all cases before submitting.');
  end if;

  if v_session.status = 'active' then
    v_elapsed := extract(epoch from (now() - v_session.last_activity_at))::integer;
  else
    v_elapsed := 0;
  end if;

  update public.uat_sessions
  set status = 'completed',
      finished_at = now(),
      active_seconds = active_seconds + v_elapsed,
      last_activity_at = now(),
      updated_at = now()
  where id = p_session_id;

  update public.uat_assignments
  set status = 'submitted', submitted_at = now(), updated_at = now()
  where id = v_session.assignment_id and tester_id = v_tester_id;

  return jsonb_build_object('success', true, 'session_id', p_session_id, 'status', 'completed');
end;
$$;

-- ============================================================================
-- 20. RPC FUNCTION: update_uat_test_case_result
-- ============================================================================
create or replace function public.update_uat_test_case_result(
  p_assignment_test_case_id uuid,
  p_session_id uuid,
  p_status text,
  p_actual_result text default null,
  p_tester_notes text default null,
  p_blocker_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_atc public.uat_assignment_test_cases%rowtype;
  v_session public.uat_sessions%rowtype;
  v_result_id uuid;
  v_duration integer := 0;
  v_existing public.uat_test_case_results%rowtype;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_atc
  from public.uat_assignment_test_cases
  where id = p_assignment_test_case_id
  and tester_id = v_tester_id;

  if v_atc.id is null then
    return jsonb_build_object('success', false, 'message', 'Assignment test case not found or does not belong to you.');
  end if;

  select * into v_session
  from public.uat_sessions
  where id = p_session_id
  and tester_id = v_tester_id
  and status in ('active', 'paused');

  if v_session.id is null then
    return jsonb_build_object('success', false, 'message', 'Session not found or not active. Start a session first.');
  end if;

  if p_status not in ('in_progress', 'passed', 'failed', 'blocked', 'skipped', 'needs_retest') then
    return jsonb_build_object('success', false, 'message', 'Invalid status: ' || p_status);
  end if;

  if p_status = 'failed' and (p_actual_result is null or trim(p_actual_result) = '') then
    return jsonb_build_object('success', false, 'message', 'Actual result is required when marking as failed.');
  end if;

  if p_status = 'blocked' and (p_blocker_reason is null or trim(p_blocker_reason) = '') then
    return jsonb_build_object('success', false, 'message', 'Blocker reason is required when marking as blocked.');
  end if;

  select * into v_existing
  from public.uat_test_case_results
  where assignment_test_case_id = p_assignment_test_case_id
  and session_id = p_session_id
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    if v_existing.started_at is not null then
      v_duration := extract(epoch from (now() - v_existing.started_at))::integer;
    end if;

    update public.uat_test_case_results
    set status = p_status,
        actual_result = coalesce(p_actual_result, v_existing.actual_result),
        tester_notes = coalesce(p_tester_notes, v_existing.tester_notes),
        blocker_reason = coalesce(p_blocker_reason, v_existing.blocker_reason),
        completed_at = case when p_status in ('passed', 'failed', 'blocked', 'skipped') then now() else v_existing.completed_at end,
        duration_seconds = case when p_status in ('passed', 'failed', 'blocked', 'skipped') then v_duration else v_existing.duration_seconds end,
        updated_at = now()
    where id = v_existing.id
    returning id into v_result_id;
  else
    insert into public.uat_test_case_results (
      assignment_test_case_id, assignment_id, test_case_id, session_id, tester_id,
      status, actual_result, tester_notes, blocker_reason,
      started_at, completed_at, duration_seconds
    ) values (
      p_assignment_test_case_id, v_atc.assignment_id, v_atc.test_case_id, p_session_id, v_tester_id,
      'in_progress', p_actual_result, p_tester_notes, p_blocker_reason,
      now(), null, 0
    );

    if p_status != 'in_progress' then
      v_duration := extract(epoch from (now() - now()))::integer;
      update public.uat_test_case_results
      set status = p_status,
          completed_at = now(),
          duration_seconds = v_duration,
          updated_at = now()
      where assignment_test_case_id = p_assignment_test_case_id
      and session_id = p_session_id;
    end if;

    select id into v_result_id
    from public.uat_test_case_results
    where assignment_test_case_id = p_assignment_test_case_id
    and session_id = p_session_id;
  end if;

  update public.uat_assignment_test_cases
  set status = p_status,
      started_at = coalesce(uat_assignment_test_cases.started_at, now()),
      completed_at = case when p_status in ('passed', 'failed', 'blocked', 'skipped') then now() else null end,
      updated_at = now()
  where id = p_assignment_test_case_id;

  update public.uat_sessions
  set last_activity_at = now(), updated_at = now()
  where id = p_session_id;

  return jsonb_build_object('success', true, 'result_id', v_result_id, 'status', p_status);
end;
$$;

commit;