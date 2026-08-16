-- DFP UAT Phase 2B — Evidence Capture, Screenshots & Bug Attachments
-- Additive migration: creates evidence tables, audit log, and RPC function

begin;

-- ============================================================================
-- 1. CREATE uat_evidence
-- ============================================================================
create table if not exists public.uat_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  job_id uuid,
  assignment_id uuid not null,
  assignment_test_case_id uuid references public.uat_assignment_test_cases(id) on delete set null,
  test_case_id uuid references public.uat_test_cases(id) on delete set null,
  session_id uuid references public.uat_sessions(id) on delete set null,
  feedback_id uuid references public.uat_feedback(id) on delete set null,
  tester_id uuid not null references public.uat_testers(id) on delete cascade,
  evidence_type text not null default 'screenshot' check (evidence_type in ('screenshot', 'image', 'document', 'video', 'log', 'other')),
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  width integer,
  height integer,
  capture_source text not null default 'uploaded_file' check (capture_source in ('manual_screenshot', 'uploaded_file', 'bug_report', 'test_case', 'staff_attachment')),
  caption text,
  tester_notes text,
  browser_name text,
  browser_version text,
  operating_system text,
  viewport_width integer,
  viewport_height integer,
  status text not null default 'uploaded' check (status in ('uploaded', 'attached', 'quarantined', 'rejected', 'deleted')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

create index if not exists idx_uat_evidence_assignment on public.uat_evidence (assignment_id);
create index if not exists idx_uat_evidence_atc on public.uat_evidence (assignment_test_case_id);
create index if not exists idx_uat_evidence_session on public.uat_evidence (session_id);
create index if not exists idx_uat_evidence_feedback on public.uat_evidence (feedback_id);
create index if not exists idx_uat_evidence_tester on public.uat_evidence (tester_id);
create index if not exists idx_uat_evidence_project on public.uat_evidence (project_id);
create index if not exists idx_uat_evidence_status on public.uat_evidence (status);
create index if not exists idx_uat_evidence_created on public.uat_evidence (created_at);

-- ============================================================================
-- 2. CREATE uat_evidence_events
-- ============================================================================
create table if not exists public.uat_evidence_events (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.uat_evidence(id) on delete cascade,
  event_type text not null check (event_type in ('uploaded', 'attached_to_case', 'attached_to_feedback', 'viewed', 'downloaded', 'renamed', 'quarantined', 'rejected', 'soft_deleted', 'restored')),
  actor_user_id uuid not null references auth.users(id),
  actor_tester_id uuid references public.uat_testers(id) on delete set null,
  actor_staff_id uuid references public.staff_profiles(id) on delete set null,
  metadata jsonb default ''::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_uat_evidence_events_evidence on public.uat_evidence_events (evidence_id);
create index if not exists idx_uat_evidence_events_actor on public.uat_evidence_events (actor_user_id);
create index if not exists idx_uat_evidence_events_type on public.uat_evidence_events (event_type);
create index if not exists idx_uat_evidence_events_created on public.uat_evidence_events (created_at);

-- ============================================================================
-- 3. ENABLE RLS
-- ============================================================================
alter table public.uat_evidence enable row level security;
alter table public.uat_evidence_events enable row level security;

-- ============================================================================
-- 4. RLS POLICIES: uat_evidence (tester)
-- ============================================================================
drop policy if exists "testers_read_own_evidence" on public.uat_evidence;
create policy "testers_read_own_evidence" on public.uat_evidence
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_evidence.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_insert_own_evidence" on public.uat_evidence;
create policy "testers_insert_own_evidence" on public.uat_evidence
  for insert to authenticated
  with check (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_evidence.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "testers_update_own_evidence" on public.uat_evidence;
create policy "testers_update_own_evidence" on public.uat_evidence
  for update to authenticated
  using (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_evidence.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.uat_testers t
      where t.id = uat_evidence.tester_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

-- ============================================================================
-- 5. RLS POLICIES: uat_evidence (staff)
-- ============================================================================
drop policy if exists "staff_manage_evidence" on public.uat_evidence;
create policy "staff_manage_evidence" on public.uat_evidence
  for all to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

-- ============================================================================
-- 6. RLS POLICIES: uat_evidence_events
-- ============================================================================
drop policy if exists "testers_read_own_evidence_events" on public.uat_evidence_events;
create policy "testers_read_own_evidence_events" on public.uat_evidence_events
  for select to authenticated
  using (
    exists (
      select 1 from public.uat_evidence e
      join public.uat_testers t on t.id = e.tester_id
      where e.id = uat_evidence_events.evidence_id
      and t.user_id = auth.uid()
      and t.status = 'approved'
    )
  );

drop policy if exists "staff_read_all_evidence_events" on public.uat_evidence_events;
create policy "staff_read_all_evidence_events" on public.uat_evidence_events
  for select to authenticated
  using (
    exists (
      select 1 from public.staff_profiles
      where id = auth.uid() and role in ('staff', 'admin', 'super_admin')
    )
  );

drop policy if exists "system_insert_evidence_events" on public.uat_evidence_events;
create policy "system_insert_evidence_events" on public.uat_evidence_events
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
  );

-- ============================================================================
-- 7. RPC FUNCTION: prepare_uat_evidence_upload
-- ============================================================================
create or replace function public.prepare_uat_evidence_upload(
  p_assignment_id uuid,
  p_original_filename text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_evidence_type text default 'screenshot',
  p_assignment_test_case_id uuid default null,
  p_session_id uuid default null,
  p_caption text default null,
  p_width integer default null,
  p_height integer default null,
  p_browser_name text default null,
  p_browser_version text default null,
  p_operating_system text default null,
  p_viewport_width integer default null,
  p_viewport_height integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_assignment public.uat_assignments%rowtype;
  v_project_id uuid;
  v_job_id uuid;
  v_test_case_id uuid;
  v_evidence_id uuid;
  v_safe_filename text;
  v_storage_path text;
  v_ext text;
  v_allowed_images text[] := array['image/png', 'image/jpeg', 'image/webp'];
  v_allowed_docs text[] := array['application/pdf', 'text/plain', 'text/csv'];
  v_allowed_extensions text[] := array['png', 'jpg', 'jpeg', 'webp', 'pdf', 'txt', 'csv'];
  v_max_image_size integer := 10485760;
  v_max_doc_size integer := 15728640;
  v_timestamp text;
  v_random text;
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

  if v_assignment.access_expires_at is not null and v_assignment.access_expires_at < now() and v_assignment.status != 'submitted' then
    return jsonb_build_object('success', false, 'message', 'Assignment access has expired.');
  end if;

  if p_session_id is not null then
    if not exists (
      select 1 from public.uat_sessions
      where id = p_session_id
      and tester_id = v_tester_id
      and status in ('active', 'paused')
    ) then
      return jsonb_build_object('success', false, 'message', 'Session not found or not active.');
    end if;
  end if;

  if p_assignment_test_case_id is not null then
    if not exists (
      select 1 from public.uat_assignment_test_cases
      where id = p_assignment_test_case_id
      and tester_id = v_tester_id
    ) then
      return jsonb_build_object('success', false, 'message', 'Test case not found or does not belong to you.');
    end if;

    select test_case_id into v_test_case_id
    from public.uat_assignment_test_cases
    where id = p_assignment_test_case_id;
  end if;

  -- Validate MIME type
  if p_evidence_type in ('screenshot', 'image') then
    if not (p_mime_type = any(v_allowed_images)) then
      return jsonb_build_object('success', false, 'message', 'File type not allowed. Accepted formats: PNG, JPEG, WebP.');
    end if;
    if p_file_size_bytes > v_max_image_size then
      return jsonb_build_object('success', false, 'message', 'Image file too large. Maximum: 10 MB.');
    end if;
  elsif p_evidence_type = 'document' then
    if not (p_mime_type = any(v_allowed_docs)) then
      return jsonb_build_object('success', false, 'message', 'File type not allowed. Accepted formats: PDF, TXT, CSV.');
    end if;
    if p_file_size_bytes > v_max_doc_size then
      return jsonb_build_object('success', false, 'message', 'Document too large. Maximum: 15 MB.');
    end if;
  else
    return jsonb_build_object('success', false, 'message', 'Evidence type not supported: ' || p_evidence_type);
  end if;

  -- Validate file extension
  v_ext := lower(substring(p_original_filename from '\.([^.]+)$'));
  if v_ext is null or not (v_ext = any(v_allowed_extensions)) then
    return jsonb_build_object('success', false, 'message', 'File extension not allowed: ' || coalesce(v_ext, 'none'));
  end if;

  -- Get project and job from assignment
  select j.project_id, j.id into v_project_id, v_job_id
  from public.uat_assignments a
  join public.uat_jobs j on j.id = a.job_id
  where a.id = p_assignment_id;

  -- Generate safe filename
  v_timestamp := extract(epoch from now())::text;
  v_random := lpad((random() * 1000000)::int::text, 6, '0');
  v_safe_filename := v_timestamp || '-' || v_random || '.' || v_ext;

  -- Generate storage path
  v_storage_path := 'project/' || v_project_id || '/assignment/' || p_assignment_id || '/tester/' || v_tester_id || '/' || v_safe_filename;

  -- Create evidence record
  insert into public.uat_evidence (
    project_id, job_id, assignment_id, assignment_test_case_id, test_case_id,
    session_id, tester_id,
    evidence_type, storage_bucket, storage_path,
    original_filename, safe_filename, mime_type, file_size_bytes,
    width, height, capture_source, caption,
    browser_name, browser_version, operating_system,
    viewport_width, viewport_height, status
  ) values (
    v_project_id, v_job_id, p_assignment_id, p_assignment_test_case_id, v_test_case_id,
    p_session_id, v_tester_id,
    p_evidence_type, 'uat-evidence', v_storage_path,
    p_original_filename, v_safe_filename, p_mime_type, p_file_size_bytes,
    p_width, p_height, 'uploaded_file', p_caption,
    p_browser_name, p_browser_version, p_operating_system,
    p_viewport_width, p_viewport_height, 'uploaded'
  )
  returning id into v_evidence_id;

  return jsonb_build_object(
    'success', true,
    'evidence_id', v_evidence_id,
    'storage_bucket', 'uat-evidence',
    'storage_path', v_storage_path,
    'mime_type', p_mime_type,
    'tester_id', v_tester_id,
    'project_id', v_project_id
  );
end;
$$;

-- ============================================================================
-- 8. RPC FUNCTION: attach_evidence_to_feedback
-- ============================================================================
create or replace function public.attach_evidence_to_feedback(
  p_evidence_ids uuid[],
  p_feedback_id uuid,
  p_assignment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_count integer := 0;
  v_ev_id uuid;
begin
  v_tester_id := public.resolve_tester_from_auth();

  -- Verify feedback belongs to tester
  if not exists (
    select 1 from public.uat_feedback
    where id = p_feedback_id
    and tester_id = v_tester_id
    and assignment_id = p_assignment_id
  ) then
    return jsonb_build_object('success', false, 'message', 'Feedback not found or does not belong to you.');
  end if;

  foreach v_ev_id in array p_evidence_ids
  loop
    -- Verify each evidence record belongs to tester
    if exists (
      select 1 from public.uat_evidence
      where id = v_ev_id
      and tester_id = v_tester_id
      and assignment_id = p_assignment_id
      and status = 'uploaded'
    ) then
      update public.uat_evidence
      set feedback_id = p_feedback_id,
          status = 'attached',
          capture_source = case when capture_source = 'uploaded_file' then 'bug_report' else capture_source end,
          updated_at = now()
      where id = v_ev_id;

      v_count := v_count + 1;
    end if;
  end loop;

  return jsonb_build_object('success', true, 'attached_count', v_count, 'message', v_count || ' evidence item(s) attached.');
end;
$$;

-- ============================================================================
-- 9. RPC FUNCTION: soft_delete_evidence
-- ============================================================================
create or replace function public.soft_delete_uat_evidence(
  p_evidence_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
  v_evidence public.uat_evidence%rowtype;
begin
  v_tester_id := public.resolve_tester_from_auth();

  select * into v_evidence
  from public.uat_evidence
  where id = p_evidence_id
  and tester_id = v_tester_id;

  if v_evidence.id is null then
    return jsonb_build_object('success', false, 'message', 'Evidence not found.');
  end if;

  if v_evidence.status = 'attached' then
    return jsonb_build_object('success', false, 'message', 'Cannot delete evidence already attached to feedback.');
  end if;

  update public.uat_evidence
  set status = 'deleted', deleted_at = now(), updated_at = now()
  where id = p_evidence_id;

  return jsonb_build_object('success', true, 'message', 'Evidence soft-deleted.');
end;
$$;

commit;