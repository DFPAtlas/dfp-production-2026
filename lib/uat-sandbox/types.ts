export const SANDBOX_MODES = [
  'shared_staging',
  'isolated_dataset',
  'isolated_browser',
  'disposable_environment',
] as const;
export type SandboxMode = typeof SANDBOX_MODES[number];

export const SANDBOX_MODE_CONFIG: Record<SandboxMode, { label: string; color: string; available: boolean }> = {
  shared_staging: { label: 'Shared Staging', color: '#06B6D4', available: true },
  isolated_dataset: { label: 'Isolated Dataset', color: '#8B5CF6', available: true },
  isolated_browser: { label: 'Isolated Browser', color: '#F59E0B', available: false },
  disposable_environment: { label: 'Disposable Environment', color: '#EF4444', available: false },
};

export const SANDBOX_STATUSES = [
  'requested', 'provisioning', 'ready', 'active', 'paused',
  'resetting', 'rebuilding', 'ending', 'ended', 'expired', 'failed',
] as const;
export type SandboxStatus = typeof SANDBOX_STATUSES[number];

export const SANDBOX_STATUS_CONFIG: Record<SandboxStatus, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: '#94A3B8', bg: 'bg-slate-500/10' },
  provisioning: { label: 'Preparing', color: '#3B82F6', bg: 'bg-blue-500/10' },
  ready: { label: 'Ready', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'bg-amber-500/10' },
  resetting: { label: 'Resetting', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  rebuilding: { label: 'Rebuilding', color: '#F97316', bg: 'bg-orange-500/10' },
  ending: { label: 'Ending', color: '#EF4444', bg: 'bg-red-500/10' },
  ended: { label: 'Ended', color: '#6B7280', bg: 'bg-gray-500/10' },
  expired: { label: 'Expired', color: '#6B7280', bg: 'bg-gray-500/10' },
  failed: { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' },
};

export const SANDBOX_HEALTH_STATUSES = ['unknown', 'healthy', 'degraded', 'unhealthy'] as const;
export type SandboxHealthStatus = typeof SANDBOX_HEALTH_STATUSES[number];

export const SANDBOX_HEALTH_CONFIG: Record<SandboxHealthStatus, { label: string; color: string }> = {
  unknown: { label: 'Unknown', color: '#94A3B8' },
  healthy: { label: 'Healthy', color: '#10B981' },
  degraded: { label: 'Degraded', color: '#F59E0B' },
  unhealthy: { label: 'Unhealthy', color: '#EF4444' },
};

export const SANDBOX_ACCOUNT_TYPES = ['tester', 'customer', 'admin_test', 'supplier_test', 'guard_test', 'other_test'] as const;
export type SandboxAccountType = typeof SANDBOX_ACCOUNT_TYPES[number];

export const SANDBOX_ACCOUNT_TYPE_CONFIG: Record<SandboxAccountType, { label: string }> = {
  tester: { label: 'Tester' },
  customer: { label: 'Customer' },
  admin_test: { label: 'Admin Test' },
  supplier_test: { label: 'Supplier Test' },
  guard_test: { label: 'Guard Test' },
  other_test: { label: 'Other Test' },
};

export const SANDBOX_ACCOUNT_STATUSES = ['pending', 'active', 'disabled', 'expired', 'failed'] as const;
export type SandboxAccountStatus = typeof SANDBOX_ACCOUNT_STATUSES[number];

export const SANDBOX_ACCOUNT_STATUS_CONFIG: Record<SandboxAccountStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#94A3B8', bg: 'bg-slate-500/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  disabled: { label: 'Disabled', color: '#6B7280', bg: 'bg-gray-500/10' },
  expired: { label: 'Expired', color: '#F59E0B', bg: 'bg-amber-500/10' },
  failed: { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' },
};

export const SANDBOX_ACTION_TYPES = [
  'provision', 'launch', 'pause', 'resume', 'reset_data',
  'rebuild', 'extend', 'end', 'expire', 'health_check',
] as const;
export type SandboxActionType = typeof SANDBOX_ACTION_TYPES[number];

export const SANDBOX_ACTION_TYPE_CONFIG: Record<SandboxActionType, { label: string; color: string }> = {
  provision: { label: 'Provision', color: '#3B82F6' },
  launch: { label: 'Launch', color: '#10B981' },
  pause: { label: 'Pause', color: '#F59E0B' },
  resume: { label: 'Resume', color: '#06B6D4' },
  reset_data: { label: 'Reset Data', color: '#8B5CF6' },
  rebuild: { label: 'Rebuild', color: '#F97316' },
  extend: { label: 'Extend', color: '#6366F1' },
  end: { label: 'End', color: '#EF4444' },
  expire: { label: 'Expire', color: '#6B7280' },
  health_check: { label: 'Health Check', color: '#10B981' },
};

export const SANDBOX_ACTION_STATUSES = ['requested', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type SandboxActionStatus = typeof SANDBOX_ACTION_STATUSES[number];

export const SANDBOX_ACTION_STATUS_CONFIG: Record<SandboxActionStatus, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: '#94A3B8', bg: 'bg-slate-500/10' },
  processing: { label: 'Processing', color: '#3B82F6', bg: 'bg-blue-500/10' },
  completed: { label: 'Completed', color: '#10B981', bg: 'bg-emerald-500/10' },
  failed: { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export interface SandboxSettings {
  id: string;
  project_id: string;
  environment_id: string | null;
  sandbox_enabled: boolean;
  sandbox_mode: SandboxMode;
  base_environment_url: string | null;
  allowed_origins: string[];
  allowed_external_domains: string[];
  blocked_domains: string[];
  temporary_account_enabled: boolean;
  seed_data_enabled: boolean;
  reset_enabled: boolean;
  rebuild_enabled: boolean;
  email_interception_enabled: boolean;
  sms_interception_enabled: boolean;
  payment_test_mode_required: boolean;
  external_webhooks_blocked: boolean;
  downloads_allowed: boolean;
  uploads_allowed: boolean;
  session_duration_minutes: number;
  maximum_extension_minutes: number;
  cleanup_after_session: boolean;
}

export interface SandboxInstance {
  id: string;
  project_id: string;
  environment_id: string | null;
  job_id: string | null;
  assignment_id: string;
  session_id: string | null;
  tester_id: string;
  sandbox_mode: SandboxMode;
  status: SandboxStatus;
  sandbox_url: string | null;
  launch_reference: string | null;
  started_at: string | null;
  ready_at: string | null;
  paused_at: string | null;
  expires_at: string;
  ended_at: string | null;
  last_health_at: string | null;
  health_status: SandboxHealthStatus;
  reset_count: number;
  rebuild_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  tester_name?: string;
  tester_email?: string;
  environment_name?: string;
}

export interface SandboxAccount {
  id: string;
  sandbox_instance_id: string;
  assignment_id: string;
  tester_id: string;
  account_type: SandboxAccountType;
  display_name: string;
  username: string | null;
  email: string | null;
  credential_reference: string | null;
  external_account_id: string | null;
  status: SandboxAccountStatus;
  created_at: string;
  expires_at: string;
  disabled_at: string | null;
}

export function formatTimeRemaining(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  const mins = Math.floor(remaining / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ${hrs % 24}h remaining`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m remaining`;
  return `${mins}m remaining`;
}