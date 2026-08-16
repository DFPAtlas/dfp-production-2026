export const THREAD_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'project', label: 'Project' },
  { value: 'website', label: 'Website' },
  { value: 'approval', label: 'Approval' },
  { value: 'content', label: 'Content' },
  { value: 'billing', label: 'Billing' },
  { value: 'support', label: 'Support' },
] as const;

export const THREAD_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'awaiting_client', label: 'Awaiting Client' },
  { value: 'awaiting_team', label: 'Awaiting Team' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
] as const;

export const THREAD_PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const TICKET_CATEGORIES = [
  { value: 'website_issue', label: 'Website Issue' },
  { value: 'account', label: 'Account' },
  { value: 'access', label: 'Access' },
  { value: 'billing', label: 'Billing' },
  { value: 'content', label: 'Content' },
  { value: 'change_request', label: 'Change Request' },
  { value: 'technical', label: 'Technical' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
] as const;

export const TICKET_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'awaiting_team', label: 'Awaiting Team' },
  { value: 'awaiting_client', label: 'Awaiting Client' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export function getThreadTypeLabel(value: string) {
  return THREAD_TYPES.find(t => t.value === value)?.label || value;
}

export function getThreadStatusLabel(value: string) {
  return THREAD_STATUSES.find(s => s.value === value)?.label || value;
}

export function getThreadPriorityLabel(value: string) {
  return THREAD_PRIORITIES.find(p => p.value === value)?.label || value;
}

export function getTicketCategoryLabel(value: string) {
  return TICKET_CATEGORIES.find(c => c.value === value)?.label || value;
}

export function getTicketStatusLabel(value: string) {
  return TICKET_STATUSES.find(s => s.value === value)?.label || value;
}

export function getTicketPriorityLabel(value: string) {
  return TICKET_PRIORITIES.find(p => p.value === value)?.label || value;
}

export function getThreadStatusColor(status: string) {
  switch (status) {
    case 'open': return '#22D3EE';
    case 'awaiting_client': return '#F59E0B';
    case 'awaiting_team': return '#8B5CF6';
    case 'resolved': return '#4ADE80';
    case 'closed': return '#64748B';
    case 'archived': return '#475569';
    default: return '#94A3B8';
  }
}

export function getTicketStatusColor(status: string) {
  switch (status) {
    case 'new': return '#22D3EE';
    case 'open': return '#3B82F6';
    case 'assigned': return '#8B5CF6';
    case 'awaiting_team': return '#A78BFA';
    case 'awaiting_client': return '#F59E0B';
    case 'in_progress': return '#06B6D4';
    case 'resolved': return '#4ADE80';
    case 'closed': return '#64748B';
    case 'cancelled': return '#EF4444';
    default: return '#94A3B8';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'normal': return '#3B82F6';
    case 'low': return '#64748B';
    default: return '#94A3B8';
  }
}

export function generateTicketRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'TKT-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatMessageTimeFull(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}