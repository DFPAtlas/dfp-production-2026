export type IdentityType = 'internal' | 'contractor' | 'freelancer' | 'tester' | 'client' | 'supplier' | 'service_account' | 'ai_agent';

export type StaffStatus = 'Invited' | 'Invitation Expired' | 'Pending Activation' | 'Active' | 'Temporarily Restricted' | 'Suspended' | 'Offboarding' | 'Former Staff' | 'Archived';

export type GlobalRole = 'Owner' | 'Super Administrator' | 'Administrator' | 'Department Head' | 'Team Lead' | 'Manager' | 'Staff Member' | 'Contractor' | 'Read-Only Auditor';

export const GlobalRoleToCanonical: Record<string, string> = {
  'Owner': 'owner',
  'Super Administrator': 'super_admin',
  'Administrator': 'admin',
  'Department Head': 'department_head',
  'Team Lead': 'team_lead',
  'Manager': 'manager',
  'Staff Member': 'staff',
  'Contractor': 'contractor',
  'Read-Only Auditor': 'auditor',
};

export const CanonicalToGlobalRole: Record<string, GlobalRole> = {
  'owner': 'Owner',
  'super_admin': 'Super Administrator',
  'admin': 'Administrator',
  'department_head': 'Department Head',
  'team_lead': 'Team Lead',
  'manager': 'Manager',
  'staff': 'Staff Member',
  'contractor': 'Contractor',
  'auditor': 'Read-Only Auditor',
};

export type PermissionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ReviewDecision = 'Retain' | 'Modify' | 'Revoke' | 'Investigate';

export type MfaState = 'Not Enrolled' | 'Enrolled' | 'Verification Required' | 'Recovery Required' | 'Unknown';

