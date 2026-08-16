import type { ReactNode } from 'react';

export interface SearchResultItem {
  type: string;
  id: string;
  label: string;
  secondary: string;
  status: string | null;
  route: string;
  icon: string;
  updatedAt: string | null;
  rank: number;
  permission: string;
  metadata?: Record<string, string>;
}

export interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  category: 'navigate' | 'create' | 'action';
  icon: string;
  permission: string;
  execute?: () => void;
  route?: string;
}

export interface QuickCreateAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  permission: string;
  route: string;
}

export interface SearchModule {
  typeKey: string;
  label: string;
  icon: string;
  tableName: string;
  searchFields: string[];
  displayField: string;
  secondaryField?: string;
  statusField?: string;
  routePrefix: string;
  idField: string;
  updatedAtField?: string;
  permission: string;
  active: boolean;
}

const SEARCH_MODULES: SearchModule[] = [
  {
    typeKey: 'client',
    label: 'Clients',
    icon: 'ri-user-line',
    tableName: 'clients',
    searchFields: ['contact_name', 'company_name', 'email', 'phone', 'trading_name', 'client_reference', 'website'],
    displayField: 'company_name',
    secondaryField: 'company_name',
    statusField: 'status',
    routePrefix: '/admin/clients',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_clients',
    active: true,
  },
  {
    typeKey: 'lead',
    label: 'Leads',
    icon: 'ri-user-search-line',
    tableName: 'leads',
    searchFields: ['name', 'email', 'company_name', 'contact_name', 'lead_reference', 'website', 'phone', 'service_interest'],
    displayField: 'company_name',
    secondaryField: 'name',
    statusField: 'stage',
    routePrefix: '/admin/leads',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_leads',
    active: true,
  },
  {
    typeKey: 'project',
    label: 'Projects',
    icon: 'ri-folder-line',
    tableName: 'projects',
    searchFields: ['name', 'slug', 'project_reference', 'description', 'objective', 'project_type'],
    displayField: 'name',
    secondaryField: 'project_reference',
    statusField: 'status',
    routePrefix: '/admin/projects',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'milestone',
    label: 'Milestones',
    icon: 'ri-flag-line',
    tableName: 'milestones',
    searchFields: ['title', 'name'],
    displayField: 'title',
    statusField: 'status',
    routePrefix: '/admin/milestones',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'invoice',
    label: 'Invoices',
    icon: 'ri-bill-line',
    tableName: 'invoices',
    searchFields: ['invoice_number', 'description', 'client_notes', 'purchase_order_reference'],
    displayField: 'invoice_number',
    secondaryField: 'description',
    statusField: 'status',
    routePrefix: '/admin/invoices',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_finance',
    active: true,
  },
  {
    typeKey: 'uat_job',
    label: 'UAT Jobs',
    icon: 'ri-bug-line',
    tableName: 'uat_jobs',
    searchFields: ['title', 'description', 'reference'],
    displayField: 'title',
    secondaryField: 'reference',
    statusField: 'status',
    routePrefix: '/admin/uat/jobs',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_uat',
    active: true,
  },
  {
    typeKey: 'uat_feedback',
    label: 'UAT Feedback',
    icon: 'ri-feedback-line',
    tableName: 'uat_feedback',
    searchFields: ['title', 'description', 'reference'],
    displayField: 'title',
    secondaryField: 'reference',
    statusField: 'severity',
    routePrefix: '/admin/uat/feedback',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_uat',
    active: true,
  },
  {
    typeKey: 'uat_project',
    label: 'UAT Projects',
    icon: 'ri-folder-line',
    tableName: 'uat_projects',
    searchFields: ['name', 'reference', 'client_company', 'description'],
    displayField: 'name',
    secondaryField: 'reference',
    statusField: 'status',
    routePrefix: '/admin/uat/projects',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_uat',
    active: true,
  },
  {
    typeKey: 'submission',
    label: 'Submissions',
    icon: 'ri-mail-send-line',
    tableName: 'project_submissions',
    searchFields: ['name', 'email', 'project_type', 'initial_message'],
    displayField: 'name',
    secondaryField: 'email',
    statusField: 'status',
    routePrefix: '/admin/submissions',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_leads',
    active: true,
  },
  {
    typeKey: 'task',
    label: 'Tasks',
    icon: 'ri-task-line',
    tableName: 'project_tasks',
    searchFields: ['name', 'title', 'task_reference', 'description'],
    displayField: 'title',
    statusField: 'status',
    routePrefix: '/admin/tasks',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'notification',
    label: 'Notifications',
    icon: 'ri-notification-line',
    tableName: 'notifications',
    searchFields: ['title', 'message'],
    displayField: 'title',
    statusField: 'severity',
    routePrefix: '/admin/notifications',
    idField: 'id',
    updatedAtField: 'created_at',
    permission: 'notifications.view_own',
    active: true,
  },
  {
    typeKey: 'workflow',
    label: 'Workflows',
    icon: 'ri-git-branch-line',
    tableName: 'digital_footprint_n8n_agents',
    searchFields: ['workflow_name', 'description', 'runbook'],
    displayField: 'workflow_name',
    secondaryField: 'description',
    statusField: 'status',
    routePrefix: '/admin/automation',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'agent',
    label: 'AI Agents',
    icon: 'ri-robot-line',
    tableName: 'ai_agents',
    searchFields: ['name', 'purpose', 'reference'],
    displayField: 'name',
    secondaryField: 'purpose',
    statusField: 'status',
    routePrefix: '/admin/automation',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'uat_tester',
    label: 'UAT Testers',
    icon: 'ri-user-star-line',
    tableName: 'uat_testers',
    searchFields: ['full_name', 'email', 'reference', 'town_city'],
    displayField: 'full_name',
    secondaryField: 'reference',
    statusField: 'status',
    routePrefix: '/admin/uat/testers',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_uat',
    active: true,
  },
  {
    typeKey: 'uat_payment',
    label: 'UAT Payments',
    icon: 'ri-hand-coin-line',
    tableName: 'uat_payments',
    searchFields: ['payment_reference', 'idempotency_key', 'provider_payment_id'],
    displayField: 'payment_reference',
    statusField: 'eligibility_state',
    routePrefix: '/admin/uat/payments',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_uat',
    active: true,
  },
  {
    typeKey: 'staff',
    label: 'Staff',
    icon: 'ri-shield-user-line',
    tableName: 'admin_profiles',
    searchFields: ['full_name', 'email', 'reference', 'role', 'title'],
    displayField: 'full_name',
    secondaryField: 'reference',
    statusField: 'status',
    routePrefix: '/admin/staff',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'staff.view',
    active: true,
  },
  {
    typeKey: 'cms_page',
    label: 'CMS Pages',
    icon: 'ri-file-text-line',
    tableName: 'cms_pages',
    searchFields: ['title', 'slug', 'reference', 'seo_title', 'seo_description'],
    displayField: 'title',
    secondaryField: 'slug',
    statusField: 'editorial_status',
    routePrefix: '/admin/cms',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'cms_media',
    label: 'CMS Media',
    icon: 'ri-image-line',
    tableName: 'cms_media',
    searchFields: ['file_name', 'title', 'alt_text', 'caption'],
    displayField: 'file_name',
    statusField: 'classification',
    routePrefix: '/admin/cms',
    idField: 'id',
    updatedAtField: 'created_at',
    permission: 'search.view_projects',
    active: true,
  },
  {
    typeKey: 'pbx_tenant',
    label: 'PBX Tenants',
    icon: 'ri-building-line',
    tableName: 'pbx_tenants',
    searchFields: ['name', 'reference', 'country'],
    displayField: 'name',
    secondaryField: 'reference',
    statusField: 'commercial_status',
    routePrefix: '/admin/pbx/tenants',
    idField: 'id',
    updatedAtField: 'updated_at',
    permission: 'search.view_pbx',
    active: true,
  },
];

