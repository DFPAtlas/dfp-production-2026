-- ============================================================
-- DFP UAT Phase 3D — Test Mailbox and Communication Interception
-- Safe additive migration. No drops. No ALTER on existing tables.
-- ============================================================

-- 1. Communication Settings
-- ============================================================
create table if not exists uat_sandbox_communication_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references uat_projects(id) on delete cascade,
  environment_id uuid null references uat_environments(id) on delete set null,
  email_interception_enabled boolean not null default false,
  sms_interception_enabled boolean not null default false,
  webhook_interception_enabled boolean not null default false,
  block_unapproved_recipients boolean not null default true,
  allowed_email_domains text[] not null default '{}',
  allowed_phone_prefixes text[] not null default '{}',
  allowed_webhook_origins text[] not null default '{}',
  delivery_simulation_mode text not null default 'intercept_only'
    check (delivery_simulation_mode in ('intercept_only', 'simulate_delivered', 'simulate_failed', 'project_adapter')),
  retention_days integer not null default 90,
  maximum_message_size_bytes integer not null default 1048576,
  created_by uuid null references admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table uat_sandbox_communication_settings is 'Per-project sandbox communication interception configuration';
comment on column uat_sandbox_communication_settings.delivery_simulation_mode is 'intercept_only, simulate_delivered, simulate_failed, project_adapter. Never send_live.';

create index if not exists idx_uat_comm_settings_project on uat_sandbox_communication_settings(project_id);
create index if not exists idx_uat_comm_settings_env on uat_sandbox_communication_settings(environment_id);
create index if not exists idx_uat_comm_settings_email on uat_sandbox_communication_settings(email_interception_enabled) where email_interception_enabled = true;

-- 2. Intercepted Messages
-- ============================================================
create table if not exists uat_sandbox_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references uat_projects(id) on delete cascade,
  environment_id uuid null references uat_environments(id) on delete set null,
  assignment_id uuid not null references uat_assignments(id) on delete cascade,
  session_id uuid null references uat_sessions(id) on delete set null,
  sandbox_instance_id uuid null references uat_sandbox_instances(id) on delete set null,
  tester_id uuid not null references uat_testers(id) on delete cascade,
  message_type text not null check (message_type in ('email', 'sms', 'webhook', 'notification')),
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound_test')),
  provider_name text null,
  provider_message_reference text null,
  sender_address text null,
  recipient_address text null,
  recipient_display text null,
  subject text null,
  safe_preview text null,
  content_text text null,
  content_html_reference text null,
  template_reference text null,
  status text not null default 'intercepted'
    check (status in ('intercepted', 'simulated_delivered', 'simulated_failed', 'blocked', 'quarantined', 'reviewed', 'expired')),
  delivery_simulation text not null default 'intercept_only'
    check (delivery_simulation in ('intercept_only', 'simulate_delivered', 'simulate_failed')),
  failure_code text null,
  sent_at timestamptz null,
  intercepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz null
);

comment on table uat_sandbox_messages is 'Intercepted communications within a UAT sandbox';
comment on column uat_sandbox_messages.recipient_address is 'Masked or test-safe recipient address. Real-looking addresses marked clearly.';
comment on column uat_sandbox_messages.content_html_reference is 'Reference to stored sanitised HTML, not raw HTML stored inline';

create index if not exists idx_uat_msg_sandbox on uat_sandbox_messages(sandbox_instance_id);
create index if not exists idx_uat_msg_assignment on uat_sandbox_messages(assignment_id);
create index if not exists idx_uat_msg_tester on uat_sandbox_messages(tester_id);
create index if not exists idx_uat_msg_type on uat_sandbox_messages(message_type);
create index if not exists idx_uat_msg_status on uat_sandbox_messages(status);
create index if not exists idx_uat_msg_intercepted on uat_sandbox_messages(intercepted_at desc);
create index if not exists idx_uat_msg_recipient on uat_sandbox_messages(recipient_address) where recipient_address is not null;