export interface PermissionDef {
  key: string;
  module: string;
  description: string;
  riskLevel: PermissionRiskLevel;
  approvalRequired: boolean;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  { key: 'dashboard.view', module: 'Dashboard', description: 'View admin dashboard', riskLevel: 'low', approvalRequired: false },
  { key: 'dashboard.manage', module: 'Dashboard', description: 'Manage dashboard configuration', riskLevel: 'medium', approvalRequired: false },
  { key: 'leads.view', module: 'CRM', description: 'View leads', riskLevel: 'low', approvalRequired: false },
  { key: 'leads.create', module: 'CRM', description: 'Create leads', riskLevel: 'low', approvalRequired: false },
  { key: 'leads.edit', module: 'CRM', description: 'Edit leads', riskLevel: 'medium', approvalRequired: false },
  { key: 'leads.delete', module: 'CRM', description: 'Delete leads', riskLevel: 'high', approvalRequired: true },
  { key: 'leads.assign', module: 'CRM', description: 'Assign leads', riskLevel: 'medium', approvalRequired: false },
  { key: 'leads.convert', module: 'CRM', description: 'Convert leads to clients', riskLevel: 'medium', approvalRequired: false },
  { key: 'clients.view', module: 'CRM', description: 'View clients', riskLevel: 'low', approvalRequired: false },
  { key: 'clients.create', module: 'CRM', description: 'Create clients', riskLevel: 'low', approvalRequired: false },
  { key: 'clients.edit', module: 'CRM', description: 'Edit clients', riskLevel: 'medium', approvalRequired: false },
  { key: 'clients.archive', module: 'CRM', description: 'Archive clients', riskLevel: 'high', approvalRequired: true },
  { key: 'clients.portal_grant', module: 'CRM', description: 'Grant portal access', riskLevel: 'high', approvalRequired: true },
  { key: 'projects.view', module: 'Projects', description: 'View projects', riskLevel: 'low', approvalRequired: false },
  { key: 'projects.create', module: 'Projects', description: 'Create projects', riskLevel: 'medium', approvalRequired: false },
  { key: 'projects.edit', module: 'Projects', description: 'Edit projects', riskLevel: 'medium', approvalRequired: false },
  { key: 'projects.archive', module: 'Projects', description: 'Archive projects', riskLevel: 'high', approvalRequired: true },
  { key: 'projects.team_manage', module: 'Projects', description: 'Manage project teams', riskLevel: 'medium', approvalRequired: false },
  { key: 'tasks.view', module: 'Tasks', description: 'View tasks', riskLevel: 'low', approvalRequired: false },
  { key: 'tasks.create', module: 'Tasks', description: 'Create tasks', riskLevel: 'low', approvalRequired: false },
  { key: 'tasks.edit', module: 'Tasks', description: 'Edit tasks', riskLevel: 'low', approvalRequired: false },
  { key: 'tasks.assign', module: 'Tasks', description: 'Assign tasks', riskLevel: 'low', approvalRequired: false },
  { key: 'tasks.delete', module: 'Tasks', description: 'Delete tasks', riskLevel: 'high', approvalRequired: true },
  { key: 'finance.view', module: 'Finance', description: 'View finances', riskLevel: 'medium', approvalRequired: false },
  { key: 'finance.create_invoice', module: 'Finance', description: 'Create invoices', riskLevel: 'medium', approvalRequired: false },
  { key: 'finance.edit_invoice', module: 'Finance', description: 'Edit invoices', riskLevel: 'medium', approvalRequired: false },
  { key: 'finance.approve', module: 'Finance', description: 'Approve invoices and payments', riskLevel: 'high', approvalRequired: true },
  { key: 'finance.pay', module: 'Finance', description: 'Record payments', riskLevel: 'high', approvalRequired: true },
  { key: 'finance.refund', module: 'Finance', description: 'Issue refunds', riskLevel: 'critical', approvalRequired: true },
  { key: 'finance.export', module: 'Finance', description: 'Export financial data', riskLevel: 'high', approvalRequired: false },
  { key: 'automation.view', module: 'Automation', description: 'View automations', riskLevel: 'low', approvalRequired: false },
  { key: 'automation.edit', module: 'Automation', description: 'Edit automations', riskLevel: 'medium', approvalRequired: false },
  { key: 'automation.activate', module: 'Automation', description: 'Activate/deactivate automations', riskLevel: 'high', approvalRequired: true },
  { key: 'automation.manage_agents', module: 'Automation', description: 'Manage AI agents', riskLevel: 'critical', approvalRequired: true },
  { key: 'automation.approve', module: 'Automation', description: 'Approve automation actions', riskLevel: 'high', approvalRequired: true },
  { key: 'uat.view', module: 'UAT', description: 'View UAT projects', riskLevel: 'low', approvalRequired: false },
  { key: 'uat.create_project', module: 'UAT', description: 'Create UAT projects', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.manage_project', module: 'UAT', description: 'Manage UAT projects', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.create_jobs', module: 'UAT', description: 'Create test jobs', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.review_applications', module: 'UAT', description: 'Review tester applications', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.assign_testers', module: 'UAT', description: 'Assign testers', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.triage_feedback', module: 'UAT', description: 'Triage feedback', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.manage_environments', module: 'UAT', description: 'Manage test environments', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.manage_plans', module: 'UAT', description: 'Manage test plans', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.manage_retests', module: 'UAT', description: 'Manage retests', riskLevel: 'medium', approvalRequired: false },
  { key: 'uat.approve', module: 'UAT', description: 'Approve UAT outcomes', riskLevel: 'high', approvalRequired: true },
  { key: 'uat.view_restricted_evidence', module: 'UAT', description: 'View restricted evidence', riskLevel: 'high', approvalRequired: true },
  { key: 'uat.archive', module: 'UAT', description: 'Archive UAT records', riskLevel: 'high', approvalRequired: true },
  { key: 'uat.payment_approve', module: 'UAT', description: 'Approve tester payments', riskLevel: 'high', approvalRequired: true },
  { key: 'pbx.view', module: 'PBX', description: 'View PBX system', riskLevel: 'low', approvalRequired: false },
  { key: 'pbx.manage_routing', module: 'PBX', description: 'Manage call routing', riskLevel: 'high', approvalRequired: true },
  { key: 'pbx.manage_numbers', module: 'PBX', description: 'Manage phone numbers', riskLevel: 'high', approvalRequired: true },
  { key: 'pbx.manage_tenants', module: 'PBX', description: 'Manage tenants', riskLevel: 'high', approvalRequired: true },
  { key: 'pbx.manage_billing', module: 'PBX', description: 'Manage PBX billing', riskLevel: 'high', approvalRequired: true },
  { key: 'pbx.manage_ai_tokens', module: 'PBX', description: 'Manage AI tokens', riskLevel: 'critical', approvalRequired: true },
  { key: 'cms.view', module: 'CMS', description: 'View CMS', riskLevel: 'low', approvalRequired: false },
  { key: 'cms.create', module: 'CMS', description: 'Create content', riskLevel: 'low', approvalRequired: false },
  { key: 'cms.edit', module: 'CMS', description: 'Edit content', riskLevel: 'low', approvalRequired: false },
  { key: 'cms.review', module: 'CMS', description: 'Review content', riskLevel: 'medium', approvalRequired: false },
  { key: 'cms.approve', module: 'CMS', description: 'Approve content', riskLevel: 'medium', approvalRequired: false },
  { key: 'cms.publish', module: 'CMS', description: 'Publish content', riskLevel: 'high', approvalRequired: true },
  { key: 'cms.unpublish', module: 'CMS', description: 'Unpublish content', riskLevel: 'high', approvalRequired: true },
  { key: 'cms.rollback', module: 'CMS', description: 'Rollback content', riskLevel: 'high', approvalRequired: true },
  { key: 'cms.manage_navigation', module: 'CMS', description: 'Manage navigation', riskLevel: 'medium', approvalRequired: false },
  { key: 'cms.manage_media', module: 'CMS', description: 'Manage media library', riskLevel: 'low', approvalRequired: false },
  { key: 'cms.manage_redirects', module: 'CMS', description: 'Manage redirects', riskLevel: 'medium', approvalRequired: false },
  { key: 'cms.manage_legal', module: 'CMS', description: 'Manage legal content', riskLevel: 'high', approvalRequired: true },
  { key: 'cms.archive', module: 'CMS', description: 'Archive content', riskLevel: 'high', approvalRequired: true },
  { key: 'staff.view', module: 'Staff', description: 'View staff directory', riskLevel: 'low', approvalRequired: false },
  { key: 'staff.invite', module: 'Staff', description: 'Invite staff', riskLevel: 'medium', approvalRequired: false },
  { key: 'staff.edit', module: 'Staff', description: 'Edit staff profiles', riskLevel: 'medium', approvalRequired: false },
  { key: 'staff.suspend', module: 'Staff', description: 'Suspend staff accounts', riskLevel: 'critical', approvalRequired: true },
  { key: 'staff.offboard', module: 'Staff', description: 'Offboard staff', riskLevel: 'critical', approvalRequired: true },
  { key: 'staff.manage_teams', module: 'Staff', description: 'Manage teams and departments', riskLevel: 'medium', approvalRequired: false },
  { key: 'staff.manage_roles', module: 'Staff', description: 'Manage roles and permissions', riskLevel: 'critical', approvalRequired: true },
  { key: 'staff.manage_permissions', module: 'Staff', description: 'Manage permission sets', riskLevel: 'critical', approvalRequired: true },
  { key: 'staff.review_access', module: 'Staff', description: 'Conduct access reviews', riskLevel: 'high', approvalRequired: true },
  { key: 'staff.manage_service_accounts', module: 'Staff', description: 'Manage service accounts', riskLevel: 'critical', approvalRequired: true },
  { key: 'audit.view', module: 'Audit', description: 'View audit logs', riskLevel: 'medium', approvalRequired: false },
  { key: 'audit.export', module: 'Audit', description: 'Export audit logs', riskLevel: 'high', approvalRequired: false },
  { key: 'security.view_events', module: 'Security', description: 'View security events', riskLevel: 'high', approvalRequired: false },
  { key: 'security.manage_sessions', module: 'Security', description: 'Manage sessions', riskLevel: 'critical', approvalRequired: true },
  { key: 'command_centre.view', module: 'Command Centre', description: 'View Command Centre', riskLevel: 'medium', approvalRequired: false },
  { key: 'command_centre.manage_alerts', module: 'Command Centre', description: 'Manage alerts', riskLevel: 'high', approvalRequired: false },
  { key: 'command_centre.deploy', module: 'Command Centre', description: 'Manage deployments', riskLevel: 'critical', approvalRequired: true },
  { key: 'command_centre.manage_incidents', module: 'Command Centre', description: 'Manage incidents', riskLevel: 'critical', approvalRequired: true },
  { key: 'submissions.view', module: 'Submissions', description: 'View submissions', riskLevel: 'low', approvalRequired: false },
  { key: 'submissions.manage', module: 'Submissions', description: 'Manage submissions', riskLevel: 'medium', approvalRequired: false },
  { key: 'notifications.manage', module: 'Notifications', description: 'Manage notification settings', riskLevel: 'medium', approvalRequired: false },
  { key: 'diagnostics.view', module: 'Diagnostics', description: 'View diagnostics', riskLevel: 'medium', approvalRequired: false },
  { key: 'milestones.view', module: 'Milestones', description: 'View milestones', riskLevel: 'low', approvalRequired: false },
  { key: 'milestones.create', module: 'Milestones', description: 'Create milestones', riskLevel: 'medium', approvalRequired: false },
  { key: 'milestones.edit', module: 'Milestones', description: 'Edit milestones', riskLevel: 'medium', approvalRequired: false },
  { key: 'email_templates.view', module: 'Email', description: 'View email templates', riskLevel: 'low', approvalRequired: false },
  { key: 'email_templates.edit', module: 'Email', description: 'Edit email templates', riskLevel: 'medium', approvalRequired: false },
];

