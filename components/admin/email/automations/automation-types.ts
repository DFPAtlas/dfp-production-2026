export interface AutomationData {
  id?: string;
  organisation_id?: string | null;
  name: string;
  description: string;
  brand_kit_id: string | null;
  product_name: string;
  category: AutomationCategory;
  trigger_type: string;
  trigger_config: TriggerConfig | null;
  condition_groups: ConditionGroup[] | null;
  workflow_steps: WorkflowStep[] | null;
  active_version_id: string | null;
  status: AutomationStatus;
  tags: string[];
  owner_id: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AutomationCategory =
  | 'welcome'
  | 'onboarding'
  | 'account_security'
  | 'invitation'
  | 'reminder'
  | 'project_update'
  | 'payment'
  | 'appointment'
  | 'support'
  | 'retention'
  | 'internal_notification'
  | 'other';

export type AutomationStatus =
  | 'draft'
  | 'testing'
  | 'active'
  | 'paused'
  | 'needs_attention'
  | 'failed'
  | 'archived';

export interface AutomationVersionData {
  id?: string;
  organisation_id?: string | null;
  automation_id: string;
  version_number: number;
  trigger_type: string;
  trigger_config: TriggerConfig | null;
  condition_groups: ConditionGroup[] | null;
  workflow_steps: WorkflowStep[] | null;
  sender_config: SenderConfig | null;
  status: string;
  created_by?: string | null;
  created_at?: string;
  internal_note: string;
}

export interface AutomationExecution {
  id: string;
  organisation_id: string;
  automation_id: string;
  automation_version_id: string;
  trigger_event_id: string | null;
  trigger_payload: Record<string, unknown> | null;
  subject_record_id: string | null;
  recipient_email: string | null;
  status: ExecutionStatus;
  current_step: number;
  attempt_count: number;
  max_attempts: number;
  scheduled_resume_at: string | null;
  idempotency_key: string | null;
  error_code: string | null;
  error_message: string | null;
  step_results: StepResult[] | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'stopped'
  | 'failed'
  | 'retrying'
  | 'needs_attention';

export interface StepResult {
  stepIndex: number;
  stepType: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed' | 'blocked';
  startedAt?: string;
  completedAt?: string;
  output?: Record<string, unknown>;
  error?: string;
}

export interface TriggerConfig {
  source: string;
  event: string;
  webhook_secret?: string;
  webhook_path?: string;
  schedule_cron?: string;
  schedule_timezone?: string;
  record_type?: string;
  record_event?: string;
  n8n_workflow_id?: string;
  auth_required: boolean;
  rate_limit: number;
  payload_schema?: Record<string, unknown>;
}

export interface ConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: AutomationCondition[];
}

export interface AutomationCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'exists'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'before'
  | 'after'
  | 'is_one_of'
  | 'boolean_true'
  | 'boolean_false';

export interface WorkflowStep {
  id: string;
  order: number;
  type: WorkflowStepType;
  label: string;
  config: SendEmailConfig | WaitConfig | ConditionBranchConfig | CallN8nConfig | StopConfig | LogNoteConfig | NotifyConfig;
}

export type WorkflowStepType =
  | 'send_email'
  | 'wait'
  | 'condition_branch'
  | 'call_n8n'
  | 'stop'
  | 'log_note'
  | 'notify_team';

export interface SendEmailConfig {
  template_id: string | null;
  template_version_id: string | null;
  brand_kit_id: string | null;
  sender_profile_id: string | null;
  from_name: string;
  from_email: string;
  reply_to_name: string;
  reply_to_email: string;
  recipient_field: string;
  subject_override: string;
  preview_text_override: string;
  merge_fields: Record<string, string>;
  track_opens: boolean;
  track_clicks: boolean;
  respect_suppression: boolean;
  fallback_on_missing: boolean;
}

export interface WaitConfig {
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
  until_date_field: string;
  until_local_time: string;
  business_days_only: boolean;
  timezone: string;
}

export interface ConditionBranchConfig {
  field: string;
  operator: ConditionOperator;
  value: string;
  yes_branch_steps: WorkflowStep[];
  no_branch_steps: WorkflowStep[];
}

export interface CallN8nConfig {
  workflow_id: string;
  payload_mapping: Record<string, string>;
  wait_for_result: boolean;
}

export interface StopConfig {
  reason: string;
  stop_condition: string;
}

export interface LogNoteConfig {
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface NotifyConfig {
  channel: string;
  message_template: string;
  recipients: string[];
}

export interface SenderConfig {
  from_name: string;
  from_email: string;
  reply_to_name: string;
  reply_to_email: string;
  verified: boolean;
}

export interface TransactionalMapping {
  id?: string;
  organisation_id?: string | null;
  event_key: string;
  internal_name: string;
  product_name: string;
  trigger_source: string;
  template_id: string | null;
  template_version_id: string | null;
  sender_config: SenderConfig | null;
  recipient_mapping: string;
  required_merge_tags: string[];
  plain_text_fallback: boolean;
  failure_policy: 'retry' | 'log_only' | 'notify_admin' | 'discard';
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const AUTOMATION_CATEGORIES: { value: AutomationCategory; label: string }[] = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'account_security', label: 'Account Security' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'project_update', label: 'Project Update' },
  { value: 'payment', label: 'Payment' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'support', label: 'Support' },
  { value: 'retention', label: 'Retention' },
  { value: 'internal_notification', label: 'Internal Notification' },
  { value: 'other', label: 'Other' },
];

export const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  draft: 'Draft',
  testing: 'Testing',
  active: 'Active',
  paused: 'Paused',
  needs_attention: 'Needs Attention',
  failed: 'Failed',
  archived: 'Archived',
};