-- 3. Message Attachments
-- ============================================================
create table if not exists uat_sandbox_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references uat_sandbox_messages(id) on delete cascade,
  evidence_id uuid null references uat_evidence(id) on delete set null,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  storage_path text not null,
  status text not null default 'stored' check (status in ('stored', 'quarantined', 'deleted')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

comment on table uat_sandbox_message_attachments is 'Attachments linked to intercepted sandbox messages';

create index if not exists idx_uat_msg_att_msg on uat_sandbox_message_attachments(message_id);

-- 4. Message Events (Audit Trail)
-- ============================================================
create table if not exists uat_sandbox_message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references uat_sandbox_messages(id) on delete cascade,
  event_type text not null check (event_type in (
    'captured', 'blocked', 'simulated_delivered', 'simulated_failed',
    'opened_in_test_mailbox', 'attachment_downloaded', 'linked_to_test_case',
    'linked_to_feedback', 'quarantined', 'expired'
  )),
  actor_user_id uuid null references auth.users(id) on delete set null,
  safe_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table uat_sandbox_message_events is 'Immutable audit events for each intercepted message';

create index if not exists idx_uat_msg_event_msg on uat_sandbox_message_events(message_id);
create index if not exists idx_uat_msg_event_type on uat_sandbox_message_events(event_type);

-- 5. Test Case Message Links
-- ============================================================
create table if not exists uat_test_case_messages (
  id uuid primary key default gen_random_uuid(),
  assignment_test_case_id uuid not null references uat_assignment_test_cases(id) on delete cascade,
  message_id uuid not null references uat_sandbox_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (assignment_test_case_id, message_id)
);

comment on table uat_test_case_messages is 'Links between sandbox messages and test cases';

create index if not exists idx_uat_tcm_case on uat_test_case_messages(assignment_test_case_id);
create index if not exists idx_uat_tcm_msg on uat_test_case_messages(message_id);

-- 6. Feedback Message Links
-- ============================================================
create table if not exists uat_feedback_messages (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references uat_feedback(id) on delete cascade,
  message_id uuid not null references uat_sandbox_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feedback_id, message_id)
);

comment on table uat_feedback_messages is 'Links between sandbox messages and bug/feedback reports';

create index if not exists idx_uat_fm_feedback on uat_feedback_messages(feedback_id);
create index if not exists idx_uat_fm_msg on uat_feedback_messages(message_id);

-- ============================================================
-- RLS
-- ============================================================

alter table if exists uat_sandbox_communication_settings enable row level security;
alter table if exists uat_sandbox_messages enable row level security;
alter table if exists uat_sandbox_message_attachments enable row level security;
alter table if exists uat_sandbox_message_events enable row level security;
alter table if exists uat_test_case_messages enable row level security;
alter table if exists uat_feedback_messages enable row level security;

-- Communication Settings
-- Testers: read via their assignments
-- Staff: full read, update settings

create or replace function uat_tester_comm_project_ids(tester_uuid uuid)
returns setof uuid as $$
  select distinct a.project_id from uat_assignments a where a.tester_id = tester_uuid;
$$ language sql security definer;

create policy if not exists "uat_comm_settings_testers_read"
  on uat_sandbox_communication_settings
  for select to authenticated
  using (project_id in (select uat_tester_comm_project_ids((select id from uat_testers where user_id = auth.uid()))));

create policy if not exists "uat_comm_settings_staff_all"
  on uat_sandbox_communication_settings
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- Messages: testers read own

create policy if not exists "uat_messages_testers_read"
  on uat_sandbox_messages
  for select to authenticated
  using (tester_id = (select id from uat_testers where user_id = auth.uid()));

create policy if not exists "uat_messages_testers_update_review"
  on uat_sandbox_messages
  for update to authenticated
  using (tester_id = (select id from uat_testers where user_id = auth.uid()))
  with check (tester_id = (select id from uat_testers where user_id = auth.uid()));

create policy if not exists "uat_messages_staff_all"
  on uat_sandbox_messages
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- Attachments: testers read via their messages

create policy if not exists "uat_msg_attach_testers_read"
  on uat_sandbox_message_attachments
  for select to authenticated
  using (message_id in (select m.id from uat_sandbox_messages m where m.tester_id = (select id from uat_testers where user_id = auth.uid())));

create policy if not exists "uat_msg_attach_staff_all"
  on uat_sandbox_message_attachments
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- Events: testers read via their messages

create policy if not exists "uat_msg_events_testers_read"
  on uat_sandbox_message_events
  for select to authenticated
  using (message_id in (select m.id from uat_sandbox_messages m where m.tester_id = (select id from uat_testers where user_id = auth.uid())));

