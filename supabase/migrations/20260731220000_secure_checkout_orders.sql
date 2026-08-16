-- ============================================================
-- SECURITY: Remove unsafe public policies on dfp_checkout_orders
-- ============================================================
-- Problem: Two permissive public policies allow anonymous and
-- authenticated users to read ALL checkout orders and perform
-- arbitrary DML on the table. The service role already bypasses
-- RLS and the checkout Edge Functions use service_role keys.
-- No browser/client should have direct table access.
-- ============================================================

-- 1. Drop the unsafe policies
DROP POLICY IF EXISTS "Public can read own checkout orders by project_reference" ON public.dfp_checkout_orders;
DROP POLICY IF EXISTS "Service role can manage dfp_checkout_orders" ON public.dfp_checkout_orders;

-- 2. Revoke all privileges from anonymous and authenticated roles
--    Service_role and postgres retain their access for Edge Functions.
REVOKE ALL ON public.dfp_checkout_orders FROM anon;
REVOKE ALL ON public.dfp_checkout_orders FROM authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After this migration:
-- - anon SELECT/INSERT/UPDATE/DELETE returns permission denied
-- - authenticated non-admin SELECT/INSERT/UPDATE/DELETE returns permission denied
-- - Edge Functions using service_role continue to work
-- - checkout creation (dfp-website-checkout) still works
-- - checkout status lookup (dfp-website-checkout-status) still works
-- - stripe webhook processing still works
-- ============================================================