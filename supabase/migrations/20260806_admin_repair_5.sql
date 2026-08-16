-- DFP Admin Repair 5 — RLS hardening
-- Applied: 2026-08-06

-- Fix UAT sessions: use is_admin() instead of staff_profiles for staff read
-- Previously: staff_read_all_sessions checked staff_profiles.role, missing admins without staff profile
ALTER POLICY staff_read_all_sessions ON uat_sessions
  TO authenticated
  USING (app_private.is_admin());

-- Fix UAT sandbox instances: use is_admin() with active check
-- Previously: raw EXISTS on admin_profiles without active check
ALTER POLICY staff_read_instances ON uat_sandbox_instances
  TO authenticated
  USING (app_private.is_admin());

ALTER POLICY staff_update_instances ON uat_sandbox_instances
  TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- Verification queries (run and confirm rows updated):
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('uat_sessions', 'uat_sandbox_instances') ORDER BY tablename, policyname;