export const UAT_PROJECT_STATUSES = [
  'draft', 'planning', 'recruiting', 'ready_to_test', 'testing',
  'feedback_review', 'fixes_in_progress', 'retesting', 'awaiting_approval',
  'approved', 'complete', 'on_hold', 'cancelled', 'archived',
] as const;
export type UatProjectStatus = typeof UAT_PROJECT_STATUSES[number];

export const UAT_PROJECT_STATUS_CONFIG: Record<UatProjectStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  planning: { label: 'Planning', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  recruiting: { label: 'Recruiting', color: '#3B82F6', bg: 'bg-blue-500/10' },
  ready_to_test: { label: 'Ready to Test', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  testing: { label: 'Testing', color: '#10B981', bg: 'bg-emerald-500/10' },
  feedback_review: { label: 'Feedback Review', color: '#F59E0B', bg: 'bg-amber-500/10' },
  fixes_in_progress: { label: 'Fixes in Progress', color: '#F97316', bg: 'bg-orange-500/10' },
  retesting: { label: 'Retesting', color: '#EC4899', bg: 'bg-pink-500/10' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  approved: { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10' },
  complete: { label: 'Complete', color: '#10B981', bg: 'bg-emerald-500/10' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bg: 'bg-amber-500/10' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-red-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_JOB_STATUSES = [
  'draft', 'awaiting_approval', 'approved', 'open', 'recruiting',
  'in_progress', 'feedback_review', 'completed', 'cancelled', 'archived',
] as const;
export type UatJobStatus = typeof UAT_JOB_STATUSES[number];

export const UAT_JOB_STATUS_CONFIG: Record<UatJobStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  approved: { label: 'Approved', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  open: { label: 'Open', color: '#10B981', bg: 'bg-emerald-500/10' },
  recruiting: { label: 'Recruiting', color: '#3B82F6', bg: 'bg-blue-500/10' },
  in_progress: { label: 'In Progress', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  feedback_review: { label: 'Feedback Review', color: '#F59E0B', bg: 'bg-amber-500/10' },
  completed: { label: 'Completed', color: '#10B981', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-red-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_ENV_STATUSES = [
  'draft', 'preparing', 'available', 'degraded', 'unavailable', 'maintenance', 'retired',
] as const;
export type UatEnvStatus = typeof UAT_ENV_STATUSES[number];

export const UAT_ENV_STATUS_CONFIG: Record<UatEnvStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  preparing: { label: 'Preparing', color: '#3B82F6', bg: 'bg-blue-500/10' },
  available: { label: 'Available', color: '#10B981', bg: 'bg-emerald-500/10' },
  degraded: { label: 'Degraded', color: '#F59E0B', bg: 'bg-amber-500/10' },
  unavailable: { label: 'Unavailable', color: '#EF4444', bg: 'bg-red-500/10' },
  maintenance: { label: 'Maintenance', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  retired: { label: 'Retired', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_APP_STATUSES = [
  'submitted', 'under_review', 'shortlisted', 'reserve', 'accepted', 'rejected', 'withdrawn', 'expired',
] as const;
export type UatAppStatus = typeof UAT_APP_STATUSES[number];

export const UAT_APP_STATUS_CONFIG: Record<UatAppStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  under_review: { label: 'Under Review', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  shortlisted: { label: 'Shortlisted', color: '#3B82F6', bg: 'bg-blue-500/10' },
  reserve: { label: 'Reserve', color: '#F59E0B', bg: 'bg-amber-500/10' },
  accepted: { label: 'Accepted', color: '#10B981', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'bg-red-500/10' },
  withdrawn: { label: 'Withdrawn', color: '#94A3B8', bg: 'bg-slate-500/10' },
  expired: { label: 'Expired', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_ASSIGN_STATUSES = [
  'offered', 'accepted', 'declined', 'active', 'submitted', 'review_required', 'retest_required', 'complete', 'cancelled', 'no_show',
] as const;
export type UatAssignStatus = typeof UAT_ASSIGN_STATUSES[number];

export const UAT_ASSIGN_STATUS_CONFIG: Record<UatAssignStatus, { label: string; color: string; bg: string }> = {
  offered: { label: 'Offered', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  accepted: { label: 'Accepted', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  declined: { label: 'Declined', color: '#EF4444', bg: 'bg-red-500/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  submitted: { label: 'Submitted', color: '#3B82F6', bg: 'bg-blue-500/10' },
  review_required: { label: 'Review Required', color: '#F59E0B', bg: 'bg-amber-500/10' },
  retest_required: { label: 'Retest Required', color: '#F97316', bg: 'bg-orange-500/10' },
  complete: { label: 'Complete', color: '#10B981', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-red-500/10' },
  no_show: { label: 'No Show', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_FEEDBACK_TYPES = [
  'defect', 'usability', 'accessibility', 'content', 'performance', 'compatibility', 'security_concern', 'suggestion', 'positive_feedback', 'question',
] as const;

export const UAT_FEEDBACK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  defect: { label: 'Defect', color: '#EF4444' },
  usability: { label: 'Usability', color: '#F97316' },
  accessibility: { label: 'Accessibility', color: '#8B5CF6' },
  content: { label: 'Content', color: '#3B82F6' },
  performance: { label: 'Performance', color: '#EC4899' },
  compatibility: { label: 'Compatibility', color: '#F59E0B' },
  security_concern: { label: 'Security Concern', color: '#DC2626' },
  suggestion: { label: 'Suggestion', color: '#06B6D4' },
  positive_feedback: { label: 'Positive Feedback', color: '#10B981' },
  question: { label: 'Question', color: '#94A3B8' },
};

export const UAT_SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'informational'] as const;
export const UAT_SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#DC2626' },
  high: { label: 'High', color: '#F97316' },
  medium: { label: 'Medium', color: '#F59E0B' },
  low: { label: 'Low', color: '#6B7280' },
  informational: { label: 'Informational', color: '#94A3B8' },
};

export const UAT_PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'] as const;
export const UAT_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#DC2626' },
  high: { label: 'High', color: '#F97316' },
  medium: { label: 'Medium', color: '#F59E0B' },
  low: { label: 'Low', color: '#6B7280' },
};

export const UAT_FEEDBACK_STATUSES = [
  'submitted', 'awaiting_triage', 'needs_clarification', 'accepted', 'duplicate',
  'not_reproducible', 'deferred', 'in_progress', 'ready_for_retest',
  'retest_failed', 'retest_passed', 'resolved', 'closed', 'rejected',
] as const;

export const UAT_FEEDBACK_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  awaiting_triage: { label: 'Awaiting Triage', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  needs_clarification: { label: 'Needs Clarification', color: '#F59E0B', bg: 'bg-amber-500/10' },
  accepted: { label: 'Accepted', color: '#3B82F6', bg: 'bg-blue-500/10' },
  duplicate: { label: 'Duplicate', color: '#F59E0B', bg: 'bg-amber-500/10' },
  not_reproducible: { label: 'Not Reproducible', color: '#94A3B8', bg: 'bg-slate-500/10' },
  deferred: { label: 'Deferred', color: '#6B7280', bg: 'bg-gray-500/10' },
  in_progress: { label: 'In Progress', color: '#F97316', bg: 'bg-orange-500/10' },
  ready_for_retest: { label: 'Ready for Retest', color: '#EC4899', bg: 'bg-pink-500/10' },
  retest_failed: { label: 'Retest Failed', color: '#EF4444', bg: 'bg-red-500/10' },
  retest_passed: { label: 'Retest Passed', color: '#10B981', bg: 'bg-emerald-500/10' },
  resolved: { label: 'Resolved', color: '#10B981', bg: 'bg-emerald-500/10' },
  closed: { label: 'Closed', color: '#6B7280', bg: 'bg-gray-500/10' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'bg-red-500/10' },
};

export const UAT_RETEST_STATUSES = [
  'requested', 'accepted', 'in_progress', 'submitted', 'passed', 'failed', 'cancelled', 'overdue',
] as const;
export const UAT_RETEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  accepted: { label: 'Accepted', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: 'bg-blue-500/10' },
  submitted: { label: 'Submitted', color: '#F59E0B', bg: 'bg-amber-500/10' },
  passed: { label: 'Passed', color: '#10B981', bg: 'bg-emerald-500/10' },
  failed: { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: 'bg-gray-500/10' },
  overdue: { label: 'Overdue', color: '#DC2626', bg: 'bg-red-500/10' },
};

export const UAT_APPROVAL_STATUSES = [
  'not_ready', 'ready_with_exceptions', 'awaiting_approval', 'approved', 'rejected', 'revoked',
] as const;
export const UAT_APPROVAL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_ready: { label: 'Not Ready', color: '#EF4444', bg: 'bg-red-500/10' },
  ready_with_exceptions: { label: 'Ready with Exceptions', color: '#F59E0B', bg: 'bg-amber-500/10' },
  awaiting_approval: { label: 'Awaiting Approval', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  approved: { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'bg-red-500/10' },
  revoked: { label: 'Revoked', color: '#DC2626', bg: 'bg-red-500/10' },
};

export const UAT_SESSION_STATUSES = ['active', 'paused', 'completed', 'abandoned', 'expired'] as const;
export type UatSessionStatus = typeof UAT_SESSION_STATUSES[number];

export const UAT_SESSION_STATUS_CONFIG: Record<UatSessionStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: '#F59E0B', bg: 'bg-amber-500/10' },
  completed: { label: 'Completed', color: '#3B82F6', bg: 'bg-blue-500/10' },
  abandoned: { label: 'Abandoned', color: '#6B7280', bg: 'bg-gray-500/10' },
  expired: { label: 'Expired', color: '#EF4444', bg: 'bg-red-500/10' },
};

export const TEST_SUITE_STATUSES = ['draft', 'active', 'archived'] as const;
export type TestSuiteStatus = typeof TEST_SUITE_STATUSES[number];

export const TEST_SUITE_STATUS_CONFIG: Record<TestSuiteStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const TEST_CASE_STATUSES = ['draft', 'active', 'archived'] as const;
export type TestCaseDefinitionStatus = typeof TEST_CASE_STATUSES[number];

export const ASSIGNMENT_TEST_CASE_STATUSES = ['not_started', 'in_progress', 'passed', 'failed', 'blocked', 'skipped', 'needs_retest'] as const;
export type AssignmentTestCaseStatus = typeof ASSIGNMENT_TEST_CASE_STATUSES[number];

export const ASSIGNMENT_TC_STATUS_CONFIG: Record<AssignmentTestCaseStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#94A3B8', bg: 'bg-slate-500/10' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: 'bg-blue-500/10' },
  passed: { label: 'Passed', color: '#10B981', bg: 'bg-emerald-500/10' },
  failed: { label: 'Failed', color: '#EF4444', bg: 'bg-red-500/10' },
  blocked: { label: 'Blocked', color: '#F59E0B', bg: 'bg-amber-500/10' },
  skipped: { label: 'Skipped', color: '#6B7280', bg: 'bg-gray-500/10' },
  needs_retest: { label: 'Needs Retest', color: '#8B5CF6', bg: 'bg-violet-500/10' },
};

export const UAT_PLAN_STATUSES = ['draft', 'in_review', 'approved', 'superseded', 'archived'] as const;
export const UAT_PLAN_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  in_review: { label: 'In Review', color: '#F59E0B', bg: 'bg-amber-500/10' },
  approved: { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10' },
  superseded: { label: 'Superseded', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export function generateUatReference(prefix: string): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-${prefix}-${year}-${seq}`;
}

export function mapLegacyProjectStatus(status: string): UatProjectStatus {
  const m: Record<string, UatProjectStatus> = {
    active: 'testing', paused: 'on_hold', archived: 'archived',
  };
  return m[status] || 'draft';
}

export function mapLegacyJobStatus(status: string): UatJobStatus {
  const m: Record<string, UatJobStatus> = {
    draft: 'draft', open: 'open', in_testing: 'in_progress', completed: 'completed', closed: 'archived',
  };
  return m[status] || 'draft';
}

export function mapLegacyFeedbackStatus(status: string): string {
  const m: Record<string, string> = {
    new: 'submitted', reviewing: 'awaiting_triage', accepted: 'accepted',
    duplicate: 'duplicate', rejected: 'rejected', fixed: 'ready_for_retest',
    retest_needed: 'ready_for_retest', closed: 'closed',
  };
  return m[status] || 'submitted';
}

export const UAT_MONITORING_EVENT_TYPES = [
  'session_started', 'session_resumed', 'session_paused', 'session_finished',
  'heartbeat', 'page_view', 'route_change', 'page_hidden', 'page_visible',
  'javascript_error', 'unhandled_rejection', 'api_failure', 'api_slow',
  'performance', 'tester_checkpoint', 'monitoring_started', 'monitoring_stopped',
] as const;
export type UatMonitoringEventType = typeof UAT_MONITORING_EVENT_TYPES[number];

export const UAT_MONITORING_EVENT_CONFIG: Record<UatMonitoringEventType, { label: string; color: string; bg: string }> = {
  session_started: { label: 'Session Started', color: '#10B981', bg: 'bg-emerald-500/10' },
  session_resumed: { label: 'Session Resumed', color: '#10B981', bg: 'bg-emerald-500/10' },
  session_paused: { label: 'Session Paused', color: '#F59E0B', bg: 'bg-amber-500/10' },
  session_finished: { label: 'Session Finished', color: '#3B82F6', bg: 'bg-blue-500/10' },
  heartbeat: { label: 'Heartbeat', color: '#94A3B8', bg: 'bg-slate-500/10' },
  page_view: { label: 'Page View', color: '#6366F1', bg: 'bg-indigo-500/10' },
  route_change: { label: 'Route Change', color: '#6366F1', bg: 'bg-indigo-500/10' },
  page_hidden: { label: 'Page Hidden', color: '#94A3B8', bg: 'bg-slate-500/10' },
  page_visible: { label: 'Page Visible', color: '#94A3B8', bg: 'bg-slate-500/10' },
  javascript_error: { label: 'JS Error', color: '#EF4444', bg: 'bg-red-500/10' },
  unhandled_rejection: { label: 'Unhandled Rejection', color: '#EF4444', bg: 'bg-red-500/10' },
  api_failure: { label: 'API Failure', color: '#F97316', bg: 'bg-orange-500/10' },
  api_slow: { label: 'API Slow', color: '#F59E0B', bg: 'bg-amber-500/10' },
  performance: { label: 'Performance', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  tester_checkpoint: { label: 'Checkpoint', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  monitoring_started: { label: 'Monitoring Started', color: '#10B981', bg: 'bg-emerald-500/10' },
  monitoring_stopped: { label: 'Monitoring Stopped', color: '#EF4444', bg: 'bg-red-500/10' },
};

export const UAT_EVIDENCE_TYPES = ['screenshot', 'image', 'document', 'video', 'log', 'other'] as const;

export const UAT_EVIDENCE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  screenshot: { label: 'Screenshot', color: '#3B82F6', bg: 'bg-blue-500/10' },
  image: { label: 'Image', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  document: { label: 'Document', color: '#F59E0B', bg: 'bg-amber-500/10' },
  video: { label: 'Video', color: '#EF4444', bg: 'bg-red-500/10' },
  log: { label: 'Log', color: '#94A3B8', bg: 'bg-slate-500/10' },
  other: { label: 'Other', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const UAT_EVIDENCE_STATUSES = ['uploaded', 'attached', 'quarantined', 'rejected', 'deleted'] as const;

export const UAT_EVIDENCE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  uploaded: { label: 'Uploaded', color: '#3B82F6', bg: 'bg-blue-500/10' },
  attached: { label: 'Attached', color: '#10B981', bg: 'bg-emerald-500/10' },
  quarantined: { label: 'Quarantined', color: '#F59E0B', bg: 'bg-amber-500/10' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'bg-red-500/10' },
  deleted: { label: 'Deleted', color: '#6B7280', bg: 'bg-gray-500/10' },
};