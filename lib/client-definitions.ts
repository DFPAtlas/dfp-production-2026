export const CLIENT_STATUSES = [
  'Prospect',
  'Onboarding',
  'Active',
  'At Risk',
  'Paused',
  'Offboarding',
  'Former Client',
  'Archived',
] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];

export const CLIENT_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Prospect': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: '#F59E0B' },
  'Onboarding': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: '#3B82F6' },
  'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: '#10B981' },
  'At Risk': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: '#EF4444' },
  'Paused': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: '#94A3B8' },
  'Offboarding': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: '#F97316' },
  'Former Client': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: '#8B5CF6' },
  'Archived': { bg: 'bg-white/5', text: 'text-slate-300', border: 'border-[rgba(255,255,255,0.08)]', dot: '#64748B' },
};

export const SERVICE_STATUSES = [
  'Planned',
  'Provisioning',
  'Active',
  'Degraded',
  'Paused',
  'Cancelling',
  'Cancelled',
  'Archived',
] as const;

export const SERVICE_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Planned': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: '#3B82F6' },
  'Provisioning': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: '#F59E0B' },
  'Active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: '#10B981' },
  'Degraded': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: '#EF4444' },
  'Paused': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: '#94A3B8' },
  'Cancelling': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: '#F97316' },
  'Cancelled': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: '#EF4444' },
  'Archived': { bg: 'bg-white/5', text: 'text-slate-300', border: 'border-[rgba(255,255,255,0.08)]', dot: '#64748B' },
};

export const HEALTH_STATUSES = ['Healthy', 'Watch', 'Attention Required', 'Critical', 'Not Enough Data'] as const;
export type HealthStatus = typeof HEALTH_STATUSES[number];

export const HEALTH_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Healthy': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: '#10B981' },
  'Watch': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: '#F59E0B' },
  'Attention Required': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: '#EF4444' },
  'Critical': { bg: 'bg-red-600/20', text: 'text-red-300', border: 'border-red-500/30', dot: '#DC2626' },
  'Not Enough Data': { bg: 'bg-white/5', text: 'text-slate-300', border: 'border-[rgba(255,255,255,0.08)]', dot: '#64748B' },
};

export const ONBOARDING_CHECKLIST = [
  { key: 'client_details', label: 'Client details confirmed', category: 'Administration' },
  { key: 'primary_contact', label: 'Primary contact designated', category: 'Contacts' },
  { key: 'billing_contact', label: 'Billing contact designated', category: 'Contacts' },
  { key: 'agreement_reference', label: 'Agreement or order reference', category: 'Administration' },
  { key: 'account_manager', label: 'Account manager assigned', category: 'Administration' },
  { key: 'project_setup', label: 'Project or service setup', category: 'Delivery' },
  { key: 'portal_invitation', label: 'Portal invitation sent', category: 'Access' },
  { key: 'billing_setup', label: 'Billing arrangement configured', category: 'Finance' },
  { key: 'support_route', label: 'Support route established', category: 'Support' },
  { key: 'data_access', label: 'Data or access requirements met', category: 'Delivery' },
  { key: 'security_classification', label: 'Security classification assigned', category: 'Security' },
  { key: 'kickoff_completed', label: 'Kickoff meeting completed', category: 'Delivery' },
] as const;

export const OFFBOARDING_CHECKLIST = [
  { key: 'active_projects', label: 'Active projects resolved or transferred', category: 'Delivery' },
  { key: 'open_tasks', label: 'Open tasks completed or reassigned', category: 'Delivery' },
  { key: 'outstanding_invoices', label: 'Outstanding invoices settled', category: 'Finance' },
  { key: 'service_cancellation', label: 'Services cancelled', category: 'Services' },
  { key: 'pbx_numbers', label: 'PBX numbers released or transferred', category: 'PBX' },
  { key: 'automations', label: 'Automations disabled', category: 'Automation' },
  { key: 'uat_records', label: 'UAT records archived', category: 'UAT' },
  { key: 'portal_access', label: 'Portal access revoked', category: 'Access' },
  { key: 'file_retention', label: 'File retention plan executed', category: 'Data' },
  { key: 'ownership_transfer', label: 'Ownership transferred where applicable', category: 'Administration' },
  { key: 'final_communication', label: 'Final communication sent', category: 'Administration' },
  { key: 'archive_readiness', label: 'Archive readiness confirmed', category: 'Administration' },
] as const;

export function calculateHealth(
  overdueTasks: number,
  openCriticalIssues: number,
  projectsDelayed: number,
  unpaidInvoices: number,
  serviceIncidents: number,
  missedReviews: number,
  recentEscalation: boolean,
  daysSinceActivity: number
): { status: HealthStatus; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  if (overdueTasks > 5) { score += 3; factors.push(`${overdueTasks} overdue tasks`); }
  else if (overdueTasks > 0) { score += 1; factors.push(`${overdueTasks} overdue tasks`); }

  if (openCriticalIssues > 0) { score += 3; factors.push(`${openCriticalIssues} critical support issues`); }

  if (projectsDelayed > 2) { score += 3; factors.push(`${projectsDelayed} delayed projects`); }
  else if (projectsDelayed > 0) { score += 1; factors.push(`${projectsDelayed} delayed projects`); }

  if (unpaidInvoices > 2) { score += 3; factors.push(`${unpaidInvoices} unpaid invoices`); }
  else if (unpaidInvoices > 0) { score += 1; factors.push(`${unpaidInvoices} unpaid invoices`); }

  if (serviceIncidents > 0) { score += 2; factors.push(`${serviceIncidents} service incidents`); }

  if (missedReviews > 1) { score += 2; factors.push(`${missedReviews} missed reviews`); }

  if (recentEscalation) { score += 2; factors.push('Recent complaint or escalation'); }

  if (daysSinceActivity > 60) { score += 1; factors.push('No recent account activity'); }

  if (factors.length === 0) return { status: 'Not Enough Data', factors: ['No health factors detected'] };

  if (score >= 8) return { status: 'Critical', factors };
  if (score >= 5) return { status: 'Attention Required', factors };
  if (score >= 2) return { status: 'Watch', factors };
  return { status: 'Healthy', factors };
}

export const CLIENT_DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'] as const;
export const CLIENT_TYPES = ['business', 'individual', 'government', 'nonprofit', 'partner'] as const;
export const ONBOARDING_STATES = ['not_started', 'in_progress', 'completed'] as const;
export const PORTAL_ACCESS_STATES = ['none', 'invited', 'active', 'revoked'] as const;