export interface MetricDefinition {
  key: string;
  label: string;
  businessMeaning: string;
  sourceTable: string;
  dateField: string | null;
  includedStatuses: string[];
  excludedStatuses: string[];
  currencyStorage: 'gbp_pence' | 'gbp_pounds' | 'none';
  scope: 'organisation' | 'user' | 'none';
  permissionKey: string;
  emptyBehaviour: string;
  errorBehaviour: string;
  linkHref: string;
}

export const DASHBOARD_METRICS: Record<string, MetricDefinition> = {
  paidRevenue: {
    key: 'paidRevenue',
    label: 'Paid Revenue',
    businessMeaning: 'Total value of invoices marked as paid within the selected date range. Based on paid_at date.',
    sourceTable: 'invoices',
    dateField: 'paid_at',
    includedStatuses: ['paid'],
    excludedStatuses: [],
    currencyStorage: 'gbp_pounds',
    scope: 'organisation',
    permissionKey: 'finance.view',
    emptyBehaviour: 'Show £0 with "No payments in this period"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/invoices',
  },
  outstandingInvoices: {
    key: 'outstandingInvoices',
    label: 'Outstanding Invoices',
    businessMeaning: 'Total value of invoices with status pending or overdue (not paid, not cancelled). Current state — not affected by date range.',
    sourceTable: 'invoices',
    dateField: null,
    includedStatuses: ['pending', 'overdue'],
    excludedStatuses: ['paid', 'cancelled', 'draft'],
    currencyStorage: 'gbp_pounds',
    scope: 'organisation',
    permissionKey: 'finance.view',
    emptyBehaviour: 'Show £0 with "No outstanding invoices"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/invoices',
  },
  activeProjects: {
    key: 'activeProjects',
    label: 'Active Projects',
    businessMeaning: 'Count of projects with status active. Current state — not affected by date range.',
    sourceTable: 'projects',
    dateField: null,
    includedStatuses: ['active'],
    excludedStatuses: ['completed', 'cancelled', 'on_hold', 'archived'],
    currencyStorage: 'none',
    scope: 'organisation',
    permissionKey: 'projects.view',
    emptyBehaviour: 'Show 0 with "No active projects"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/projects',
  },
  projectsAtRisk: {
    key: 'projectsAtRisk',
    label: 'Projects at Risk',
    businessMeaning: 'Count of projects with status at_risk or projects with overdue milestones or critical unresolved alerts.',
    sourceTable: 'projects',
    dateField: null,
    includedStatuses: ['at_risk'],
    excludedStatuses: [],
    currencyStorage: 'none',
    scope: 'organisation',
    permissionKey: 'projects.view',
    emptyBehaviour: 'Show 0 with "No projects at risk"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/projects',
  },
  newLeads: {
    key: 'newLeads',
    label: 'New Leads',
    businessMeaning: 'Count of leads created within the selected date range. Based on created_at date.',
    sourceTable: 'leads',
    dateField: 'created_at',
    includedStatuses: [],
    excludedStatuses: ['spam', 'archived'],
    currencyStorage: 'none',
    scope: 'organisation',
    permissionKey: 'leads.view',
    emptyBehaviour: 'Show 0 with "No new leads in this period"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/leads',
  },
  openCriticalAlerts: {
    key: 'openCriticalAlerts',
    label: 'Open Critical Alerts',
    businessMeaning: 'Count of unresolved alerts with alert_type critical. Current state — not affected by date range.',
    sourceTable: 'digital_footprint_alerts',
    dateField: null,
    includedStatuses: [],
    excludedStatuses: [],
    currencyStorage: 'none',
    scope: 'organisation',
    permissionKey: 'command_centre.view',
    emptyBehaviour: 'Show 0 with "No critical alerts"',
    errorBehaviour: 'Show "Unavailable" with retry option',
    linkHref: '/admin/command-centre/alerts',
  },
};

export type DateRangePreset = 'today' | '7days' | '30days' | 'thisMonth' | 'prevMonth' | 'thisQuarter' | 'thisYear' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  start: Date;
  end: Date;
  label: string;
}

export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let start: Date;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { preset, start, end, label: 'Today' };
    case '7days':
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { preset, start, end, label: 'Last 7 Days' };
    case '30days':
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { preset, start, end, label: 'Last 30 Days' };
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { preset, start, end, label: 'This Month' };
    case 'prevMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { preset, start, end: prevEnd, label: 'Previous Month' };
    case 'thisQuarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStart, 1, 0, 0, 0, 0);
      return { preset, start, end, label: 'This Quarter' };
    }
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { preset, start, end, label: 'This Year' };
    case 'custom':
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { preset, start, end, label: 'Custom Range' };
    default:
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { preset, start, end, label: 'Last 30 Days' };
  }
}