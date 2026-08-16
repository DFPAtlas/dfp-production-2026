import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Zap,
  Workflow,
  UsersRound,
  ListChecks,
  CirclePoundSterling,
  Gauge,
  TrendingUp,
  FileText,
  BriefcaseBusiness,
  BarChart3,
  Milestone,
  Layers,
  Calendar,
  Bookmark,
  HardHat,
} from 'lucide-react';

import type {
  ActivityEvent,
  AttentionItem,
  CashBar,
  DemoTask,
  FinanceMetric,
  Insight,
  MetricCard,
  MilestoneItem,
  Project,
  TeamCapacity,
  TourStep,
} from './types';

export const projects: Project[] = [
  {
    id: 'orion',
    name: 'Orion Platform Upgrade',
    client: 'Northstar Internal',
    owner: 'Sarah Mitchell',
    progress: 72,
    status: 'At Risk',
    due: '30 May 2025',
    nextAction: 'Approve dashboard prototype',
    budget: '£2.45M',
    health: 'At Risk',
    sponsor: 'David Nguyen',
    priority: 'High',
    lastUpdated: '23 May 2025 09:15',
  },
  {
    id: 'atlas',
    name: 'Atlas Customer Portal',
    client: 'Aster & Co.',
    owner: 'Amelia Hart',
    progress: 64,
    status: 'On Track',
    due: '18 Jun 2025',
    nextAction: 'Confirm integration specs',
    budget: '£18,400',
    health: 'On Track',
    sponsor: 'Jamie Lee',
    priority: 'Medium',
    lastUpdated: '23 May 2025 08:42',
  },
  {
    id: 'helix',
    name: 'Helix Data Migration',
    client: 'Northline Group',
    owner: 'Chris Morgan',
    progress: 51,
    status: 'On Track',
    due: '27 Jun 2025',
    nextAction: 'Validate data schema',
    budget: '£12,750',
    health: 'On Track',
    sponsor: 'Sophie Reed',
    priority: 'Medium',
    lastUpdated: '22 May 2025 16:30',
  },
  {
    id: 'nova',
    name: 'Nova Marketing Campaign',
    client: 'Horizon Fitness',
    owner: 'Daniel Price',
    progress: 38,
    status: 'At Risk',
    due: '14 Jul 2025',
    nextAction: 'Confirm CRM data mapping',
    budget: '£9,600',
    health: 'At Risk',
    sponsor: 'Marcus Reed',
    priority: 'High',
    lastUpdated: '22 May 2025 11:15',
  },
  {
    id: 'zenith',
    name: 'Zenith Process Redesign',
    client: 'Oak & Stone',
    owner: 'Sophie Reed',
    progress: 89,
    status: 'On Track',
    due: '4 Jun 2025',
    nextAction: 'Complete launch checklist',
    budget: '£22,100',
    health: 'Healthy',
    sponsor: 'Aisha Khan',
    priority: 'Low',
    lastUpdated: '23 May 2025 09:00',
  },
];

export const teamCapacity: TeamCapacity[] = [
  { department: 'Engineering', filled: 24, total: 28, percentage: 86, status: 'high' },
  { department: 'Product', filled: 9, total: 12, percentage: 75, status: 'medium' },
  { department: 'Design', filled: 6, total: 8, percentage: 75, status: 'medium' },
  { department: 'Data', filled: 7, total: 10, percentage: 70, status: 'medium' },
  { department: 'Marketing', filled: 6, total: 9, percentage: 67, status: 'low' },
];

export const initialTasks: DemoTask[] = [
  {
    id: 'proposal',
    title: 'Approve client proposal',
    project: 'Atlas Customer Portal',
    owner: 'Martin',
    due: 'Today',
    priority: 'High',
    completed: false,
  },
  {
    id: 'mapping',
    title: 'Review CRM data mapping',
    project: 'Nova Marketing Campaign',
    owner: 'Chris',
    due: 'Today',
    priority: 'High',
    completed: false,
  },
  {
    id: 'launch',
    title: 'Confirm launch checklist',
    project: 'Zenith Process Redesign',
    owner: 'Sophie',
    due: 'Tomorrow',
    priority: 'Medium',
    completed: false,
  },
  {
    id: 'invoice',
    title: 'Send milestone invoice',
    project: 'Helix Data Migration',
    owner: 'Finance',
    due: '30 May',
    priority: 'Medium',
    completed: false,
  },
  {
    id: 'wireframes',
    title: 'Archive approved wireframes',
    project: 'Atlas Customer Portal',
    owner: 'Amelia',
    due: '26 May',
    priority: 'Low',
    completed: true,
  },
];

export const metrics: MetricCard[] = [
  {
    label: 'Revenue YTD',
    value: '$24.8M',
    change: '+18.8%',
    changePositive: true,
    vsPrior: 'vs prior year $20.9M',
    sparkline: [42, 48, 45, 52, 58, 55, 62, 68, 65, 72, 78, 88],
    target: 'finance',
  },
  {
    label: 'EBITDA',
    value: '$6.2M',
    change: '+14.3%',
    changePositive: true,
    vsPrior: 'Margin 25.0%',
    sparkline: [38, 42, 40, 46, 50, 48, 54, 58, 56, 62, 65, 72],
    target: 'finance',
  },
  {
    label: 'Cash Position',
    value: '$11.7M',
    change: '+7.2%',
    changePositive: true,
    vsPrior: 'Runway 126 days',
    sparkline: [55, 58, 56, 60, 63, 61, 65, 68, 66, 70, 72, 77],
    target: 'finance',
  },
  {
    label: 'On-time Delivery',
    value: '93.2%',
    change: '+4.1pp',
    changePositive: true,
    vsPrior: 'vs prior 89.1%',
    sparkline: [82, 84, 83, 86, 87, 88, 89, 90, 91, 91, 92, 93],
    target: 'projects',
  },
  {
    label: 'Employee NPS',
    value: '61',
    change: '+8',
    changePositive: true,
    vsPrior: 'vs prior 53',
    sparkline: [45, 48, 47, 50, 52, 51, 54, 56, 55, 58, 59, 61],
    target: 'people',
  },
];