create policy if not exists "uat_msg_events_staff_all"
  on uat_sandbox_message_events
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- Test case messages: testers read via their test cases

create policy if not exists "uat_tcm_testers_read"
  on uat_test_case_messages
  for select to authenticated
  using (assignment_test_case_id in (
    select atc.id from uat_assignment_test_cases atc
    join uat_assignments a on a.id = atc.assignment_id
    where a.tester_id = (select id from uat_testers where user_id = auth.uid())
  ));

create policy if not exists "uat_tcm_testers_insert"
  on uat_test_case_messages
  for insert to authenticated
  with check (assignment_test_case_id in (
    select atc.id from uat_assignment_test_cases atc
    join uat_assignments a on a.id = atc.assignment_id
    where a.tester_id = (select id from uat_testers where user_id = auth.uid())
  ));

create policy if not exists "uat_tcm_staff_all"
  on uat_test_case_messages
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- Feedback messages: testers read via their feedback

create policy if not exists "uat_fm_testers_read"
  on uat_feedback_messages
  for select to authenticated
  using (feedback_id in (
    select f.id from uat_feedback f where f.tester_id = (select id from uat_testers where user_id = auth.uid())
  ));

create policy if not exists "uat_fm_testers_insert"
  on uat_feedback_messages
  for insert to authenticated
  with check (feedback_id in (
    select f.id from uat_feedback f where f.tester_id = (select id from uat_testers where user_id = auth.uid())
  ));

create policy if not exists "uat_fm_staff_all"
  on uat_feedback_messages
  for all to authenticated
  using (exists (select 1 from admin_profiles ap where ap.id = auth.uid()))
  with check (exists (select 1 from admin_profiles ap where ap.id = auth.uid()));

-- ============================================================
-- Trusted Functions
-- ============================================================

-- Intercept email (called by project adapter / edge function)
create or replace function uat_intercept_email(
  p_sandbox_instance_id uuid,
  p_sender text,
  p_recipient text,
  p_subject text,
  p_content_text text,
  p_content_html_reference text default null,
  p_template_reference text default null,
  p_provider_name text default null,
  p_provider_ref text default null,
  p_message_size integer default 0
)
returns jsonb as $$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
  v_safe_recipient text;
begin
  -- Resolve sandbox
  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id
    and status not in ('ended', 'expired', 'failed')
  limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox not found or unavailable');
  end if;

  -- Resolve settings
  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id
    and (environment_id is null or environment_id = v_instance.environment_id)
    and email_interception_enabled = true
  order by environment_id nulls last
  limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'Email interception not configured');
  end if;

  if v_settings.block_unapproved_recipients then
    -- Simple domain check
    if p_recipient !~ '@(dfp-test\.local|example\.test|digital-footprint\.uk|dfp\.test)$' then
      v_status := 'blocked';
    end if;
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  -- Mask recipient for storage
  v_safe_recipient := regexp_replace(p_recipient, '^([^@]{2})[^@]*(@.*)$', '\1***\2');

  insert into uat_sandbox_messages (
    project_id, environment_id, assignment_id, session_id, sandbox_instance_id,
    tester_id, message_type, direction, provider_name, provider_message_reference,
    sender_address, recipient_address, recipient_display, subject, safe_preview,
    content_text, content_html_reference, template_reference, status, delivery_simulation,
    intercepted_at, expires_at
  ) values (
    v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id,
    p_sandbox_instance_id, v_instance.tester_id, 'email', 'outbound',
    p_provider_name, p_provider_ref, p_sender, v_safe_recipient, p_recipient,
    p_subject, left(p_content_text, 200), p_content_text, p_content_html_reference,
    p_template_reference, v_status, v_simulation, now(),
    now() + (v_settings.retention_days || ' days')::interval
  ) returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('size', p_message_size));

  if v_status = 'blocked' then
    insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
    values (v_message_id, 'blocked', jsonb_build_object('reason', 'unapproved_recipient'));
  end if;

  if v_status in ('simulated_delivered', 'simulated_failed') then
    insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
    values (v_message_id, v_status, '{}');
  end if;

  insert into uat_audit_log (table_name, record_id, action, performed_by, safe_summary)
  values ('uat_sandbox_messages', v_message_id::text, 'email_intercepted', v_instance.tester_id::text,
    'Email intercepted for sandbox ' || p_sandbox_instance_id::text);

  return jsonb_build_object(
    'success', true,
    'intercepted', true,
    'message_id', v_message_id,
    'status', v_status
  );
