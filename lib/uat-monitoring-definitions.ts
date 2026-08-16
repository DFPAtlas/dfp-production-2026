export const UAT_MONITORING_EVENT_TYPES = [
  'session_started', 'session_resumed', 'session_paused', 'session_finished',
  'heartbeat', 'page_view', 'route_change', 'page_hidden', 'page_visible',
  'javascript_error', 'unhandled_rejection', 'api_failure', 'api_slow',
  'performance', 'tester_checkpoint', 'monitoring_started', 'monitoring_stopped',
] as const;
export type UatMonitoringEventType = typeof UAT_MONITORING_EVENT_TYPES[number];

export const UAT_MONITORING_EVENT_CONFIG: Record<UatMonitoringEventType, { label: string; color: string; icon: string }> = {
  session_started: { label: 'Session Started', color: '#10B981', icon: 'ri-play-circle-line' },
  session_resumed: { label: 'Session Resumed', color: '#10B981', icon: 'ri-play-circle-line' },
  session_paused: { label: 'Session Paused', color: '#F59E0B', icon: 'ri-pause-circle-line' },
  session_finished: { label: 'Session Finished', color: '#3B82F6', icon: 'ri-checkbox-circle-line' },
  heartbeat: { label: 'Heartbeat', color: '#94A3B8', icon: 'ri-heart-pulse-line' },
  page_view: { label: 'Page View', color: '#6366F1', icon: 'ri-eye-line' },
  route_change: { label: 'Route Change', color: '#6366F1', icon: 'ri-arrow-right-line' },
  page_hidden: { label: 'Page Hidden', color: '#94A3B8', icon: 'ri-eye-off-line' },
  page_visible: { label: 'Page Visible', color: '#94A3B8', icon: 'ri-eye-line' },
  javascript_error: { label: 'JS Error', color: '#EF4444', icon: 'ri-error-warning-line' },
  unhandled_rejection: { label: 'Unhandled Rejection', color: '#EF4444', icon: 'ri-error-warning-line' },
  api_failure: { label: 'API Failure', color: '#F97316', icon: 'ri-close-circle-line' },
  api_slow: { label: 'API Slow', color: '#F59E0B', icon: 'ri-timer-line' },
  performance: { label: 'Performance', color: '#8B5CF6', icon: 'ri-speed-line' },
  tester_checkpoint: { label: 'Checkpoint', color: '#06B6D4', icon: 'ri-flag-line' },
  monitoring_started: { label: 'Monitoring Started', color: '#10B981', icon: 'ri-radar-line' },
  monitoring_stopped: { label: 'Monitoring Stopped', color: '#EF4444', icon: 'ri-radar-line' },
};

export const NOTICE_VERSION = 'v1.0.0';

export const MONITORING_CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Pages visited inside the assigned test website',
  visibility: 'Session start, pause and finish times',
  console_errors: 'Browser errors',
  failed_requests: 'Failed or slow website requests',
  performance: 'Basic performance information',
  checkpoints: 'Tester-created checkpoints',
};

export const MONITORING_PRIVACY_NOTICE = {
  recorded: [
    'Pages visited inside the assigned test website',
    'Session start, pause and finish times',
    'Browser errors',
    'Failed or slow website requests',
    'Basic performance information',
    'Tester-created checkpoints',
  ],
  notRecorded: [
    'Passwords',
    'Form field values',
    'Keystrokes',
    'Clipboard contents',
    'Webcam',
    'Microphone',
    'Other browser tabs',
    'Desktop applications',
    'Personal files',
    'Precise location',
  ],
};

export interface MonitoringTokenResponse {
  success: boolean;
  token?: string;
  token_id?: string;
  expires_at?: string;
  settings?: MonitoringSettings;
  message?: string;
}

export interface MonitoringSettings {
  capture_navigation: boolean;
  capture_visibility: boolean;
  capture_console_errors: boolean;
  capture_unhandled_rejections: boolean;
  capture_failed_requests: boolean;
  capture_slow_requests: boolean;
  capture_performance: boolean;
  slow_request_threshold_ms: number;
}

export interface SessionEventPayload {
  event_type: UatMonitoringEventType;
  event_timestamp?: string;
  page_url?: string;
  page_path?: string;
  page_title?: string;
  event_name?: string;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message?: string;
  source_file?: string;
  source_line?: number;
  source_column?: number;
  request_method?: string;
  request_path?: string;
  response_status?: number;
  duration_ms?: number;
  performance_data?: Record<string, unknown>;
  safe_metadata?: Record<string, unknown>;
  assignment_test_case_id?: string;
}

export interface EventIngestionResponse {
  success: boolean;
  accepted: number;
  rejected: number;
  errors?: string[];
  message?: string;
}