export const NAV_COMMANDS: CommandItem[] = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', keywords: ['dashboard', 'home', 'overview'], category: 'navigate', icon: 'ri-dashboard-line', permission: 'dashboard.view', route: '/admin' },
  { id: 'nav-leads', label: 'Go to CRM', keywords: ['leads', 'crm', 'pipeline', 'enquiries', 'sales', 'prospects'], category: 'navigate', icon: 'ri-user-search-line', permission: 'search.view_leads', route: '/admin/leads' },
  { id: 'nav-pipeline', label: 'Go to Pipeline', keywords: ['pipeline', 'kanban', 'sales', 'board', 'stages'], category: 'navigate', icon: 'ri-trello-line', permission: 'search.view_leads', route: '/admin/leads/pipeline' },
  { id: 'nav-clients', label: 'Go to Clients', keywords: ['clients', 'customers', 'accounts', 'client 360', 'accounts'], category: 'navigate', icon: 'ri-user-line', permission: 'search.view_clients', route: '/admin/clients' },
  { id: 'nav-projects', label: 'Go to Projects', keywords: ['projects', 'work', 'deliverables', 'command', 'workspace'], category: 'navigate', icon: 'ri-folder-line', permission: 'search.view_projects', route: '/admin/projects' },
  { id: 'nav-tasks', label: 'Go to Tasks', keywords: ['tasks', 'kanban', 'board', 'todos', 'my work', 'checklist'], category: 'navigate', icon: 'ri-task-line', permission: 'search.view_projects', route: '/admin/tasks' },
  { id: 'nav-milestones', label: 'Go to Milestones', keywords: ['milestones', 'phases', 'deadlines'], category: 'navigate', icon: 'ri-flag-line', permission: 'search.view_projects', route: '/admin/milestones' },
  { id: 'nav-invoices', label: 'Go to Invoices', keywords: ['invoices', 'billing', 'payments', 'finance'], category: 'navigate', icon: 'ri-bill-line', permission: 'search.view_finance', route: '/admin/invoices' },
  { id: 'nav-submissions', label: 'Go to Submissions', keywords: ['submissions', 'forms'], category: 'navigate', icon: 'ri-mail-send-line', permission: 'search.view_leads', route: '/admin/submissions' },
  { id: 'nav-command-centre', label: 'Go to Command Centre', keywords: ['command', 'operations', 'health', 'status'], category: 'navigate', icon: 'ri-shield-line', permission: 'command_centre.view', route: '/admin/command-centre' },
  { id: 'nav-uat', label: 'Go to UAT Control Room', keywords: ['uat', 'testing', 'qa', 'quality', 'feedback', 'triage', 'bugs', 'testers'], category: 'navigate', icon: 'ri-bug-line', permission: 'search.view_uat', route: '/admin/uat' },
  { id: 'nav-pbx', label: 'Go to PBX', keywords: ['pbx', 'phone', 'telephony', 'calls'], category: 'navigate', icon: 'ri-phone-line', permission: 'search.view_pbx', route: '/admin/pbx' },
  { id: 'nav-email-templates', label: 'Go to Email Templates', keywords: ['email', 'templates', 'messages'], category: 'navigate', icon: 'ri-mail-line', permission: 'dashboard.view', route: '/admin/email-templates' },
  { id: 'nav-diagnostics', label: 'Go to Diagnostics', keywords: ['diagnostics', 'health', 'status', 'check'], category: 'navigate', icon: 'ri-stethoscope-line', permission: 'dashboard.view', route: '/admin/diagnostics' },
  { id: 'nav-automation', label: 'Go to Automation Control Room', keywords: ['automation', 'n8n', 'workflows', 'agents', 'ai', 'webhooks', 'schedules'], category: 'navigate', icon: 'ri-git-branch-line', permission: 'dashboard.view', route: '/admin/automation' },
  { id: 'nav-cms', label: 'Go to CMS', keywords: ['cms', 'content', 'pages', 'media', 'navigation', 'seo', 'collections', 'blog'], category: 'navigate', icon: 'ri-palette-line', permission: 'dashboard.view', route: '/admin/cms' },
  { id: 'nav-staff', label: 'Go to Staff Administration', keywords: ['staff', 'team', 'roles', 'permissions', 'access', 'security', 'invitations', 'directory'], category: 'navigate', icon: 'ri-shield-user-line', permission: 'staff.view', route: '/admin/staff' },
];

