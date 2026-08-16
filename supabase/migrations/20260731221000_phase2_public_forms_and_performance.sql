-- Phase 2 Security Migration: Public Form Protection, Analytics Hardening, Index Cleanup
-- Applied: 2026-07-31
-- Follows Phase 1 critical database security fixes

-- ====================================================
-- TASK 5: SECURE PUBLIC APPLICATION FORMS
-- ====================================================

-- Remove unsafe public insert policies
-- Executed via app_private.phase2_policy_cleanup():
-- DROP POLICY IF EXISTS "Anon can insert applications" ON public.career_applications;
-- DROP POLICY IF EXISTS "Public insert" ON public.partner_applications;
-- DROP POLICY IF EXISTS "Admin full access to applications" ON public.career_applications;
-- DROP POLICY IF EXISTS "Admin full access" ON public.partner_applications;

-- Remove overly broad table grants from anon/authenticated
-- Executed via app_private.phase2_revoke_cleanup():
-- REVOKE ALL PRIVILEGES ON public.career_applications FROM anon, authenticated;
-- REVOKE ALL PRIVILEGES ON public.partner_applications FROM anon, authenticated;
-- REVOKE ALL PRIVILEGES ON public.public_analytics_events FROM anon, authenticated;

-- Add constrained insert policies for public forms
-- Career applications: anon can insert only with validated field values
CREATE POLICY "career_anon_insert_validated" ON public.career_applications
FOR INSERT TO anon
WITH CHECK (
  application_status = 'submitted'
  AND assigned_reviewer_id IS NULL
  AND archived_at IS NULL
);

-- Partner applications: anon can insert only with validated field values
CREATE POLICY "partner_anon_insert_validated" ON public.partner_applications
FOR INSERT TO anon
WITH CHECK (
  status = 'submitted'
  AND assigned_owner_id IS NULL
  AND linked_company_id IS NULL
  AND linked_contact_id IS NULL
  AND linked_lead_id IS NULL
  AND archived_at IS NULL
);

-- Admin access: only users with active admin_profiles
CREATE POLICY "career_admin_all" ON public.career_applications
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_profiles WHERE admin_profiles.id = auth.uid() AND admin_profiles.active = true));

CREATE POLICY "partner_admin_all" ON public.partner_applications
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admin_profiles WHERE admin_profiles.id = auth.uid() AND admin_profiles.active = true));

-- ====================================================
-- TASK 6: SECURE ANALYTICS WRITES
-- ====================================================

-- Remove unsafe policies that allowed all authenticated users
-- DROP POLICY IF EXISTS "Admins can insert analytics events" ON public.public_analytics_events;
-- DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.public_analytics_events;

-- Replace with actual admin-only policies
CREATE POLICY "analytics_insert_admin_only" ON public.public_analytics_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_profiles WHERE admin_profiles.id = auth.uid() AND admin_profiles.active = true)
);

CREATE POLICY "analytics_select_admin_only" ON public.public_analytics_events
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_profiles WHERE admin_profiles.id = auth.uid() AND admin_profiles.active = true)
);

-- ====================================================
-- TASK 7: STORAGE HARDENING
-- ====================================================

-- Add MIME allow-list to project-files bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.ms-word',
  'application/zip',
  'application/json',
  'text/html',
  'text/css',
  'application/javascript'
]
WHERE name = 'project-files';

-- ====================================================
-- TASK 8: DATABASE PERFORMANCE AND GRANT CLEANUP
-- ====================================================

-- Remove duplicate indexes
-- DROP INDEX IF EXISTS idx_uat_environments_project;  (kept uat_environments_project_idx)
-- DROP INDEX IF EXISTS idx_uat_feedback_tester;       (kept uat_feedback_tester_idx)
-- DROP INDEX IF EXISTS idx_uat_feedback_project;      (kept uat_feedback_project_idx)
-- DROP INDEX IF EXISTS idx_uat_jobs_project;          (kept uat_jobs_project_idx)
-- DROP INDEX IF EXISTS idx_uat_jobs_reference;        (kept unique uat_jobs_reference_key)
-- DROP INDEX IF EXISTS idx_uat_projects_reference;    (kept unique uat_projects_reference_key)

-- Add high-value FK indexes (justified by query patterns)
CREATE INDEX IF NOT EXISTS idx_project_messages_thread_id ON public.project_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_client_id ON public.message_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_project_id ON public.message_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_project_id ON public.support_tickets(project_id);