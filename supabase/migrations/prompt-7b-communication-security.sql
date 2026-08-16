-- =============================================================================
-- MIGRATION: prompt-7b-communication-security
-- Description: Drop obsolete RLS policies, fix broken policies,
--              strengthen project_messages access control,
--              add email tracking columns to notification_deliveries
-- Run: Supabase Dashboard > SQL Editor > paste and execute
-- =============================================================================

-- 1. DROP OBSOLETE POLICIES ON message_read_receipts
DROP POLICY IF EXISTS receipts_select_own ON public.message_read_receipts;
DROP POLICY IF EXISTS receipts_insert_own ON public.message_read_receipts;
DROP POLICY IF EXISTS receipts_update_own ON public.message_read_receipts;

-- 2. DROP BROKEN/PERMISSIVE POLICIES ON message_threads
DROP POLICY IF EXISTS threads_update_client ON public.message_threads;
DROP POLICY IF EXISTS threads_update_client_v2 ON public.message_threads;

-- 3. DROP WEAK project_messages POLICIES
DROP POLICY IF EXISTS project_messages_select ON public.project_messages;
DROP POLICY IF EXISTS project_messages_insert ON public.project_messages;

-- =============================================================================
-- 4. RECREATE STRENGTHENED POLICIES
-- =============================================================================

-- message_threads: fixed v3 update policy for clients
CREATE POLICY threads_update_client_v3 ON public.message_threads
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND client_visible = true
    AND EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = message_threads.client_id 
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = message_threads.client_id 
      AND clients.user_id = auth.uid()
    )
    AND client_visible = true
    AND created_by = auth.uid()
  );

-- project_messages SELECT: thread-based messages excluded from weak policy
CREATE POLICY project_messages_select ON public.project_messages
  FOR SELECT
  USING (
    (
      thread_id IS NULL 
      AND app_private.can_access_project(project_id) 
      AND (is_internal = false OR app_private.is_internal())
    )
    OR app_private.is_internal()
  );

-- project_messages INSERT: thread-based messages excluded from weak policy
CREATE POLICY project_messages_insert ON public.project_messages
  FOR INSERT
  WITH CHECK (
    (thread_id IS NULL AND app_private.can_access_project(project_id) AND is_internal = false AND sender_id = auth.uid())
    OR app_private.is_internal()
  );

-- =============================================================================
-- 5. ADD EMAIL TRACKING COLUMNS TO notification_deliveries
-- =============================================================================

ALTER TABLE public.notification_deliveries 
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_deliveries_idempotency 
  ON public.notification_deliveries(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.notification_deliveries 
  ALTER COLUMN notification_id DROP NOT NULL;

-- =============================================================================
-- 6. VERIFICATION (run after migration)
-- =============================================================================

-- Verify only v2 policies on message_read_receipts:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='message_read_receipts' AND schemaname='public' ORDER BY policyname;

-- Verify no old threads_update_client:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='message_threads' AND schemaname='public' ORDER BY policyname;

-- Verify project_messages policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='project_messages' AND schemaname='public' ORDER BY policyname;

-- Verify notification_deliveries new columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notification_deliveries' AND column_name IN ('idempotency_key','recipient','event_type','completed_at') ORDER BY column_name;