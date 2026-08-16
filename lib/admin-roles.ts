export const ADMIN_ROLE_KEYS = [
  'owner',
  'super_admin',
  'admin',
  'department_head',
  'team_lead',
  'manager',
  'staff',
  'contractor',
  'auditor',
] as const;

export type AdminRoleKey = (typeof ADMIN_ROLE_KEYS)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRoleKey, string> = {
  owner: 'Owner',
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  department_head: 'Department Head',
  team_lead: 'Team Lead',
  manager: 'Manager',
  staff: 'Staff Member',
  contractor: 'Contractor',
  auditor: 'Auditor',
};

export const FULL_ADMIN_ROLES: AdminRoleKey[] = ['owner', 'super_admin', 'admin'];

export const PRIVILEGED_ADMIN_ROLES: AdminRoleKey[] = ['owner', 'super_admin'];

export function normaliseAdminRole(raw: string | null | undefined): AdminRoleKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  switch (trimmed) {
    case 'owner':
    case 'Owner':
      return 'owner';
    case 'super_admin':
    case 'Super Administrator':
      return 'super_admin';
    case 'admin':
    case 'Administrator':
      return 'admin';
    case 'department_head':
    case 'Department Head':
      return 'department_head';
    case 'team_lead':
    case 'Team Lead':
      return 'team_lead';
    case 'manager':
    case 'Manager':
      return 'manager';
    case 'staff':
    case 'Staff Member':
      return 'staff';
    case 'contractor':
    case 'Contractor':
      return 'contractor';
    case 'auditor':
    case 'Read-Only Auditor':
    case 'Auditor':
      return 'auditor';
    default:
      return null;
  }
}

export function isFullAdminRole(role: AdminRoleKey): boolean {
  return FULL_ADMIN_ROLES.includes(role);
}

export function isPrivilegedAdminRole(role: AdminRoleKey): boolean {
  return PRIVILEGED_ADMIN_ROLES.includes(role);
}

export function getAdminRoleLabel(role: AdminRoleKey): string {
  return ADMIN_ROLE_LABELS[role] || role;
}