export const QUICK_CREATE_ACTIONS: QuickCreateAction[] = [
  { id: 'create-lead', label: 'Create Lead', description: 'Add a new lead from enquiry', icon: 'ri-user-add-line', permission: 'quick_create.use', route: '/admin/leads' },
  { id: 'create-client', label: 'Create Client', description: 'Add a new client account', icon: 'ri-user-add-line', permission: 'quick_create.use', route: '/admin/clients' },
  { id: 'create-project', label: 'Create Project', description: 'Start a new project', icon: 'ri-folder-add-line', permission: 'quick_create.use', route: '/admin/projects' },
  { id: 'create-milestone', label: 'Create Milestone', description: 'Add a project milestone', icon: 'ri-flag-line', permission: 'quick_create.use', route: '/admin/milestones' },
  { id: 'create-invoice', label: 'Create Invoice', description: 'Issue a new invoice', icon: 'ri-bill-line', permission: 'quick_create.use', route: '/admin/invoices' },
  { id: 'create-uat-project', label: 'Create UAT Project', description: 'Start a new UAT project', icon: 'ri-folder-add-line', permission: 'quick_create.use', route: '/admin/uat/projects' },
  { id: 'create-uat-job', label: 'Create UAT Job', description: 'Post a new test job', icon: 'ri-briefcase-line', permission: 'quick_create.use', route: '/admin/uat/jobs/new' },
  { id: 'create-uat-env', label: 'Add UAT Environment', description: 'Register a test environment', icon: 'ri-server-line', permission: 'quick_create.use', route: '/admin/uat/environments' },
  { id: 'create-tester', label: 'Add Tester', description: 'Register a new tester profile', icon: 'ri-user-add-line', permission: 'quick_create.use', route: '/admin/uat/testers' },
  { id: 'rate-tester', label: 'Rate Tester', description: 'Submit a tester performance rating', icon: 'ri-star-line', permission: 'quick_create.use', route: '/admin/uat/ratings' },
  { id: 'issue-warning', label: 'Issue Tester Warning', description: 'Issue a warning or restriction', icon: 'ri-alert-line', permission: 'quick_create.use', route: '/admin/uat/testers' },
  { id: 'invite-staff', label: 'Invite Staff', description: 'Send a staff invitation', icon: 'ri-mail-send-line', permission: 'quick_create.use', route: '/admin/staff' },
  { id: 'create-team', label: 'Create Team', description: 'Create a new team', icon: 'ri-group-line', permission: 'quick_create.use', route: '/admin/staff' },
  { id: 'grant-temp-access', label: 'Grant Temporary Access', description: 'Grant time-limited access', icon: 'ri-timer-line', permission: 'quick_create.use', route: '/admin/staff' },
  { id: 'start-review', label: 'Start Access Review', description: 'Begin a periodic access review', icon: 'ri-file-search-line', permission: 'quick_create.use', route: '/admin/staff' },
];

