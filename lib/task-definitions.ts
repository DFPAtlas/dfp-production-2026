export type TaskStatus =
  | 'backlog' | 'planned' | 'ready' | 'in_progress'
  | 'blocked' | 'awaiting_review' | 'changes_required'
  | 'complete' | 'cancelled' | 'archived';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export type TaskType =
  | 'standard' | 'feature' | 'bug' | 'improvement'
  | 'incident_response' | 'uat_remediation' | 'content_action'
  | 'onboarding' | 'launch_readiness' | 'client_request'
  | 'maintenance' | 'review';

export type ReviewStatus = 'not_required' | 'awaiting_review' | 'approved' | 'changes_required';

export type DependencyType = 'blocks' | 'blocked_by' | 'finish_to_start' | 'start_to_start' | 'related';

export type WorkloadLevel = 'available' | 'balanced' | 'high' | 'over_capacity' | 'not_enough_data';

export type TimeApprovalStatus = 'pending' | 'approved' | 'rejected';

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: '#6B7280' },
  { value: 'planned', label: 'Planned', color: '#6366F1' },
  { value: 'ready', label: 'Ready', color: '#3B82F6' },
  { value: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
  { value: 'awaiting_review', label: 'Awaiting Review', color: '#8B5CF6' },
  { value: 'changes_required', label: 'Changes Required', color: '#F97316' },
  { value: 'complete', label: 'Complete', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#94A3B8' },
  { value: 'archived', label: 'Archived', color: '#64748B' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'normal', label: 'Normal', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
];

export const TASK_TYPES: { value: TaskType; label: string; color: string }[] = [
  { value: 'standard', label: 'Standard', color: '#06B6D4' },
  { value: 'feature', label: 'Feature', color: '#8B5CF6' },
  { value: 'bug', label: 'Bug', color: '#EF4444' },
  { value: 'improvement', label: 'Improvement', color: '#3B82F6' },
  { value: 'incident_response', label: 'Incident', color: '#DC2626' },
  { value: 'uat_remediation', label: 'UAT Fix', color: '#EC4899' },
  { value: 'content_action', label: 'Content', color: '#14B8A6' },
  { value: 'onboarding', label: 'Onboarding', color: '#10B981' },
  { value: 'launch_readiness', label: 'Launch', color: '#6366F1' },
  { value: 'client_request', label: 'Client Request', color: '#F59E0B' },
  { value: 'maintenance', label: 'Maintenance', color: '#94A3B8' },
  { value: 'review', label: 'Review', color: '#8B5CF6' },
];

export const REVIEW_STATUSES: { value: ReviewStatus; label: string; color: string }[] = [
  { value: 'not_required', label: 'Not Required', color: '#94A3B8' },
  { value: 'awaiting_review', label: 'Awaiting Review', color: '#8B5CF6' },
  { value: 'approved', label: 'Approved', color: '#10B981' },
  { value: 'changes_required', label: 'Changes Required', color: '#F97316' },
];

export const DEPENDENCY_TYPES: { value: DependencyType; label: string }[] = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'blocked_by', label: 'Blocked By' },
  { value: 'finish_to_start', label: 'Finish to Start' },
  { value: 'start_to_start', label: 'Start to Start' },
  { value: 'related', label: 'Related' },
];

export const WORKLOAD_LEVELS: { value: WorkloadLevel; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: '#10B981' },
  { value: 'balanced', label: 'Balanced', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'over_capacity', label: 'Over Capacity', color: '#EF4444' },
  { value: 'not_enough_data', label: 'Not Enough Data', color: '#94A3B8' },
];

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ['planned', 'cancelled', 'archived'],
  planned: ['ready', 'backlog', 'cancelled'],
  ready: ['in_progress', 'planned', 'cancelled'],
  in_progress: ['blocked', 'awaiting_review', 'complete', 'cancelled'],
  blocked: ['in_progress', 'ready', 'cancelled'],
  awaiting_review: ['changes_required', 'complete', 'in_progress'],
  changes_required: ['in_progress', 'awaiting_review', 'cancelled'],
  complete: ['archived', 'in_progress'],
  cancelled: ['backlog', 'archived'],
  archived: ['backlog'],
};

export const KANBAN_COLUMNS: TaskStatus[] = [
  'backlog', 'planned', 'ready', 'in_progress', 'blocked', 'awaiting_review', 'complete',
];

export const SENSITIVE_TRANSITIONS: TaskStatus[] = [
  'complete', 'cancelled', 'archived',
];

export const TEMPLATE_CATEGORIES = [
  'onboarding',
  'project_kickoff',
  'launch_readiness',
  'incident_response',
  'uat_remediation',
  'content_publication',
  'maintenance',
] as const;

export function getStatusDef(status: string) {
  return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
}

export function getPriorityDef(priority: string) {
  return TASK_PRIORITIES.find(p => p.value === priority) || TASK_PRIORITIES[1];
}

export function getTypeDef(type: string) {
  return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[0];
}

export function getReviewDef(review: string) {
  return REVIEW_STATUSES.find(r => r.value === review) || REVIEW_STATUSES[0];
}

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

export function isSensitiveTransition(status: TaskStatus): boolean {
  return SENSITIVE_TRANSITIONS.includes(status);
}

export function detectCircularDependency(
  taskId: string,
  proposedDependsOnId: string,
  allDeps: { task_id: string; depends_on_id: string }[]
): boolean {
  const graph = new Map<string, string[]>();
  for (const d of allDeps) {
    if (!graph.has(d.task_id)) graph.set(d.task_id, []);
    graph.get(d.task_id)!.push(d.depends_on_id);
  }
  if (!graph.has(proposedDependsOnId)) graph.set(proposedDependsOnId, []);
  graph.get(proposedDependsOnId)!.push(taskId);

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    stack.add(node);
    for (const neighbor of (graph.get(node) || [])) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (stack.has(neighbor)) {
        return true;
      }
    }
    stack.delete(node);
    return false;
  }

  return dfs(proposedDependsOnId);
}

export function calculateWorkload(
  openTasks: Record<string, unknown>[],
  estimatedEffortField: string
): { level: WorkloadLevel; tasks: Record<string, unknown>[] } {
  const withEffort = openTasks.filter(t => (t as any)[estimatedEffortField] != null);
  const totalEffort = withEffort.reduce((sum, t) => sum + (Number((t as any)[estimatedEffortField]) || 0), 0);
  if (openTasks.length === 0) return { level: 'not_enough_data', tasks: [] };
  if (withEffort.length === 0) return { level: 'not_enough_data', tasks: openTasks };
  if (totalEffort <= 20) return { level: 'available', tasks: withEffort };
  if (totalEffort <= 40) return { level: 'balanced', tasks: withEffort };
  if (totalEffort <= 60) return { level: 'high', tasks: withEffort };
  return { level: 'over_capacity', tasks: withEffort };
}

