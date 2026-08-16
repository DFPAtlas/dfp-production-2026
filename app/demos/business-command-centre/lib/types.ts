export type ViewKey =
  | 'overview'
  | 'projects'
  | 'people'
  | 'tasks'
  | 'finance'
  | 'pulse'
  | 'attention'
  | 'activity'
  | 'workstreams'
  | 'milestones'
  | 'resources';

export type ProjectFilter = 'all' | 'on-track' | 'attention';
export type TaskFilter = 'all' | 'priority' | 'completed';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Waiting on client';
export type CapacityStatus = 'Available' | 'Balanced' | 'Over capacity';
export type HealthStatus = 'Healthy' | 'Strong' | 'At Risk' | 'Critical';
export type CapacityLevel = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  client: string;
  owner: string;
  progress: number;
  status: ProjectStatus;
  due: string;
  nextAction: string;
  budget: string;
  health: 'On track' | 'At Risk' | 'Healthy';
  sponsor: string;
  priority: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
}

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  capacity: number;
  projects: number;
  status: CapacityStatus;
  department: string;
}

export interface TeamCapacity {
  department: string;
  filled: number;
  total: number;
  percentage: number;
  status: CapacityLevel;
}

export interface DemoTask {
  id: string;
  title: string;
  project: string;
  owner: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export interface NavItem {
  key: ViewKey;
  label: string;
  iconName: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface MetricCard {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  vsPrior: string;
  sparkline: number[];
  target: ViewKey;
  warning?: boolean;
}

export interface FinanceMetric {
  label: string;
  value: string;
  change: string;
  bars: number[];
  inverse?: boolean;
}

export interface CashBar {
  month: string;
  income: number;
  cost: number;
}

export interface MilestoneItem {
  date: string;
  label: string;
  amount: string;
}

export interface ActivityEvent {
  time: string;
  message: string;
  type: 'project' | 'finance' | 'people' | 'task' | 'system';
}

export interface Insight {
  id: string;
  number: string;
  title: string;
  detail: string;
  recommendation: string;
  resolved?: boolean;
}

export interface TourStep {
  view: ViewKey;
  title: string;
  instruction: string;
  focusLabel: string;
}

export interface AttentionItem {
  level: 'high' | 'medium' | 'low' | 'people' | 'today';
  title: string;
  detail: string;
  actionLabel: string;
  impact: string;
  target: ViewKey;
}

export interface PulseDomain {
  label: string;
  value: number;
  status: HealthStatus;
}