export const GLOBAL_ROLES: Record<GlobalRole, { label: string; description: string; isPrivileged: boolean; inheritedPermissions: string[] }> = {
  'Owner': {
    label: 'Owner',
    description: 'Full unrestricted access to all modules and settings',
    isPrivileged: true,
    inheritedPermissions: ['*'],
  },
  'Super Administrator': {
    label: 'Super Administrator',
    description: 'Near-full access with some safeguards on destructive actions',
    isPrivileged: true,
    inheritedPermissions: ALL_PERMISSIONS.map(p => p.key),
  },
  'Administrator': {
    label: 'Administrator',
    description: 'Full operational access excluding critical system changes',
    isPrivileged: true,
    inheritedPermissions: ALL_PERMISSIONS.filter(p => p.riskLevel !== 'critical').map(p => p.key),
  },
  'Department Head': {
    label: 'Department Head',
    description: 'Department-level management with broader scope',
    isPrivileged: false,
    inheritedPermissions: [],
  },
  'Team Lead': {
    label: 'Team Lead',
    description: 'Team-level leadership with defined scope',
    isPrivileged: false,
    inheritedPermissions: [],
  },
  'Manager': {
    label: 'Manager',
    description: 'Management access with defined boundaries',
    isPrivileged: false,
    inheritedPermissions: [],
  },
  'Staff Member': {
    label: 'Staff Member',
    description: 'Standard operational access',
    isPrivileged: false,
    inheritedPermissions: [],
  },
  'Contractor': {
    label: 'Contractor',
    description: 'Limited access based on contract scope',
    isPrivileged: false,
    inheritedPermissions: [],
  },
  'Read-Only Auditor': {
    label: 'Read-Only Auditor',
    description: 'View-only access across permitted modules',
    isPrivileged: false,
    inheritedPermissions: [],
  },
};

