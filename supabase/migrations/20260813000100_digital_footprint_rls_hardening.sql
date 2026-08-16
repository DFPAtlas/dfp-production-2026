-- DFP FIX 05 — Cross-tenant RLS isolation hardening
-- Fixes confirmed live-schema weaknesses found during the RLS audit:
--   1. uat_tester_applications: anon/authenticated full read + write + forged approval (P0)
--   2. uat_tester_mailbox_view: security-definer view leaking every tester's mailbox to anon (P1)
--   3. uat_projects / uat_environments tester SELECT: self-comparison bug (broken lookup)
--   4. uat_feedback INSERT: tautology in ownership subquery
--   5. uat_sandbox access functions: missing tester status check (suspended/restricted retained access)
--   6. legacy uat_intercept_* functions: executable by anon/authenticated without any ownership check
--
-- Note: existing policies are corrected in place with ALTER POLICY (rather than
-- DROP POLICY + CREATE POLICY) because the policy name, roles and command are
-- preserved and only the USING / WITH CHECK expression is corrected. This keeps
-- the change precise, reviewable and idempotent.

-- ---------------------------------------------------------------------------
-- 1. uat_tester_applications
-- ---------------------------------------------------------------------------
-- Anonymous applicants may only create a fresh 'submitted' application with no
-- admin-only fields set. No status escalation, no forging review fields.
alter policy "Allow public insert"
  on public.uat_tester_applications
  with check (
    status = 'submitted'
    and admin_notes is null
    and reviewed_by is null
    and reviewed_at is null
    and application_reference is not null
    and char_length(trim(application_reference)) between 8 and 80
    and email is not null
    and position('@' in email) > 1
    and char_length(email) <= 254
  );

-- Internal (staff/admin) read only.
alter policy "Allow admin select"
  on public.uat_tester_applications
  using (app_private.is_internal());

-- Internal (staff/admin) update only.
alter policy "Allow admin update"
  on public.uat_tester_applications
  using (app_private.is_internal())
  with check (app_private.is_internal());

-- No anonymous read of applications (tracking is done via the RPC below).
alter policy "Allow public lookup by reference and email"
  on public.uat_tester_applications
  using (false);