export const ALL_COMMANDS: CommandItem[] = [
  ...NAV_COMMANDS,
  ...QUICK_CREATE_ACTIONS.map((qc): CommandItem => ({
    id: qc.id,
    label: qc.label,
    keywords: qc.label.toLowerCase().split(' '),
    category: 'create',
    icon: qc.icon,
    permission: qc.permission,
    route: qc.route,
  })),
];

const ICON_MAP: Record<string, string> = {
  'ri-user-line': 'Users',
  'ri-user-search-line': 'UserCircle',
  'ri-folder-line': 'FolderKanban',
  'ri-flag-line': 'Target',
  'ri-bill-line': 'FileText',
  'ri-bug-line': 'Bug',
  'ri-feedback-line': 'MessageSquare',
  'ri-mail-send-line': 'Sparkles',
  'ri-task-line': 'ListTodo',
  'ri-dashboard-line': 'LayoutDashboard',
  'ri-shield-line': 'Shield',
  'ri-phone-line': 'Phone',
  'ri-mail-line': 'Mail',
  'ri-stethoscope-line': 'Stethoscope',
  'ri-user-add-line': 'UserPlus',
  'ri-folder-add-line': 'FolderPlus',
};

export function getLucideIcon(riIcon: string): string {
  return ICON_MAP[riIcon] || 'Search';
}

export function getSearchModules(): SearchModule[] {
  return SEARCH_MODULES.filter((m) => m.active);
}

export function getCommands(): CommandItem[] {
  return ALL_COMMANDS;
}

export function getQuickCreateActions(): QuickCreateAction[] {
  return QUICK_CREATE_ACTIONS;
}