export const IDENTITY_TYPES: Record<IdentityType, { label: string; isHuman: boolean }> = {
  'internal': { label: 'Internal Staff', isHuman: true },
  'contractor': { label: 'Contractor', isHuman: true },
  'freelancer': { label: 'Freelancer', isHuman: true },
  'tester': { label: 'UAT Tester', isHuman: true },
  'client': { label: 'Client', isHuman: true },
  'supplier': { label: 'Supplier', isHuman: true },
  'service_account': { label: 'Service Account', isHuman: false },
  'ai_agent': { label: 'AI Agent', isHuman: false },
};

export const STAFF_STATUS_CONFIG: Record<StaffStatus, { color: string; bg: string }> = {
  'Invited': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Invitation Expired': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Pending Activation': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'Active': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Temporarily Restricted': { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'Suspended': { color: 'text-red-400', bg: 'bg-red-500/10' },
  'Offboarding': { color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'Former Staff': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Archived': { color: 'text-slate-500', bg: 'bg-slate-500/5' },
};

export const INVITATION_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Draft': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Sent': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Accepted': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Expired': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'Revoked': { color: 'text-red-400', bg: 'bg-red-500/10' },
  'Failed': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const TEMP_ACCESS_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Requested': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Approved': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Active': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Expired': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Revoked': { color: 'text-red-400', bg: 'bg-red-500/10' },
  'Rejected': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const ACCESS_REQUEST_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Requested': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Under Review': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'Approved': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Rejected': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const REVIEW_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Pending': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'In Progress': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'Completed': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Overdue': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const DELEGATION_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Active': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Expired': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Revoked': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const SERVICE_ACCOUNT_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Active': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Inactive': { color: 'text-slate-400', bg: 'bg-slate-500/10' },
  'Rotation Due': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'Revoked': { color: 'text-red-400', bg: 'bg-red-500/10' },
};