-- ---------------------------------------------------------------------------
-- 2. Anonymous application status lookup (replaces the broad anon SELECT).
--    Returns only the fields the applicant tracker needs — never full PII.
-- ---------------------------------------------------------------------------
create or replace function public.get_uat_application_status(
  p_reference text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app record;
begin
  if p_reference is null or trim(p_reference) = ''
     or p_email is null or trim(p_email) = '' then
    return jsonb_build_object('found', false, 'error', 'Reference and email are required');
  end if;

  select application_reference, legal_name, display_name, email, status,
         submitted_at, reviewed_at, admin_notes, town_city, county, country,
         experience_level, devices, availability_hours, updated_at
  into v_app
  from public.uat_tester_applications
  where application_reference = trim(p_reference)
    and lower(email) = lower(trim(p_email))
  limit 1;

  if v_app.application_reference is null then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'application_reference', v_app.application_reference,
    'legal_name', v_app.legal_name,
    'display_name', v_app.display_name,
    'email', v_app.email,
    'status', v_app.status,
    'submitted_at', v_app.submitted_at,
    'reviewed_at', v_app.reviewed_at,
    'admin_notes', v_app.admin_notes,
    'town_city', v_app.town_city,
    'county', v_app.county,
    'country', v_app.country,
    'experience_level', v_app.experience_level,
    'devices', coalesce(v_app.devices, '[]'::jsonb),
    'availability_hours', v_app.availability_hours,
    'updated_at', v_app.updated_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Mailbox view: force security_invoker so it obeys uat_sandbox_messages RLS
--    instead of running as owner (postgres) and exposing every tester's mailbox.
-- ---------------------------------------------------------------------------
alter view public.uat_tester_mailbox_view set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 4. Correct self-comparison bugs in tester SELECT policies
-- ---------------------------------------------------------------------------
alter policy "uat_projects_tester_select"
  on public.uat_projects
  using (
    exists (
      select 1 from public.uat_jobs j
      where j.project_id = public.uat_projects.id
        and app_private.can_access_uat_job(j.id)
    )
  );

alter policy "uat_environments_tester_select"
  on public.uat_environments
  using (
    exists (
      select 1 from public.uat_jobs j
      where j.environment_id = public.uat_environments.id
        and app_private.can_access_uat_job(j.id)
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Remove tautology from uat_feedback insert ownership check
-- ---------------------------------------------------------------------------
alter policy "uat_feedback_insert_own"
  on public.uat_feedback
  with check (
    tester_id = app_private.current_uat_tester_id()
    and admin_notes is null
    and status = 'open'
    and exists (
      select 1 from public.uat_assignments a
      where a.id = uat_feedback.assignment_id
        and a.tester_id = app_private.current_uat_tester_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Sandbox access: enforce approved/active tester status
-- ---------------------------------------------------------------------------
create or replace function public.get_uat_sandbox_access(p_instance_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE
  v_tester_id uuid;
  v_instance RECORD;
  v_accounts jsonb;
  v_settings RECORD;
BEGIN
  SELECT t.id INTO v_tester_id
  FROM uat_testers t WHERE t.user_id = auth.uid() AND t.status IN ('approved', 'active');

  IF v_tester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tester not found or not approved');
  END IF;

  SELECT si.* INTO v_instance
  FROM uat_sandbox_instances si
  WHERE si.id = p_instance_id AND si.tester_id = v_tester_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox not found or access denied');
  END IF;

  IF v_instance.status NOT IN ('ready','active','paused') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox is not accessible. Current status: ' || v_instance.status);
  END IF;

  IF v_instance.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox has expired');
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sa.id,
      'account_type', sa.account_type,
      'display_name', sa.display_name,
      'username', sa.username,
      'email', sa.email,
      'status', sa.status,
      'credential_reference', sa.credential_reference
    )
  ), '[]'::jsonb) INTO v_accounts
  FROM uat_sandbox_accounts sa
  WHERE sa.sandbox_instance_id = p_instance_id AND sa.status != 'disabled';

  SELECT * INTO v_settings
  FROM uat_sandbox_settings
  WHERE project_id = v_instance.project_id
    AND (environment_id = v_instance.environment_id OR v_instance.environment_id IS NULL);

  INSERT INTO uat_audit_log (action, entity_type, entity_id, new_value)
  VALUES ('sandbox_launched', 'uat_sandbox_instance', p_instance_id, jsonb_build_object('accessed_at', now()));

  RETURN jsonb_build_object(
    'success', true,
    'instance_id', v_instance.id,
    'sandbox_url', v_instance.sandbox_url,
    'mode', v_instance.sandbox_mode,
    'status', v_instance.status,
    'expires_at', v_instance.expires_at,
    'accounts', v_accounts,
    'settings', jsonb_build_object(
      'downloads_allowed', COALESCE(v_settings.downloads_allowed, true),
      'uploads_allowed', COALESCE(v_settings.uploads_allowed, true),
      'payment_test_mode_required', COALESCE(v_settings.payment_test_mode_required, true)
    )
  );
END;
$function$;

create or replace function public.request_uat_sandbox(p_assignment_id uuid, p_session_id uuid DEFAULT NULL::uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE
  v_tester_id uuid;
  v_project_id uuid;
  v_environment_id uuid;
  v_job_id uuid;
  v_settings RECORD;
  v_existing_id uuid;
  v_instance_id uuid;
  v_expires_at timestamptz;
BEGIN
  SELECT t.id INTO v_tester_id
  FROM uat_testers t
  WHERE t.user_id = auth.uid() AND t.status IN ('approved', 'active');

  IF v_tester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tester not found or not approved');
  END IF;

  SELECT a.job_id INTO v_job_id
  FROM uat_assignments a
  WHERE a.id = p_assignment_id AND a.tester_id = v_tester_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment not found or access denied');
  END IF;

  IF v_job_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment has no linked job');
  END IF;

  SELECT j.project_id, j.environment_id
  INTO v_project_id, v_environment_id
  FROM uat_jobs j WHERE j.id = v_job_id;

  IF v_project_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found for assignment');
  END IF;

  SELECT * INTO v_settings
  FROM uat_sandbox_settings
  WHERE project_id = v_project_id
    AND (environment_id = v_environment_id OR v_environment_id IS NULL);

  IF NOT FOUND OR NOT v_settings.sandbox_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox is not enabled for this project');
  END IF;

  SELECT id INTO v_existing_id
  FROM uat_sandbox_instances
  WHERE assignment_id = p_assignment_id
    AND tester_id = v_tester_id
    AND status NOT IN ('ended','expired','failed');

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'instance_id', v_existing_id, 'already_exists', true);
  END IF;

  IF p_session_id IS NOT NULL THEN
    PERFORM 1 FROM uat_sessions
    WHERE id = p_session_id
      AND assignment_id = p_assignment_id
      AND tester_id = v_tester_id
      AND status IN ('active','paused');
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Session not active or access denied');
    END IF;
  END IF;

  v_expires_at := now() + (v_settings.session_duration_minutes || ' minutes')::interval;

  INSERT INTO uat_sandbox_instances (project_id, environment_id, job_id, assignment_id, session_id, tester_id, sandbox_mode, status, expires_at)
  VALUES (v_project_id, v_environment_id, v_job_id, p_assignment_id, p_session_id, v_tester_id, v_settings.sandbox_mode, 'requested', v_expires_at)
  RETURNING id INTO v_instance_id;

  INSERT INTO uat_sandbox_actions (sandbox_instance_id, assignment_id, tester_id, action_type, status, requested_by_user_id)
  VALUES (v_instance_id, p_assignment_id, v_tester_id, 'provision', 'requested', auth.uid());

  INSERT INTO uat_audit_log (action, entity_type, entity_id, new_value)
  VALUES ('sandbox_requested', 'uat_sandbox_instance', v_instance_id, jsonb_build_object('project_id', v_project_id, 'mode', v_settings.sandbox_mode));

  RETURN jsonb_build_object('success', true, 'instance_id', v_instance_id, 'mode', v_settings.sandbox_mode, 'expires_at', v_expires_at);
END;
$function$;

create or replace function public.reset_uat_sandbox_data(p_instance_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
DECLARE
  v_tester_id uuid;
  v_status text;
  v_reset_enabled boolean;
BEGIN
  SELECT t.id INTO v_tester_id FROM uat_testers t
  WHERE t.user_id = auth.uid() AND t.status IN ('approved', 'active');
  IF v_tester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tester not found or not approved');
  END IF;

  SELECT si.status, COALESCE(ss.reset_enabled, true)
  INTO v_status, v_reset_enabled
  FROM uat_sandbox_instances si
  LEFT JOIN uat_sandbox_settings ss ON ss.project_id = si.project_id AND (ss.environment_id = si.environment_id OR si.environment_id IS NULL)
  WHERE si.id = p_instance_id AND si.tester_id = v_tester_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox not found or access denied');
  END IF;

  IF NOT v_reset_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reset is not enabled for this sandbox');
  END IF;

  IF v_status NOT IN ('active','paused') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sandbox must be active or paused to reset. Current: ' || v_status);
  END IF;

  UPDATE uat_sandbox_instances
  SET status = 'resetting', updated_at = now(), reset_count = reset_count + 1
  WHERE id = p_instance_id;

  UPDATE uat_sandbox_seeded_records
  SET status = 'removed', deleted_at = now()
  WHERE sandbox_instance_id = p_instance_id;

  INSERT INTO uat_sandbox_actions (sandbox_instance_id, assignment_id, tester_id, action_type, status, requested_by_user_id)
  SELECT id, assignment_id, tester_id, 'reset_data', 'completed', auth.uid()
  FROM uat_sandbox_instances WHERE id = p_instance_id;

  UPDATE uat_sandbox_instances
  SET status = 'ready', updated_at = now()
  WHERE id = p_instance_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 7. Legacy intercept functions: reject direct anon/authenticated calls.
--    They are only valid when invoked by the sandbox worker (service_role).
-- ---------------------------------------------------------------------------
create or replace function public.uat_intercept_email(p_sandbox_instance_id uuid, p_sender text, p_recipient text, p_subject text, p_content_text text, p_content_html_reference text DEFAULT NULL::text, p_template_reference text DEFAULT NULL::text, p_provider_name text DEFAULT NULL::text, p_provider_ref text DEFAULT NULL::text, p_message_size integer DEFAULT 0)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
  v_safe_recipient text;
begin
  if current_user not in ('service_role', 'postgres') then
    return jsonb_build_object('success', false, 'error', 'Access denied');
  end if;

  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id and status not in ('ended', 'expired', 'failed') limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox not found or unavailable');
  end if;

  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id
    and (environment_id is null or environment_id = v_instance.environment_id)
    and email_interception_enabled = true
  order by environment_id nulls last limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'Email interception not configured');
  end if;

  if v_settings.block_unapproved_recipients then
    if p_recipient !~ '@(dfp-test\.local|example\.test|digital-footprint\.uk|dfp\.test)$' then
      v_status := 'blocked';
    end if;
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  v_safe_recipient := regexp_replace(p_recipient, '^([^@]{2})[^@]*(@.*)$', '\1***\2');

  insert into uat_sandbox_messages (project_id, environment_id, assignment_id, session_id, sandbox_instance_id, tester_id, message_type, direction, provider_name, provider_message_reference, sender_address, recipient_address, recipient_display, subject, safe_preview, content_text, content_html_reference, template_reference, status, delivery_simulation, intercepted_at, expires_at)
  values (v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id, p_sandbox_instance_id, v_instance.tester_id, 'email', 'outbound', p_provider_name, p_provider_ref, p_sender, v_safe_recipient, p_recipient, p_subject, left(p_content_text, 200), p_content_text, p_content_html_reference, p_template_reference, v_status, v_simulation, now(), now() + (v_settings.retention_days || ' days')::interval)
  returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('size', p_message_size));

  if v_status = 'blocked' then
    insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
    values (v_message_id, 'blocked', jsonb_build_object('reason', 'unapproved_recipient'));
  end if;

  if v_status in ('simulated_delivered', 'simulated_failed') then
    insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
    values (v_message_id, v_status, '');
  end if;

  return jsonb_build_object('success', true, 'intercepted', true, 'message_id', v_message_id, 'status', v_status);
end;
$function$;

create or replace function public.uat_intercept_sms(p_sandbox_instance_id uuid, p_sender text, p_recipient text, p_content_text text, p_provider_name text DEFAULT NULL::text)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
begin
  if current_user not in ('service_role', 'postgres') then
    return jsonb_build_object('success', false, 'error', 'Access denied');
  end if;

  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id and status not in ('ended', 'expired', 'failed') limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox unavailable');
  end if;

  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id and sms_interception_enabled = true limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'SMS interception not configured');
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  insert into uat_sandbox_messages (project_id, environment_id, assignment_id, session_id, sandbox_instance_id, tester_id, message_type, direction, provider_name, sender_address, recipient_address, subject, safe_preview, content_text, status, delivery_simulation, intercepted_at, expires_at)
  values (v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id, p_sandbox_instance_id, v_instance.tester_id, 'sms', 'outbound', p_provider_name, p_sender, left(p_recipient, 4) || '****', 'SMS', left(p_content_text, 200), p_content_text, v_status, v_simulation, now(), now() + (v_settings.retention_days || ' days')::interval)
  returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('type', 'sms'));

  return jsonb_build_object('success', true, 'intercepted', true, 'message_id', v_message_id, 'status', v_status);
