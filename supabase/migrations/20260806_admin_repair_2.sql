-- DFP Admin Repair 2: Role consistency, RLS hardening, admin_profiles constraint
-- Timestamp: 20260806T000000

-- Drop existing policies (replace with hardened versions)
DROP POLICY IF EXISTS "admin_profiles_insert" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_delete" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_select" ON public.admin_profiles;

-- Hardened INSERT: only owner/super_admin can create profiles
CREATE POLICY "admin_profiles_insert" ON public.admin_profiles
  FOR INSERT
  WITH CHECK (app_private.is_privileged_admin());

-- Hardened UPDATE: only owner/super_admin, block self role change
CREATE POLICY "admin_profiles_update" ON public.admin_profiles
  FOR UPDATE
  USING (app_private.is_privileged_admin())
  WITH CHECK (app_private.is_privileged_admin());

-- Hardened DELETE: only owner/super_admin
CREATE POLICY "admin_profiles_delete" ON public.admin_profiles
  FOR DELETE
  USING (app_private.is_privileged_admin());

-- SELECT: self-read OR any active admin
CREATE POLICY "admin_profiles_select" ON public.admin_profiles
  FOR SELECT
  USING (auth.uid() = id OR app_private.is_admin());

-- Migrate human-readable role labels to canonical keys
UPDATE public.admin_profiles SET role = 'owner' WHERE role = 'Owner';
UPDATE public.admin_profiles SET role = 'super_admin' WHERE role = 'Super Administrator';
UPDATE public.admin_profiles SET role = 'admin' WHERE role = 'Administrator';
UPDATE public.admin_profiles SET role = 'department_head' WHERE role = 'Department Head';
UPDATE public.admin_profiles SET role = 'team_lead' WHERE role = 'Team Lead';
UPDATE public.admin_profiles SET role = 'manager' WHERE role = 'Manager';
UPDATE public.admin_profiles SET role = 'staff' WHERE role = 'Staff Member';
UPDATE public.admin_profiles SET role = 'contractor' WHERE role = 'Contractor';
UPDATE public.admin_profiles SET role = 'auditor' WHERE role = 'Read-Only Auditor';

-- Add CHECK constraint for canonical role values
-- Detect unknown roles before applying constraint
DO $$
DECLARE
  unknown_roles text[];
BEGIN
  SELECT array_agg(DISTINCT role) INTO unknown_roles
  FROM public.admin_profiles
  WHERE role NOT IN ('owner', 'super_admin', 'admin', 'department_head', 'team_lead', 'manager', 'staff', 'contractor', 'auditor');

  IF unknown_roles IS NOT NULL AND array_length(unknown_roles, 1) > 0 THEN
    RAISE WARNING 'Unknown admin role values remain: %. Manual review required.', array_to_string(unknown_roles, ', ');
  END IF;
END
$$;

ALTER TABLE public.admin_profiles
  DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

ALTER TABLE public.admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('owner', 'super_admin', 'admin', 'department_head', 'team_lead', 'manager', 'staff', 'contractor', 'auditor'));

-- Secure admin profile management function (owner/super_admin only)
CREATE OR REPLACE FUNCTION app_private.manage_admin_profile(
  target_user_id uuid,
  target_role text DEFAULT NULL,
  target_active boolean DEFAULT NULL,
  target_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid;
  caller_role text;
  target_exists boolean;
BEGIN
  caller_id := (SELECT auth.uid());
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO caller_role
  FROM public.admin_profiles
  WHERE id = caller_id AND active = true;

  IF caller_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caller has no active admin profile');
  END IF;

  IF caller_role NOT IN ('owner', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owners and super administrators can manage admin profiles');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.admin_profiles WHERE id = target_user_id) INTO target_exists;
  IF NOT target_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target admin profile not found');
  END IF;

  IF target_role IS NOT NULL AND target_role NOT IN ('owner', 'super_admin', 'admin', 'department_head', 'team_lead', 'manager', 'staff', 'contractor', 'auditor') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid target role: ' || target_role);
  END IF;

  IF target_user_id = caller_id AND target_role IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot change your own role');
  END IF;

  IF target_user_id = caller_id AND target_active IS NOT NULL AND target_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot deactivate your own profile');
  END IF;

  UPDATE public.admin_profiles
  SET
    role = COALESCE(target_role, role),
    active = COALESCE(target_active, active),
    status = COALESCE(target_status, status),
    updated_at = now()
  WHERE id = target_user_id;

  INSERT INTO public.admin_security_audit_log (
    actor_id,
    action,
    target_user_id,
    success,
    details,
    created_at,
    module,
    source
  ) VALUES (
    caller_id,
    'admin_profile_updated',
    target_user_id,
    true,
    jsonb_build_object(
      'new_role', target_role,
      'new_active', target_active,
      'new_status', target_status
    ),
    now(),
    'admin-repair-2',
    'edge_function'
  );

  RETURN jsonb_build_object('success', true, 'message', 'Profile updated');
END;
$$;