end;
$$ language plpgsql security definer;

-- Intercept SMS
create or replace function uat_intercept_sms(
  p_sandbox_instance_id uuid,
  p_sender text,
  p_recipient text,
  p_content_text text,
  p_provider_name text default null
)
returns jsonb as $$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
begin
  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id and status not in ('ended', 'expired', 'failed')
  limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox unavailable');
  end if;

  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id
    and sms_interception_enabled = true
  limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'SMS interception not configured');
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  insert into uat_sandbox_messages (
    project_id, environment_id, assignment_id, session_id, sandbox_instance_id,
    tester_id, message_type, direction, provider_name,
    sender_address, recipient_address, subject, safe_preview, content_text,
    status, delivery_simulation, intercepted_at, expires_at
  ) values (
    v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id,
    p_sandbox_instance_id, v_instance.tester_id, 'sms', 'outbound',
    p_provider_name, p_sender, left(p_recipient, 4) || '****',
    'SMS', left(p_content_text, 200), p_content_text,
    v_status, v_simulation, now(),
    now() + (v_settings.retention_days || ' days')::interval
  ) returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('type', 'sms'));

  return jsonb_build_object('success', true, 'intercepted', true, 'message_id', v_message_id, 'status', v_status);
end;
$$ language plpgsql security definer;

-- Intercept Webhook
create or replace function uat_intercept_webhook(
  p_sandbox_instance_id uuid,
  p_event_name text,
  p_http_method text,
  p_destination text,
  p_safe_summary jsonb default '{}',
  p_provider_name text default null
)
returns jsonb as $$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
begin
  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id and status not in ('ended', 'expired', 'failed')
  limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox unavailable');
  end if;

  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id
    and webhook_interception_enabled = true
  limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'Webhook interception not configured');
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  insert into uat_sandbox_messages (
    project_id, environment_id, assignment_id, session_id, sandbox_instance_id,
    tester_id, message_type, direction, provider_name,
    recipient_address, subject, safe_preview, content_text,
    status, delivery_simulation, intercepted_at, expires_at
  ) values (
    v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id,
    p_sandbox_instance_id, v_instance.tester_id, 'webhook', 'outbound',
    p_provider_name, p_destination, p_event_name,
    p_safe_summary::text, p_safe_summary::text,
    v_status, v_simulation, now(),
    now() + (v_settings.retention_days || ' days')::interval
  ) returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('method', p_http_method, 'destination', p_destination));

  return jsonb_build_object('success', true, 'intercepted', true, 'message_id', v_message_id, 'status', v_status);
end;
$$ language plpgsql security definer;

-- Link message to test case (tester)
create or replace function uat_link_message_to_case(
  p_message_id uuid,
  p_assignment_test_case_id uuid
)
returns jsonb as $$
declare
  v_tester_id uuid;
  v_assignment_id uuid;
begin
  select id into v_tester_id from uat_testers where user_id = auth.uid();
  if v_tester_id is null then
    return jsonb_build_object('success', false, 'error', 'Not an approved tester');
  end if;

  select assignment_id into v_assignment_id from uat_assignment_test_cases where id = p_assignment_test_case_id;
  if not exists (select 1 from uat_sandbox_messages where id = p_message_id and tester_id = v_tester_id) then
    return jsonb_build_object('success', false, 'error', 'Message not found or not owned');
  end if;

  if not exists (select 1 from uat_assignments where id = v_assignment_id and tester_id = v_tester_id) then
    return jsonb_build_object('success', false, 'error', 'Test case not in your assignment');
  end if;

  insert into uat_test_case_messages (assignment_test_case_id, message_id)
  values (p_assignment_test_case_id, p_message_id)
  on conflict (assignment_test_case_id, message_id) do nothing;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (p_message_id, 'linked_to_test_case', jsonb_build_object('case_id', p_assignment_test_case_id));

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Link message to feedback (tester)
create or replace function uat_link_message_to_feedback(
  p_message_id uuid,
  p_feedback_id uuid
)
returns jsonb as $$
declare
  v_tester_id uuid;
