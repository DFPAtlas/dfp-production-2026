import type { Session } from '@supabase/supabase-js';
import { supabase, getSessionSafe } from '@/lib/supabase';

import {
  normaliseAdminRole,
  isFullAdminRole,
} from '@/lib/admin-roles';

export {
  ADMIN_ROLE_KEYS,
  ADMIN_ROLE_LABELS,
  FULL_ADMIN_ROLES,
  PRIVILEGED_ADMIN_ROLES,
  normaliseAdminRole,
  isFullAdminRole,
  isPrivilegedAdminRole,
  getAdminRoleLabel,
} from '@/lib/admin-roles';
export type { AdminRoleKey } from '@/lib/admin-roles';

export interface AdminProfileAccessRecord {
  id: string;
  email: string;
  role: string;
  active: boolean;
  suspended_at: string | null;
  archived_at: string | null;
}

export type AdminAccessDeniedReason = 'unauthenticated' | 'profile_missing' | 'inactive' | 'role_not_allowed' | 'query_failed';

export type AdminAccessResult =
  | {
      allowed: true;
      userId: string;
      role: 'owner' | 'super_admin' | 'admin';
      profile: AdminProfileAccessRecord;
    }
  | {
      allowed: false;
      reason: AdminAccessDeniedReason;
      message?: string;
    };

function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 3) return local[0] + '***' + domain;
  return local.slice(0, 2) + '***' + local.slice(-1) + domain;
}

export function getAccessDeniedMessage(reason: AdminAccessDeniedReason): string {
  switch (reason) {
    case 'unauthenticated':
      return 'No active session found. Redirecting to sign in…';
    case 'profile_missing':
      return 'This account does not have an administrator profile.';
    case 'inactive':
      return 'Your administrator account is inactive.';
    case 'role_not_allowed':
      return 'This account is not authorised for the administrator portal.';
    case 'query_failed':
      return 'Administrator access could not be verified. Please try again.';
    default:
      return 'Access denied.';
  }
}

export async function verifyAdminAccess(session: Session): Promise<AdminAccessResult> {
  if (!supabase) {
    return { allowed: false, reason: 'query_failed', message: 'Authentication service is unavailable.' };
  }

  const userId = session.user.id;

  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('id, email, role, active, suspended_at, archived_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { allowed: false, reason: 'query_failed', message: 'Database query failed.' };
  }

  if (!profile) {
    return { allowed: false, reason: 'profile_missing', message: 'No admin profile found.' };
  }

  if (!profile.active) {
    return { allowed: false, reason: 'inactive', message: 'Account is not active.' };
  }

  if (profile.suspended_at || profile.archived_at) {
    return { allowed: false, reason: 'inactive', message: 'Account is suspended or archived.' };
  }

  const normalisedRole = normaliseAdminRole(profile.role);
  if (!normalisedRole || !isFullAdminRole(normalisedRole)) {
    return { allowed: false, reason: 'role_not_allowed', message: `Role "${profile.role}" is not a full admin role.` };
  }

  return {
    allowed: true,
    userId,
    role: normalisedRole,
    profile: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      active: profile.active,
      suspended_at: profile.suspended_at,
      archived_at: profile.archived_at,
    },
  };
}

export async function getCurrentAdminAccess(): Promise<AdminAccessResult> {
  if (!supabase) {
    return { allowed: false, reason: 'query_failed', message: 'Authentication service is unavailable.' };
  }

  try {
    const session = await getSessionSafe();

    if (!session?.user) {
      return { allowed: false, reason: 'unauthenticated', message: 'No active session.' };
    }

    return await verifyAdminAccess(session);
  } catch {
    return { allowed: false, reason: 'query_failed', message: 'Unexpected error during access check.' };
  }
}