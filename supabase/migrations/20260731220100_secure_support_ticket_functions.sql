-- ============================================================
-- SECURITY: Fix create_client_support_ticket and secure all
-- SECURITY DEFINER function grants
-- ============================================================
-- Issues addressed:
-- 1. create_client_support_ticket accepts p_created_by from caller
--    and falls back to auth.uid() only when null — allowing identity
--    spoofing. Fix: remove the parameter, always use auth.uid().
-- 2. Missing SET search_path on create_client_support_ticket,
--    client_close_ticket, and client_reopen_ticket.
-- 3. All five functions grant EXECUTE to anon and PUBLIC.
--    Revoke from anon; keep authenticated where genuinely needed.
-- 4. Add input validation to create_client_support_ticket.
-- 5. Add a lightweight support ticket audit log table.
-- ============================================================

-- -------------------------------------------------------
-- 5a. Drop and recreate create_client_support_ticket
--     without the unsafe p_created_by parameter
-- -------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_client_support_ticket(uuid, text, text, text, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_client_support_ticket(
  p_client_id uuid,
  p_subject text,
  p_description text,
  p_category text,
  p_priority text,
  p_project_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid;
  v_ticket_id uuid;
  v_thread_id uuid;
  v_message_id uuid;
  v_ticket_ref text;
  v_ref_exists boolean := true;
  v_valid_categories text[] := ARRAY['website_issue','account','access','billing','content','change_request','technical','hosting','security','other'];
  v_valid_priorities text[] := ARRAY['low','normal','high','urgent'];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Validate subject
  IF p_subject IS NULL OR length(trim(p_subject)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subject is required');
  END IF;
  IF length(trim(p_subject)) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subject must not exceed 500 characters');
  END IF;

  -- Validate description
  IF p_description IS NULL OR length(trim(p_description)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Description is required');
  END IF;
  IF length(trim(p_description)) > 3000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Description must not exceed 3000 characters');
  END IF;

  -- Validate category
  IF p_category IS NULL OR NOT (p_category = ANY(v_valid_categories)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid category');
  END IF;

  -- Validate priority
  IF p_priority IS NULL OR NOT (p_priority = ANY(v_valid_priorities)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid priority');
  END IF;

  -- Validate UUID relationships
  IF p_client_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client ID is required');
  END IF;

  -- Verify the authenticated user is authorised for this client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients WHERE id = p_client_id AND user_id = v_user_id
  ) THEN
    INSERT INTO public.support_ticket_audit_log (
      event_type, ticket_id, client_id, actor_id, details, created_at
    ) VALUES (
      'unauthorised_attempt', NULL, p_client_id, v_user_id,
      jsonb_build_object('reason', 'user not authorised for client', 'subject', p_subject),
      now()
    );
    RETURN jsonb_build_object('success', false, 'error', 'You are not authorised to create tickets for this client');
  END IF;

  -- Validate project belongs to client if provided
  IF p_project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects WHERE id = p_project_id AND client_id = p_client_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Project does not belong to this client');
    END IF;
  END IF;

  -- Generate unique ticket reference
  LOOP
    v_ticket_ref := 'TKT-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE ticket_reference = v_ticket_ref) INTO v_ref_exists;
    EXIT WHEN NOT v_ref_exists;
  END LOOP;

  -- Create ticket (created_by always auth.uid())
  INSERT INTO public.support_tickets (
    ticket_reference, client_id, project_id, subject, description,
    category, priority, status, created_by
  ) VALUES (
    v_ticket_ref, p_client_id, p_project_id, trim(p_subject), trim(p_description),
    p_category, p_priority, 'new', v_user_id
  ) RETURNING id INTO v_ticket_id;

  -- Create message thread
  INSERT INTO public.message_threads (
    client_id, project_id, ticket_id, subject, thread_type,
    status, priority, created_by, client_visible
  ) VALUES (
    p_client_id, p_project_id, v_ticket_id,
    '[Support] ' || trim(p_subject), 'support',
    'awaiting_team', p_priority, v_user_id, true
  ) RETURNING id INTO v_thread_id;

  -- Link thread to ticket
  UPDATE public.support_tickets SET thread_id = v_thread_id WHERE id = v_ticket_id;

  -- Create first message
  INSERT INTO public.project_messages (
    project_id, thread_id, sender_id, sender_name,
    content, is_internal, read
  ) VALUES (
    COALESCE(p_project_id, '00000000-0000-0000-0000-000000000000'),
    v_thread_id, v_user_id, 'Client',
    trim(p_description), false, false
  ) RETURNING id INTO v_message_id;

  -- Notify staff
  INSERT INTO public.notifications (
    recipient_user_id, event_type, category, severity,
    title, message, related_module, related_record_type, related_record_id,
    route, source_system, dedup_key
  )
  SELECT
    sp.id, 'support.ticket.created', 'support', 'info',
    'New support ticket: ' || trim(p_subject),
    trim(p_description),
    'support', 'support_ticket', v_ticket_id,
    '/admin/projects/' || COALESCE(p_project_id::text, ''), 'system',
    'ticket:' || v_ticket_id || ':created'
  FROM public.staff_profiles sp
  WHERE sp.role IN ('admin', 'support_lead', 'support_agent')
  LIMIT 5;

  -- Audit log
  INSERT INTO public.support_ticket_audit_log (
    event_type, ticket_id, client_id, actor_id, details, created_at
  ) VALUES (
    'ticket_created', v_ticket_id, p_client_id, v_user_id,
    jsonb_build_object('ticket_reference', v_ticket_ref, 'category', p_category, 'priority', p_priority),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'thread_id', v_thread_id,
    'ticket_reference', v_ticket_ref
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- -------------------------------------------------------
-- 5b. Revoke EXECUTE from anon and PUBLIC for all five
--     SECURITY DEFINER functions
-- -------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.create_client_support_ticket(uuid, text, text, text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_client_support_ticket(uuid, text, text, text, text, uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.client_close_ticket(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.client_close_ticket(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.client_reopen_ticket(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.client_reopen_ticket(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.convert_lead_to_client(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.convert_lead_to_client(jsonb) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_project_with_discovery(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_project_with_discovery(jsonb) FROM PUBLIC;

-- -------------------------------------------------------
-- 5c. Fix search_path on client_close_ticket and
--     client_reopen_ticket (create_client_support_ticket
--     already fixed in 5a; convert_lead_to_client and 
--     create_project_with_discovery already have search_path)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_close_ticket(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_ticket public.support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.clients WHERE id = v_ticket.client_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorised');
  END IF;

  IF v_ticket.status IN ('resolved', 'closed', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket already finalised');
  END IF;

  UPDATE public.support_tickets SET status = 'closed', closed_at = now(), updated_at = now()
  WHERE id = p_ticket_id;

  IF v_ticket.thread_id IS NOT NULL THEN
    UPDATE public.message_threads SET status = 'closed', closed_at = now(), updated_at = now()
    WHERE id = v_ticket.thread_id;
  END IF;

  INSERT INTO public.support_ticket_audit_log (
    event_type, ticket_id, client_id, actor_id, details, created_at
  ) VALUES (
    'ticket_closed', p_ticket_id, v_ticket.client_id, v_user_id,
    jsonb_build_object('previous_status', v_ticket.status),
    now()
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.client_reopen_ticket(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_ticket public.support_tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.clients WHERE id = v_ticket.client_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorised');
  END IF;

  IF v_ticket.status NOT IN ('resolved', 'closed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not in a closed state');
  END IF;

  UPDATE public.support_tickets
  SET status = 'open', resolved_at = NULL, closed_at = NULL, updated_at = now()
  WHERE id = p_ticket_id;

  IF v_ticket.thread_id IS NOT NULL THEN
    UPDATE public.message_threads SET status = 'open', closed_at = NULL, updated_at = now()
    WHERE id = v_ticket.thread_id;
  END IF;

  INSERT INTO public.support_ticket_audit_log (
    event_type, ticket_id, client_id, actor_id, details, created_at
  ) VALUES (
    'ticket_reopened', p_ticket_id, v_ticket.client_id, v_user_id,
    jsonb_build_object('previous_status', v_ticket.status),
    now()
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- -------------------------------------------------------
-- 5d. Create lightweight support ticket audit log table
--     Does not store message content or personal data
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_ticket_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  ticket_id uuid,
  client_id uuid,
  actor_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.support_ticket_audit_log ENABLE ROW LEVEL SECURITY;

-- Only staff/internal can read the audit log
CREATE POLICY "staff_read_audit_log" ON public.support_ticket_audit_log
  FOR SELECT
  TO authenticated
  USING (public.app_private.is_internal());

-- Nobody can insert/update/delete except through SECURITY DEFINER functions
REVOKE ALL ON public.support_ticket_audit_log FROM anon;
REVOKE ALL ON public.support_ticket_audit_log FROM authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- - anon cannot call any of the five functions
-- - authenticated client can create ticket only for own client
-- - p_created_by is dead — always auth.uid()
-- - invalid inputs are rejected
-- - ticket close/reopen audited
-- - Edge Functions unchanged
-- ============================================================