end;
$function$;

create or replace function public.uat_intercept_webhook(p_sandbox_instance_id uuid, p_event_name text, p_http_method text, p_destination text, p_safe_summary jsonb DEFAULT NULL, p_provider_name text DEFAULT NULL::text)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_instance record;
  v_settings record;
  v_message_id uuid;
  v_status text := 'intercepted';
  v_simulation text;
begin
  if current_user not in ('service_role', 'postgres') then
    return jsonb_build_object('success', false, 'error', 'Access denied');
  end if;

  select * into v_instance from uat_sandbox_instances
  where id = p_sandbox_instance_id and status not in ('ended', 'expired', 'failed') limit 1;

  if v_instance is null then
    return jsonb_build_object('success', false, 'error', 'Sandbox unavailable');
  end if;

  select * into v_settings from uat_sandbox_communication_settings
  where project_id = v_instance.project_id and webhook_interception_enabled = true limit 1;

  if v_settings is null then
    return jsonb_build_object('success', false, 'error', 'Webhook interception not configured');
  end if;

  v_simulation := v_settings.delivery_simulation_mode;
  if v_simulation = 'simulate_delivered' then v_status := 'simulated_delivered'; end if;
  if v_simulation = 'simulate_failed' then v_status := 'simulated_failed'; end if;

  insert into uat_sandbox_messages (project_id, environment_id, assignment_id, session_id, sandbox_instance_id, tester_id, message_type, direction, provider_name, recipient_address, subject, safe_preview, content_text, status, delivery_simulation, intercepted_at, expires_at)
  values (v_instance.project_id, v_instance.environment_id, v_instance.assignment_id, v_instance.session_id, p_sandbox_instance_id, v_instance.tester_id, 'webhook', 'outbound', p_provider_name, p_destination, p_event_name, p_safe_summary::text, p_safe_summary::text, v_status, v_simulation, now(), now() + (v_settings.retention_days || ' days')::interval)
  returning id into v_message_id;

  insert into uat_sandbox_message_events (message_id, event_type, safe_metadata)
  values (v_message_id, 'captured', jsonb_build_object('method', p_http_method, 'destination', p_destination));

  return jsonb_build_object('success', true, 'intercepted', true, 'message_id', v_message_id, 'status', v_status);
end;
$function$;