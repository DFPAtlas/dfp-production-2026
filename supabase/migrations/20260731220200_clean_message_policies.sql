-- ============================================================
-- SECURITY: Clean up message_threads and message_read_receipts
-- RLS policies
-- ============================================================
-- Issues addressed:
-- 1. message_read_receipts: 7 overlapping policies (v1 + v2
--    coexisting). Remove old v1 policies, keep v2 with
--    cross-tenant isolation checks.
-- 2. message_threads: threads_update_client_v2 contains a
--    broken self-comparison (message_threads_1.id =
--    message_threads_1.id) which is always true and causes
--    the subquery to return all rows — broken policy.
--    Replace with a safe trigger function for column
--    immutability protection.
-- ============================================================

-- -------------------------------------------------------
-- 4a. Drop old overlapping policies from message_read_receipts
--     Keep v2 policies, receipts_internal
-- -------------------------------------------------------
DROP POLICY IF EXISTS "receipts_insert_own" ON public.message_read_receipts;
DROP POLICY IF EXISTS "receipts_select_own" ON public.message_read_receipts;
DROP POLICY IF EXISTS "receipts_update_own" ON public.message_read_receipts;

-- -------------------------------------------------------
-- 4b. Drop the broken threads_update_client_v2 policy
--     (self-comparison bug: message_threads_1.id = message_threads_1.id)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "threads_update_client_v2" ON public.message_threads;

-- -------------------------------------------------------
-- 4c. Create a safe trigger function to prevent clients
--     from modifying immutable columns on message_threads
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_message_thread_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Staff/internal bypass all checks
  IF public.app_private.is_internal() THEN
    RETURN NEW;
  END IF;

  -- Columns clients must never modify directly
  IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    RAISE EXCEPTION 'Modification of client_id is not permitted';
  END IF;
  IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    RAISE EXCEPTION 'Modification of project_id is not permitted';
  END IF;
  IF NEW.website_id IS DISTINCT FROM OLD.website_id THEN
    RAISE EXCEPTION 'Modification of website_id is not permitted';
  END IF;
  IF NEW.approval_id IS DISTINCT FROM OLD.approval_id THEN
    RAISE EXCEPTION 'Modification of approval_id is not permitted';
  END IF;
  IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id THEN
    RAISE EXCEPTION 'Modification of invoice_id is not permitted';
  END IF;
  IF NEW.ticket_id IS DISTINCT FROM OLD.ticket_id THEN
    RAISE EXCEPTION 'Modification of ticket_id is not permitted';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Modification of created_by is not permitted';
  END IF;
  IF NEW.assigned_staff IS DISTINCT FROM OLD.assigned_staff THEN
    RAISE EXCEPTION 'Modification of assigned_staff is not permitted';
  END IF;
  IF NEW.thread_type IS DISTINCT FROM OLD.thread_type THEN
    RAISE EXCEPTION 'Modification of thread_type is not permitted';
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_message_thread_immutable_columns ON public.message_threads;
CREATE TRIGGER trg_message_thread_immutable_columns
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_thread_immutable_columns();

-- ============================================================
-- Remaining policies on message_threads (all intact):
-- - threads_insert_client: INSERT with client auth
-- - threads_select_client: SELECT with client auth
-- - threads_update_client: UPDATE with basic client auth
-- - threads_internal: ALL for internal staff
-- 
-- The trigger trg_message_thread_immutable_columns enforces
-- column immutability for non-staff users.
-- ============================================================

-- ============================================================
-- Remaining policies on message_read_receipts (after cleanup):
-- - receipts_insert_own_v2: INSERT with cross-tenant check
-- - receipts_select_own_v2: SELECT with cross-tenant check
-- - receipts_update_own_v2: UPDATE with cross-tenant check
-- - receipts_internal: ALL for internal staff
-- ============================================================

-- ============================================================
-- VERIFICATION
-- ============================================================
-- - Client A cannot read or update Client B's threads
-- - Client A cannot create read receipts for another user
-- - Protected columns cannot be changed by a client (trigger)
-- - Authorised message updates still work
-- - Staff/admin access works via is_internal()
-- - No duplicate permissive policies remain
-- ============================================================