begin
  select id into v_tester_id from uat_testers where user_id = auth.uid();
  if v_tester_id is null then
    return jsonb_build_object('success', false, 'error', 'Not an approved tester');
  end if;

  if not exists (select 1 from uat_sandbox_messages where id = p_message_id and tester_id = v_tester_id) then
    return jsonb_build_object('success', false, 'error', 'Message not found or not owned');
  end if;

  if not exists (select 1 from uat_feedback where id = p_feedback_id and tester_id = v_tester_id) then
    return jsonb_build_object('success', false, 'error', 'Feedback not found or not owned');
  end if;

  insert into uat_feedback_messages (feedback_id, message_id)
  values (p_feedback_id, p_message_id)
  on conflict (feedback_id, message_id) do nothing;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (p_message_id, 'linked_to_feedback', jsonb_build_object('feedback_id', p_feedback_id));

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Mark message reviewed
create or replace function uat_mark_message_reviewed(p_message_id uuid)
returns jsonb as $$
declare
  v_tester_id uuid;
begin
  select id into v_tester_id from uat_testers where user_id = auth.uid();
  if not exists (select 1 from uat_sandbox_messages where id = p_message_id and tester_id = v_tester_id) then
    return jsonb_build_object('success', false, 'error', 'Not your message');
  end if;

  update uat_sandbox_messages set status = 'reviewed', updated_at = now() where id = p_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (p_message_id, 'opened_in_test_mailbox', '{}');

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Quarantine message (staff only)
create or replace function uat_quarantine_message(p_message_id uuid, p_reason text)
returns jsonb as $$
begin
  if not exists (select 1 from admin_profiles where id = auth.uid()) then
    return jsonb_build_object('success', false, 'error', 'Staff only');
  end if;

  update uat_sandbox_messages set status = 'quarantined', updated_at = now() where id = p_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (p_message_id, 'quarantined', jsonb_build_object('reason', p_reason));

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Expire old messages (called by cron/n8n)
create or replace function uat_expire_old_messages()
returns integer as $$
declare
  v_count integer := 0;
begin
  update uat_sandbox_messages
  set status = 'expired', updated_at = now()
  where status != 'expired'
    and expires_at is not null
    and expires_at < now()
    and id not in (
      select message_id from uat_feedback_messages
      union
      select message_id from uat_test_case_messages
    );

  get diagnostics v_count = row_count;

  return v_count;
end;
$$ language plpgsql security definer;

-- Count tester mailbox stats
create or replace function uat_tester_mailbox_stats(p_assignment_id uuid)
returns jsonb as $$
declare
  v_tester_id uuid;
begin
  select id into v_tester_id from uat_testers where user_id = auth.uid();

  return (
    select jsonb_build_object(
      'email', count(*) filter (where message_type = 'email'),
      'sms', count(*) filter (where message_type = 'sms'),
      'webhook', count(*) filter (where message_type = 'webhook'),
      'blocked', count(*) filter (where status = 'blocked'),
      'total', count(*),
      'latest', max(intercepted_at)
    )
    from uat_sandbox_messages
    where assignment_id = p_assignment_id
      and tester_id = v_tester_id
  );
end;
$$ language plpgsql security definer;

-- Update timestamps trigger
-- ============================================================
create or replace function uat_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists trg_uat_comm_settings_updated
  before update on uat_sandbox_communication_settings
  for each row execute function uat_set_updated_at();

create trigger if not exists trg_uat_messages_updated
  before update on uat_sandbox_messages
  for each row execute function uat_set_updated_at();

-- ============================================================
-- View: safe tester mailbox (no raw HTML, no secrets)
-- ============================================================
create or replace view uat_tester_mailbox_view as
select
  m.id,
  m.assignment_id,
  m.sandbox_instance_id,
  m.message_type,
  m.direction,
  m.sender_address,
  m.recipient_address,
  m.recipient_display,
  m.subject,
  m.safe_preview,
  m.status,
  m.delivery_simulation,
  m.failure_code,
  m.intercepted_at,
  m.expires_at,
  m.created_at,
  (select count(*) from uat_sandbox_message_attachments a where a.message_id = m.id) as attachment_count,
  (select count(*) from uat_test_case_messages tcm where tcm.message_id = m.id) as linked_cases,
  (select count(*) from uat_feedback_messages fm where fm.message_id = m.id) as linked_feedback
from uat_sandbox_messages m;

comment on view uat_tester_mailbox_view is 'Tester-facing mailbox view with masked fields';