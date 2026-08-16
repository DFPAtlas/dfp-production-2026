export type ViewKey = 'overview' | 'milestones' | 'approvals' | 'messages' | 'files' | 'billing';

export type ApprovalDecision = 'pending' | 'approved' | 'changes';

export type InvoiceStatus = 'Paid' | 'Due' | 'Scheduled';

export type MilestoneStatus = 'Complete' | 'Current' | 'Upcoming';

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  date: string;
  description: string;
  stageLabel: string;
}

export interface PortalFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  category: 'Design' | 'Documents' | 'Invoices';
  status?: 'Approved' | 'Needs Review' | 'Pending';
}

export interface PortalMessage {
  id: string;
  author: string;
  role: string;
  body: string;
  time: string;
  client: boolean;
  avatar?: string;
}

export interface Invoice {
  id: string;
  label: string;
  amount: number;
  due: string;
  status: InvoiceStatus;
  description: string;
  milestone: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  label: string;
  detail: string;
  type: 'milestone' | 'approval' | 'file' | 'message' | 'payment' | 'system';
}

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

export interface TourStep {
  view: ViewKey;
  title: string;
  instruction: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

export interface ProjectStats {
  progress: number;
  daysRemaining: number;
  nextApproval: string;
  health: 'On Track' | 'At Risk' | 'Delayed';
  totalValue: number;
  paidToDate: number;
  remaining: number;
}