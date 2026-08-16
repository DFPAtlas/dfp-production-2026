export type ApprovalType =
  | 'design' | 'content' | 'functionality' | 'milestone'
  | 'staging_release' | 'launch' | 'document' | 'other';

export type ApprovalStatus =
  | 'draft' | 'awaiting_client' | 'viewed' | 'changes_requested'
  | 'resubmitted' | 'approved' | 'cancelled' | 'archived';

export type ApprovalPriority = 'normal' | 'high' | 'urgent';

export type ApprovalItemType =
  | 'image' | 'pdf' | 'document' | 'file'
  | 'staging_link' | 'copy' | 'milestone_summary' | 'other';

export const APPROVAL_TYPES: { value: ApprovalType; label: string; color: string }[] = [
  { value: 'design', label: 'Design', color: '#8B5CF6' },
  { value: 'content', label: 'Content', color: '#06B6D4' },
  { value: 'functionality', label: 'Functionality', color: '#3B82F6' },
  { value: 'milestone', label: 'Milestone', color: '#F59E0B' },
  { value: 'staging_release', label: 'Staging Release', color: '#EC4899' },
  { value: 'launch', label: 'Launch', color: '#10B981' },
  { value: 'document', label: 'Document', color: '#94A3B8' },
  { value: 'other', label: 'Other', color: '#6B7280' },
];

export const APPROVAL_STATUSES: { value: ApprovalStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#6B7280' },
  { value: 'awaiting_client', label: 'Awaiting Client', color: '#8B5CF6' },
  { value: 'viewed', label: 'Viewed', color: '#3B82F6' },
  { value: 'changes_requested', label: 'Changes Requested', color: '#F59E0B' },
  { value: 'resubmitted', label: 'Resubmitted', color: '#06B6D4' },
  { value: 'approved', label: 'Approved', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#94A3B8' },
];

export const APPROVAL_PRIORITIES: { value: ApprovalPriority; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: '#6B7280' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
];

export const APPROVAL_ITEM_TYPES: { value: ApprovalItemType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Document' },
  { value: 'file', label: 'Project File' },
  { value: 'staging_link', label: 'Staging Link' },
  { value: 'copy', label: 'Written Copy' },
  { value: 'milestone_summary', label: 'Milestone Summary' },
  { value: 'other', label: 'Other' },
];

export function getApprovalTypeDef(type: string) {
  return APPROVAL_TYPES.find(t => t.value === type) || APPROVAL_TYPES[7];
}

export function getApprovalStatusDef(status: string) {
  return APPROVAL_STATUSES.find(s => s.value === status) || APPROVAL_STATUSES[0];
}

export function getApprovalPriorityDef(priority: string) {
  return APPROVAL_PRIORITIES.find(p => p.value === priority) || APPROVAL_PRIORITIES[0];
}