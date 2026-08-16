export type SandboxStatus =
  | 'requested' | 'provisioning' | 'ready' | 'active' | 'paused'
  | 'resetting' | 'rebuilding' | 'ending' | 'ended' | 'expired' | 'failed';

export type SandboxHealthStatus = 'unknown' | 'healthy' | 'degraded' | 'unhealthy';

export interface CreateSandboxRequest {
  sandbox_instance_id: string;
  project_id: string;
  assignment_id: string;
  session_id: string;
  allowed_origins: string[];
  start_url: string;
  browser_type?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  expires_at: string;
  callback_url: string;
  locale?: string;
  timezone?: string;
  user_agent?: string;
  temporary_credentials?: TemporaryCredential[];
  storage_state_reference?: string;
  download_policy?: 'allow' | 'block';
  upload_policy?: 'allow' | 'block';
  blocked_domains?: string[];
  allowed_external_domains?: string[];
}

export interface TemporaryCredential {
  account_type: string;
  display_name: string;
  username?: string;
  email?: string;
  password?: string;
  credential_reference: string;
}

export interface SandboxCreateResult {
  success: boolean;
  sandbox_instance_id: string;
  worker_instance_id: string;
  status: string;
  health_status: string;
  error?: string;
}

export interface SandboxLaunchResult {
  success: boolean;
  sandbox_instance_id: string;
  status: string;
  health_status: string;
  current_url?: string;
  error?: string;
}

export interface SandboxActionResult {
  success: boolean;
  sandbox_instance_id: string;
  status: string;
  health_status?: string;
  error?: string;
  error_code?: string;
}

export interface SandboxHealthResult {
  success: boolean;
  sandbox_instance_id: string;
  status: string;
  health_status: string;
  worker_reachable: boolean;
  browser_context_present: boolean;
  page_open: boolean;
  current_origin: string | null;
  current_origin_allowed: boolean;
  last_activity: string;
  context_expiry: string;
  error?: string;
}

export interface CallbackPayload {
  sandbox_instance_id: string;
  event_type: CallbackEventType;
  status: string;
  health_status: string;
  worker_instance_id: string;
  safe_message?: string;
  timestamp: string;
}

export type CallbackEventType =
  | 'sandbox_ready'
  | 'sandbox_active'
  | 'sandbox_paused'
  | 'sandbox_resumed'
  | 'sandbox_resetting'
  | 'sandbox_reset_complete'
  | 'sandbox_degraded'
  | 'sandbox_unhealthy'
  | 'sandbox_destroyed'
  | 'sandbox_expired'
  | 'sandbox_failed';

export interface WorkerHealthResult {
  worker_instance_id: string;
  status: 'online' | 'degraded' | 'offline';
  playwright_version: string;
  active_sandbox_count: number;
  allowed_hosts_configured: boolean;
  last_health_check: string;
  uptime_seconds: number;
}

export const BLOCKED_NETWORK_PATTERNS = [
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254',
  'localhost',
  'metadata.google.internal',
];

export const BLOCKED_URL_SCHEMES = [
  'file:',
  'chrome:',
  'chrome-extension:',
  'chrome-devtools:',
  'devtools:',
];

export const DENIED_PERMISSIONS = [
  'camera', 'microphone', 'geolocation', 'notifications',
  'midi', 'bluetooth', 'serial', 'usb', 'clipboard-read',
  'background-sync', 'payment-handler',
];

export const WORKER_BLOCKED_PREFIXES = [
  '169.254.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
];