export const MFA_STATE_CONFIG: Record<MfaState, { color: string; bg: string; label: string }> = {
  'Not Enrolled': { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Not Enrolled' },
  'Enrolled': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Enrolled' },
  'Verification Required': { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Verification Required' },
  'Recovery Required': { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Recovery Required' },
  'Unknown': { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Unknown' },
};

export const OFFBOARDING_CHECKLIST_ITEMS = [
  { key: 'check_auth_disabled', label: 'Authentication disabled' },
  { key: 'check_sessions_revoked', label: 'Active sessions revoked' },
  { key: 'check_temp_access_revoked', label: 'Temporary access revoked' },
  { key: 'check_teams_removed', label: 'Team memberships removed' },
  { key: 'check_ownership_transferred', label: 'Project/client ownership transferred' },
  { key: 'check_tasks_reassigned', label: 'Open tasks reassigned' },
  { key: 'check_approvals_reassigned', label: 'Pending approvals reassigned' },
  { key: 'check_pbx_disabled', label: 'PBX/provider access disabled' },
  { key: 'check_files_reviewed', label: 'Shared files reviewed' },
  { key: 'check_audit_preserved', label: 'Audit history preserved' },
];

export const APPROVAL_AUTHORITY_TYPES = [
  'invoice_approval',
  'expense_approval',
  'uat_payment_approval',
  'content_publication',
  'uat_approval',
  'production_deployment',
  'pbx_routing_activation',
  'automation_activation',
  'incident_closure',
  'role_permission_change',
] as const;

export function generateStaffReference(seq: number): string {
  return `DFP-STAFF-2026-${String(seq).padStart(6, '0')}`;
}

export function getPermissionByKey(key: string): PermissionDef | undefined {
  return ALL_PERMISSIONS.find(p => p.key === key);
}

export function getPermissionsByModule(module: string): PermissionDef[] {
  return ALL_PERMISSIONS.filter(p => p.module === module);
}

export function getPermissionsByRisk(riskLevel: PermissionRiskLevel): PermissionDef[] {
  return ALL_PERMISSIONS.filter(p => p.riskLevel === riskLevel);
}