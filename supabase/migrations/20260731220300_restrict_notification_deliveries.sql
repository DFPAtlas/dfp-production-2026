-- ============================================================
-- SECURITY: Restrict notification_deliveries table access
-- ============================================================
-- Issue: ndeliveries_insert_service is a public INSERT policy
-- with with_check = true, allowing any anonymous or
-- authenticated user to insert arbitrary notification
-- delivery records, potentially spoofing delivery status.
-- ============================================================

-- 1. Drop the unsafe public insert policy
DROP POLICY IF EXISTS "ndeliveries_insert_service" ON public.notification_deliveries;

-- 2. Revoke INSERT, UPDATE, DELETE from anon and authenticated
--    The notification email Edge Function uses service_role
--    and bypasses RLS, so delivery recording continues to work.
--    Users can still SELECT their own notifications via the
--    existing ndeliveries_select_own policy.
REVOKE INSERT ON public.notification_deliveries FROM anon;
REVOKE INSERT ON public.notification_deliveries FROM authenticated;
REVOKE UPDATE ON public.notification_deliveries FROM anon;
REVOKE UPDATE ON public.notification_deliveries FROM authenticated;
REVOKE DELETE ON public.notification_deliveries FROM anon;
REVOKE DELETE ON public.notification_deliveries FROM authenticated;

-- ============================================================
-- Remaining policy:
-- - ndeliveries_select_own: SELECT allowing users to read
--   notification deliveries for their own notifications
-- ============================================================

-- ============================================================
-- VERIFICATION
-- ============================================================
-- - anon INSERT is rejected
-- - authenticated INSERT is rejected
-- - anon UPDATE is rejected
-- - authenticated UPDATE is rejected
-- - anon DELETE is rejected
-- - authenticated DELETE is rejected
-- - authenticated SELECT for own notifications still works
-- - Edge Function (service_role) insert/update still works
-- ============================================================