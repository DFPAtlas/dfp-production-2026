export type ReproductionRunStatus =
  | 'requested' | 'queued' | 'preparing' | 'running'
  | 'completed' | 'failed' | 'cancelled' | 'expired';

export type ReproductionExecutionMode =
  | 'existing_sandbox' | 'fresh_sandbox' | 'validation_context';

export type ReproductionActionType =
  | 'navigate' | 'click' | 'fill' | 'select' | 'check' | 'uncheck'
  | 'upload_test_file' | 'wait_for' | 'assert_visible' | 'assert_text'
  | 'assert_url' | 'custom_checkpoint';

export type ReproductionStepStatus =
  | 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'blocked';

export type ReproductionEventType =
  | 'console_error' | 'page_error' | 'request_failed'
  | 'response_error' | 'navigation' | 'assertion_failed'
  | 'screenshot_captured' | 'trace_started' | 'trace_completed'
  | 'worker_warning';

export const SUPPORTED_ACTION_TYPES: ReproductionActionType[] = [
  'navigate', 'click', 'fill', 'select', 'check', 'uncheck',
  'upload_test_file', 'wait_for', 'assert_visible', 'assert_text',
  'assert_url', 'custom_checkpoint',
];

export const REPRODUCTION_RUN_STATUS_CONFIG: Record<ReproductionRunStatus, { label: string; color: string }> = {
  requested: { label: 'Requested', color: '#94A3B8' },
  queued: { label: 'Queued', color: '#3B82F6' },
  preparing: { label: 'Preparing', color: '#8B5CF6' },
  running: { label: 'Running', color: '#06B6D4' },
  completed: { label: 'Completed', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
  expired: { label: 'Expired', color: '#F59E0B' },
};

export const REPRODUCTION_ACTION_LABELS: Record<ReproductionActionType, string> = {
  navigate: 'Navigate',
  click: 'Click',
  fill: 'Fill',
  select: 'Select',
  check: 'Check',
  uncheck: 'Uncheck',
  upload_test_file: 'Upload Test File',
  wait_for: 'Wait For',
  assert_visible: 'Assert Visible',
  assert_text: 'Assert Text',
  assert_url: 'Assert URL',
  custom_checkpoint: 'Checkpoint',
};

export const REPRODUCTION_STEP_STATUS_CONFIG: Record<ReproductionStepStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#94A3B8' },
  running: { label: 'Running', color: '#3B82F6' },
  passed: { label: 'Passed', color: '#10B981' },
  failed: { label: 'Failed', color: '#EF4444' },
  skipped: { label: 'Skipped', color: '#F59E0B' },
  blocked: { label: 'Blocked', color: '#6B7280' },
};

export const REPRODUCTION_EVENT_TYPE_CONFIG: Record<ReproductionEventType, { label: string; color: string }> = {
  console_error: { label: 'Console Error', color: '#EF4444' },
  page_error: { label: 'Page Error', color: '#EF4444' },
  request_failed: { label: 'Request Failed', color: '#F97316' },
  response_error: { label: 'Response Error', color: '#F97316' },
  navigation: { label: 'Navigation', color: '#3B82F6' },
  assertion_failed: { label: 'Assertion Failed', color: '#EF4444' },
  screenshot_captured: { label: 'Screenshot Captured', color: '#10B981' },
  trace_started: { label: 'Trace Started', color: '#8B5CF6' },
  trace_completed: { label: 'Trace Completed', color: '#10B981' },
  worker_warning: { label: 'Worker Warning', color: '#F59E0B' },
};

export const DEFAULT_STEP_TIMEOUT_MS = 15000;
export const DEFAULT_RUN_MAX_MS = 600000;

export const ALLOWED_TEST_REFERENCES = [
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_BOOKING_REFERENCE',
  'TEST_PAYMENT_CARD',
  'TEST_CARD_NUMBER',
  'TEST_CARD_EXPIRY',
  'TEST_CARD_CVC',
  'TEST_PHONE',
  'TEST_POSTCODE',
  'TEST_ADDRESS_LINE1',
  'TEST_CITY',
  'TEST_FIRST_NAME',
  'TEST_LAST_NAME',
  'TEST_REFERENCE_CODE',
] as const;

export const FORBIDDEN_ACTION_PATTERNS = [
  /eval/i,
  /Function\s*\(/,
  /\.exec\(/,
  /\.run\(/,
  /script/i,
  /process\./,
  /require\(/,
  /import\(/,
  /fetch\(/,
  /XMLHttpRequest/,
  /localStorage/,
  /sessionStorage/,
  /document\.cookie/,
  /\.innerHTML/,
];

export interface ReproductionStepDefinition {
  step_number: number;
  action_type: ReproductionActionType;
  target_description: string | null;
  safe_selector: string | null;
  input_reference: string | null;
  expected_outcome: string | null;
}

export interface ReproductionRequest {
  reproduction_run_id: string;
  sandbox_instance_id: string | null;
  execution_mode: ReproductionExecutionMode;
  start_url: string;
  allowed_origins: string[];
  browser_type: string;
  viewport: { width: number; height: number };
  steps: ReproductionStepDefinition[];
  credential_references: Record<string, string>;
  trace_enabled: boolean;
  callback_url: string;
  expires_at: string;
}

export interface ReproductionCallbackPayload {
  reproduction_run_id: string;
  event_type: ReproductionCallbackEventType;
  status: string;
  step_number: number | null;
  reproduced: boolean | null;
  safe_summary: string | null;
  failure_code: string | null;
  worker_instance_id: string;
  timestamp: string;
}

export type ReproductionCallbackEventType =
  | 'reproduction_started'
  | 'reproduction_step_started'
  | 'reproduction_step_completed'
  | 'reproduction_evidence_uploaded'
  | 'reproduction_completed'
  | 'reproduction_failed'
  | 'reproduction_cancelled';

export interface ReproductionActionResult {
  success: boolean;
  reproduction_run_id: string;
  status: string;
  error?: string;
  error_code?: string;
}