export const cashBars: CashBar[] = [
  { month: 'Jan', income: 52, cost: 38 },
  { month: 'Feb', income: 48, cost: 41 },
  { month: 'Mar', income: 55, cost: 40 },
  { month: 'Apr', income: 67, cost: 46 },
  { month: 'May', income: 74, cost: 49 },
  { month: 'Jun', income: 86, cost: 58 },
];

export const milestones: MilestoneItem[] = [
  { date: '30 May', label: 'Orion milestone 3', amount: '£6,800' },
  { date: '18 Jun', label: 'Atlas phase 2 payment', amount: '£3,200' },
  { date: '27 Jun', label: 'Helix discovery', amount: '£2,400' },
];

export const financeMetrics: FinanceMetric[] = [
  { label: 'Revenue Trend', value: '$24.8M', change: '+18.8%', bars: [35, 42, 38, 48, 52, 58, 55, 65, 68, 72, 78, 88] },
  { label: 'EBITDA Trend', value: '$6.2M', change: '+14.3%', bars: [28, 32, 30, 36, 40, 38, 44, 48, 46, 52, 56, 62] },
  { label: 'Cash Flow', value: '$3.1M', change: '+11.2%', bars: [25, 28, 26, 30, 32, 31, 34, 36, 35, 38, 40, 42] },
  { label: 'Expense Ratio', value: '24.7%', change: '+2.1pp', bars: [22, 23, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28], inverse: true },
];

export const initialActivity: ActivityEvent[] = [
  { time: '2m ago', message: 'Revenue target exceeded for May', type: 'finance' },
  { time: '15m ago', message: 'Project Atlas phase completed', type: 'project' },
  { time: '1h ago', message: 'New team member added: Jamie Lee', type: 'people' },
  { time: '2h ago', message: 'Budget reforecast completed', type: 'finance' },
];

export const attentionItems: AttentionItem[] = [
  {
    level: 'high',
    title: 'Project Orion is 12% behind schedule',
    detail: 'Due date risk: 7 days',
    actionLabel: 'Review project',
    impact: 'High impact',
    target: 'projects',
  },
  {
    level: 'medium',
    title: 'Resource conflict in Engineering',
    detail: '2 teams affected',
    actionLabel: 'View capacity',
    impact: 'Medium',
    target: 'people',
  },
  {
    level: 'medium',
    title: 'Supplier payment overdue',
    detail: '$25K overdue',
    actionLabel: 'Review payment',
    impact: 'Medium',
    target: 'finance',
  },
];

export const insights: Insight[] = [
  {
    id: 'ai',
    number: 'AI',
    title: 'Revenue is trending 18.8% above plan',
    detail: 'Main drivers: Enterprise sales (+24%) and Upsell (+31%).',
    recommendation: 'View full analysis →',
  },
  {
    id: 'predictive',
    number: '01',
    title: '30 day forecast',
    detail: 'Revenue $6.1M – $6.4M',
    recommendation: '+16% – 22% vs prior 30 days',
  },
  {
    id: 'recommendation',
    number: '02',
    title: 'Reallocate 1 FTE from Marketing to Product',
    detail: 'Improve delivery timeline for Orion project.',
    recommendation: 'Review recommendation →',
  },
  {
    id: 'benchmark',
    number: '03',
    title: 'On-time Delivery 93.2%',
    detail: 'Your performance vs industry',
    recommendation: 'Top quartile',
  },
  {
    id: 'data',
    number: '04',
    title: 'All critical datasets',
    detail: '100% Data integrity score',
    recommendation: 'View data quality →',
  },
];

export const tourSteps: TourStep[] = [
  {
    view: 'overview',
    title: 'Find what needs attention.',
    instruction:
      'Inspect the headline figures and identify the area needing attention.',
    focusLabel: 'Command Centre',
  },
  {
    view: 'projects',
    title: 'Investigate a delivery risk.',
    instruction:
      'Select Orion Platform Upgrade to review its risk and next action.',
    focusLabel: 'Projects',
  },
  {
    view: 'people',
    title: 'Fix a workload problem.',
    instruction:
      'Review Engineering capacity and simulate rebalancing one resource.',
    focusLabel: 'Team Capacity',
  },
  {
    view: 'tasks',
    title: 'Complete an urgent action.',
    instruction: 'Mark one high-priority task as complete.',
    focusLabel: 'Tasks',
  },
  {
    view: 'finance',
    title: 'Review the cash position.',
    instruction:
      'Open the outstanding invoice summary and review the next milestone.',
    focusLabel: 'Finance',
  },
];

export const pulseDomains = [
  { label: 'Financial Health', value: 91, status: 'Healthy' as const },
  { label: 'Customer Demand', value: 88, status: 'Strong' as const },
  { label: 'Operational Delivery', value: 72, status: 'At Risk' as const },
  { label: 'People & Culture', value: 89, status: 'Healthy' as const },
];

export const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Zap,
  Workflow,
  UsersRound,
  ListChecks,
  CirclePoundSterling,
  Gauge,
  TrendingUp,
  FileText,
  BriefcaseBusiness,
  BarChart3,
  Milestone,
  Layers,
  Calendar,
  Bookmark,
  HardHat,
};