export const AUTOMATION_STATUS_COLORS: Record<AutomationStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  testing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  needs_attention: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  archived: 'bg-slate-600/10 text-slate-500 border-slate-600/20',
};

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  waiting: 'Waiting',
  completed: 'Completed',
  stopped: 'Stopped',
  failed: 'Failed',
  retrying: 'Retrying',
  needs_attention: 'Needs Attention',
};

export const EXECUTION_STATUS_COLORS: Record<ExecutionStatus, string> = {
  pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  running: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  waiting: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  stopped: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  retrying: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  needs_attention: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const TRIGGER_DEFINITIONS: {
  type: string;
  label: string;
  source: string;
  available: boolean;
  configFields: { key: string; label: string; type: string; required: boolean }[];
}[] = [
  { type: 'user_created', label: 'User Created', source: 'auth', available: true, configFields: [] },
  { type: 'email_verified', label: 'Email Verified', source: 'auth', available: true, configFields: [] },
  { type: 'password_reset', label: 'Password Reset', source: 'auth', available: true, configFields: [] },
  { type: 'org_created', label: 'Organisation Created', source: 'system', available: true, configFields: [] },
  { type: 'project_created', label: 'Project Created', source: 'projects', available: true, configFields: [] },
  { type: 'status_changed', label: 'Status Changed', source: 'system', available: true, configFields: [{ key: 'record_type', label: 'Record Type', type: 'text', required: true }] },
  { type: 'form_submitted', label: 'Form Submitted', source: 'webhook', available: true, configFields: [{ key: 'form_id', label: 'Form ID', type: 'text', required: true }] },
  { type: 'payment_event', label: 'Payment Event', source: 'stripe', available: true, configFields: [{ key: 'event_type', label: 'Event Type', type: 'select', required: true }] },
  { type: 'appointment_created', label: 'Appointment Created', source: 'system', available: false, configFields: [] },
  { type: 'appointment_reminder', label: 'Appointment Reminder', source: 'system', available: false, configFields: [] },
  { type: 'invitation_created', label: 'Invitation Created', source: 'system', available: true, configFields: [] },
  { type: 'task_due', label: 'Task Due', source: 'tasks', available: true, configFields: [{ key: 'days_before', label: 'Days Before Due', type: 'number', required: false }] },
  { type: 'record_inserted', label: 'Record Inserted', source: 'database', available: true, configFields: [{ key: 'table_name', label: 'Table Name', type: 'text', required: true }] },
  { type: 'record_updated', label: 'Record Updated', source: 'database', available: true, configFields: [{ key: 'table_name', label: 'Table Name', type: 'text', required: true }, { key: 'column_filter', label: 'Column Filter', type: 'text', required: false }] },
  { type: 'webhook_event', label: 'Webhook Event', source: 'webhook', available: true, configFields: [{ key: 'webhook_path', label: 'Webhook Path', type: 'text', required: true }] },
  { type: 'scheduled', label: 'Scheduled', source: 'schedule', available: true, configFields: [{ key: 'cron', label: 'Cron Expression', type: 'text', required: true }, { key: 'timezone', label: 'Timezone', type: 'text', required: true }] },
  { type: 'n8n_event', label: 'n8n Workflow Event', source: 'n8n', available: true, configFields: [{ key: 'n8n_workflow_id', label: 'n8n Workflow ID', type: 'text', required: true }] },
  { type: 'manual_test', label: 'Manual Test', source: 'manual', available: true, configFields: [] },
];

export const STEP_TYPE_LABELS: Record<WorkflowStepType, string> = {
  send_email: 'Send Email',
  wait: 'Wait',
  condition_branch: 'Condition',
  call_n8n: 'Call n8n',
  stop: 'Stop',
  log_note: 'Log Note',
  notify_team: 'Notify Team',
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: 'Equals',
  neq: 'Does Not Equal',
  contains: 'Contains',
  exists: 'Exists',
  gt: 'Greater Than',
  lt: 'Less Than',
  gte: 'Greater or Equal',
  lte: 'Less or Equal',
  before: 'Before',
  after: 'After',
  is_one_of: 'Is One Of',
  boolean_true: 'Is True',
  boolean_false: 'Is False',
};

export const FAILURE_POLICY_LABELS: Record<string, string> = {
  retry: 'Retry (up to 3 attempts)',
  log_only: 'Log Only',
  notify_admin: 'Notify Admin',
  discard: 'Discard',
};

export function blankTriggerConfig(): TriggerConfig {
  return {
    source: '',
    event: '',
    auth_required: true,
    rate_limit: 60,
  };
}

export function blankConditionGroup(id: string): ConditionGroup {
  return { id, logic: 'AND', conditions: [] };
}

export function blankCondition(id: string): AutomationCondition {
  return { id, field: '', operator: 'eq', value: '' };
}

export function blankSendEmailStep(id: string, order: number): WorkflowStep {
  return {
    id,
    order,
    type: 'send_email',
    label: 'Send Email',
    config: {
      template_id: null,
      template_version_id: null,
      brand_kit_id: null,
      sender_profile_id: null,
      from_name: '',
      from_email: '',
      reply_to_name: '',
      reply_to_email: '',
      recipient_field: '{{email}}',
      subject_override: '',
      preview_text_override: '',
      merge_fields: {},
      track_opens: true,
      track_clicks: true,
      respect_suppression: true,
      fallback_on_missing: true,
    } as SendEmailConfig,
  };
}

export function blankWaitStep(id: string, order: number): WorkflowStep {
  return {
    id,
    order,
    type: 'wait',
    label: 'Wait',
    config: {
      duration: 1,
      unit: 'days',
      until_date_field: '',
      until_local_time: '',
      business_days_only: false,
      timezone: 'Europe/London',
    } as WaitConfig,
  };
}

export function blankConditionBranchStep(id: string, order: number): WorkflowStep {
  return {
    id,
    order,
    type: 'condition_branch',
    label: 'Condition',
    config: {
      field: '',
      operator: 'eq',
      value: '',
      yes_branch_steps: [],
      no_branch_steps: [],
    } as ConditionBranchConfig,
  };
}

export function blankStopStep(id: string, order: number): WorkflowStep {
  return {
    id,
    order,
    type: 'stop',
    label: 'Stop',
    config: { reason: '', stop_condition: 'goal_completed' } as StopConfig,
  };
}