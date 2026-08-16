export type PBXTenantCommercialStatus =
  | 'draft' | 'provisioning' | 'testing' | 'active'
  | 'suspended' | 'offboarding' | 'former_client' | 'archived';

export type PBXTenantConnectionStatus =
  | 'connected' | 'partially_connected' | 'authentication_failed'
  | 'configuration_required' | 'unavailable' | 'not_configured' | 'unknown';

export type PBXTenantHealthStatus =
  | 'healthy' | 'degraded' | 'failing' | 'unknown' | 'no_data';

export type PBXNumberStatus =
  | 'available' | 'reserved' | 'assigned' | 'porting_in'
  | 'porting_out' | 'suspended' | 'released' | 'error' | 'archived';

export type PBXRoutingStatus = 'draft' | 'test' | 'review' | 'active' | 'rollback';
export type PBXCallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed'
  | 'busy' | 'no_answer' | 'failed' | 'cancelled' | 'unknown';

export type PBXMessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered' | 'received';
export type PBXWebhookEventType = 'voice_call' | 'call_status' | 'recording' | 'voicemail' | 'message' | 'account';
export type PBXSyncType = 'accounts' | 'numbers' | 'calls' | 'recordings' | 'messages' | 'configuration' | 'costs';

export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', provisioning: 'Provisioning', testing: 'Testing',
  active: 'Active', suspended: 'Suspended', offboarding: 'Offboarding',
  former_client: 'Former Client', archived: 'Archived',
};

export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  connected: 'Connected', partially_connected: 'Partially Connected',
  authentication_failed: 'Auth Failed', configuration_required: 'Config Required',
  unavailable: 'Unavailable', not_configured: 'Not Configured', unknown: 'Unknown',
};

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  healthy: 'Healthy', degraded: 'Degraded', failing: 'Failing',
  unknown: 'Unknown', no_data: 'No Data',
};

export const CALL_STATUS_LABELS: Record<string, string> = {
  queued: 'Queued', ringing: 'Ringing', in_progress: 'In Progress',
  completed: 'Completed', busy: 'Busy', no_answer: 'No Answer',
  failed: 'Failed', cancelled: 'Cancelled', unknown: 'Unknown',
};

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  queued: 'Queued', sent: 'Sent', delivered: 'Delivered',
  failed: 'Failed', undelivered: 'Undelivered', received: 'Received',
};

export const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', draft: '#64748B', suspended: '#F97316',
  archived: '#6B7280', provisioning: '#06B6D4', testing: '#F59E0B',
  offboarding: '#EF4444', former_client: '#6B7280',
  connected: '#10B981', partially_connected: '#F59E0B',
  authentication_failed: '#EF4444', configuration_required: '#F97316',
  unavailable: '#EF4444', not_configured: '#6B7280', unknown: '#6B7280',
  healthy: '#10B981', degraded: '#F59E0B', failing: '#EF4444', no_data: '#6B7280',
  available: '#6B7280', reserved: '#06B6D4', assigned: '#10B981',
  porting_in: '#F59E0B', porting_out: '#F97316', released: '#6B7280', error: '#EF4444',
  completed: '#10B981', answered: '#10B981', missed: '#EF4444',
  voicemail: '#F59E0B', busy: '#F97316', failed: '#EF4444',
  ringing: '#06B6D4', in_progress: '#8B5CF6', queued: '#6B7280',
  cancelled: '#6B7280', no_answer: '#EF4444',
  sent: '#06B6D4', delivered: '#10B981', received: '#8B5CF6', undelivered: '#F97316',
  online: '#10B981', offline: '#EF4444', warning: '#F97316',
};

export function generateTenantRef(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
  return `DFP-PBX-${year}-${rand}`;
}