export const WORKFLOW_EDITORIAL_STATUSES = ['draft', 'testing', 'ready_for_review', 'approved'] as const;
export type WorkflowEditorialStatus = typeof WORKFLOW_EDITORIAL_STATUSES[number];

export const WORKFLOW_OPERATIONAL_STATUSES = ['active', 'paused', 'disabled', 'maintenance', 'archived'] as const;
export type WorkflowOperationalStatus = typeof WORKFLOW_OPERATIONAL_STATUSES[number];

export const WORKFLOW_HEALTH_STATUSES = ['healthy', 'degraded', 'failing', 'unknown', 'no_data'] as const;
export type WorkflowHealthStatus = typeof WORKFLOW_HEALTH_STATUSES[number];

export const WORKFLOW_ENVIRONMENTS = ['development', 'testing', 'staging', 'uat', 'production'] as const;
export type WorkflowEnvironment = typeof WORKFLOW_ENVIRONMENTS[number];

export const WORKFLOW_TYPES = ['standard', 'webhook', 'scheduled', 'ai_agent', 'data_sync', 'notification', 'approval', 'cleanup', 'reporting', 'integration'] as const;
export type WorkflowType = typeof WORKFLOW_TYPES[number];

export const WORKFLOW_CRITICALITIES = ['low', 'medium', 'high', 'critical'] as const;
export type WorkflowCriticality = typeof WORKFLOW_CRITICALITIES[number];

export const EXECUTION_STATUSES = ['queued', 'running', 'successful', 'failed', 'cancelled', 'timed_out', 'waiting_approval', 'retrying', 'unknown'] as const;
export type ExecutionStatus = typeof EXECUTION_STATUSES[number];

export const AGENT_STATUSES = ['draft', 'testing', 'awaiting_approval', 'approved', 'active', 'paused', 'limited', 'failing', 'disabled', 'archived'] as const;
export type AgentStatus = typeof AGENT_STATUSES[number];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'expired', 'cancelled', 'executed', 'execution_failed'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const PROMPT_STATUSES = ['draft', 'testing', 'approved', 'deprecated'] as const;
export type PromptStatus = typeof PROMPT_STATUSES[number];

export const LIMIT_STATES = ['normal', 'warning', 'approaching_limit', 'limit_reached', 'suspended', 'not_configured'] as const;
export type LimitState = typeof LIMIT_STATES[number];

export const WEBHOOK_AUTH_TYPES = ['none', 'header_token', 'signature', 'basic_auth', 'oauth2'] as const;

export const DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'] as const;

export const SCHEDULE_MISSED_STATES = ['none', 'missed', 'alerted', 'resolved'] as const;

export const EDITORIAL_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: '#94A3B8', bg: 'bg-slate-500/10', label: 'Draft' },
  testing: { color: '#8B5CF6', bg: 'bg-purple-500/10', label: 'Testing' },
  ready_for_review: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Ready for Review' },
  approved: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Approved' },
};

export const OPERATIONAL_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Active' },
  paused: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Paused' },
  disabled: { color: '#64748B', bg: 'bg-slate-500/10', label: 'Disabled' },
  maintenance: { color: '#3B82F6', bg: 'bg-blue-500/10', label: 'Maintenance' },
  archived: { color: '#94A3B8', bg: 'bg-slate-500/10', label: 'Archived' },
};

export const HEALTH_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  healthy: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Healthy' },
  degraded: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Degraded' },
  failing: { color: '#EF4444', bg: 'bg-red-500/10', label: 'Failing' },
  unknown: { color: '#64748B', bg: 'bg-slate-500/10', label: 'Unknown' },
  no_data: { color: '#94A3B8', bg: 'bg-slate-500/10', label: 'No Data' },
};

export const AGENT_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: '#94A3B8', bg: 'bg-slate-500/10', label: 'Draft' },
  testing: { color: '#8B5CF6', bg: 'bg-purple-500/10', label: 'Testing' },
  awaiting_approval: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Awaiting Approval' },
  approved: { color: '#3B82F6', bg: 'bg-blue-500/10', label: 'Approved' },
  active: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Active' },
  paused: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Paused' },
  limited: { color: '#F97316', bg: 'bg-orange-500/10', label: 'Limited' },
  failing: { color: '#EF4444', bg: 'bg-red-500/10', label: 'Failing' },
  disabled: { color: '#64748B', bg: 'bg-slate-500/10', label: 'Disabled' },
  archived: { color: '#94A3B8', bg: 'bg-slate-500/10', label: 'Archived' },
};

export const ENVIRONMENT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  development: { color: '#8B5CF6', bg: 'bg-purple-500/10', label: 'Dev' },
  testing: { color: '#06B6D4', bg: 'bg-cyan-500/10', label: 'Test' },
  staging: { color: '#F59E0B', bg: 'bg-amber-500/10', label: 'Staging' },
  uat: { color: '#F97316', bg: 'bg-orange-500/10', label: 'UAT' },
  production: { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Production' },
};

export const APPROVAL_TYPES = [
  'workflow_activation',
  'workflow_retry',
  'agent_activation',
  'agent_tool_change',
  'external_message',
  'invoice_action',
  'payment_action',
  'deletion',
  'publishing',
  'permission_change',
  'production_deployment',
  'pbx_change',
  'sensitive_export',
  'emergency_lockdown',
] as const;