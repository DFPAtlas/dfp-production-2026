export interface Demo {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  headline: string;
  description: string;
  href: string;
  duration: string;
  badge: string;
  category: 'Operations' | 'AI & Sales' | 'Customer Experience' | 'Marketplaces' | 'Property' | 'Events';
  accent: 'cyan' | 'orange' | 'violet' | 'emerald' | 'amber' | 'rose';
  features: string[];
  outcome: string;
  previewType: 'command' | 'sales' | 'portal' | 'security' | 'property' | 'events';
  status: 'Interactive' | 'Guided Experience' | 'Product Preview';
  flagship: boolean;
  teaserStats: { label: string; value: string; trend?: string }[];
}

export const allDemos: Demo[] = [
  {
    id: 'business-command-centre',
    number: '01',
    title: 'Business Command Centre',
    shortTitle: 'Command Centre',
    subtitle: 'Run your whole business from one clear view.',
    headline: 'Know what needs attention.',
    description:
      'See projects, team capacity, tasks, finance and business health from one place.',
    href: '/demos/business-command-centre',
    duration: '3–5 minutes',
    badge: 'Operations platform',
    category: 'Operations',
    accent: 'cyan',
    features: [
      'Projects',
      'People',
      'Finance',
      'Tasks',
      'Automation',
    ],
    outcome: 'Replace disconnected spreadsheets, admin and reporting with one operational command centre.',
    previewType: 'command',
    status: 'Interactive',
    flagship: true,
    teaserStats: [
      { label: 'Revenue YTD', value: '£24.8M', trend: '+18.8%' },
      { label: 'Active Projects', value: '18', trend: '14 live' },
      { label: 'Team Capacity', value: '76%', trend: 'Healthy' },
    ],
  },
  {
    id: 'ai-lead-system',
    number: '02',
    title: 'AI Lead & Sales System',
    shortTitle: 'AI Sales',
    subtitle: 'Watch a lead become an opportunity.',
    headline: 'Watch a lead become an opportunity.',
    description:
      'See AI-assisted research, qualification, response preparation and sales workflow with human approval.',
    href: '/demos/ai-lead-system',
    duration: '4–6 minutes',
    badge: 'AI + Sales',
    category: 'AI & Sales',
    accent: 'orange',
    features: [
      'AI lead research',
      'Qualification scoring',
      'Response generation',
      'Pipeline management',
    ],
    outcome: 'See how AI can qualify, respond and prepare opportunities while keeping a human in control.',
    previewType: 'sales',
    status: 'Interactive',
    flagship: true,
    teaserStats: [
      { label: 'Pipeline Value', value: '£342k', trend: '+24%' },
      { label: 'Lead Score', value: '92/100', trend: 'High fit' },
      { label: 'Response Time', value: '4.2m', trend: 'AI assisted' },
    ],
  },
  {
    id: 'customer-portal',
    number: '03',
    title: 'Customer Project Portal',
    shortTitle: 'Customer Portal',
    subtitle: 'See your business through your customer\'s eyes.',
    headline: 'See your business through your customer\'s eyes.',
    description:
      'Track projects, approvals, files, messages and payments from one premium client portal.',
    href: '/demos/customer-portal',
    duration: '3–5 minutes',
    badge: 'Client experience',
    category: 'Customer Experience',
    accent: 'violet',
    features: [
      'Project tracking',
      'Design approvals',
      'File sharing',
      'Messages',
      'Invoice schedule',
    ],
    outcome: 'Give customers one calm, professional place to follow everything happening with their project.',
    previewType: 'portal',
    status: 'Interactive',
    flagship: true,
    teaserStats: [
      { label: 'Project Phase', value: '3 of 5', trend: 'On track' },
      { label: 'Completion', value: '68%', trend: 'Ahead' },
      { label: 'Next Milestone', value: '14 Aug', trend: 'Design sign-off' },
    ],
  },
  {
    id: 'quickguard',
    number: '04',
    title: 'QuickGuard',
    shortTitle: 'QuickGuard',
    subtitle: 'Experience both sides of a marketplace.',
    headline: 'Experience both sides of a marketplace.',
    description:
      'Create a security job, match guards and follow the complete booking lifecycle.',
    href: '/demos/quickguard-walkthrough',
    duration: '3 minutes',
    badge: 'Marketplace',
    category: 'Marketplaces',
    accent: 'emerald',
    features: [
      'Job creation',
      'Guard matching',
      'Booking lifecycle',
      'Payment flow',
      'Ratings',
    ],
    outcome: 'See a complete two-sided marketplace — from job creation through to completion and payment.',
    previewType: 'security',
    status: 'Guided Experience',
    flagship: false,
    teaserStats: [
      { label: 'Guards Online', value: '6', trend: 'Available now' },
      { label: 'Avg Response', value: '2.4m', trend: 'Fast match' },
      { label: 'Jobs Today', value: '14', trend: 'Active' },
    ],
  },
  {
    id: 'guardianhub',
    number: '05',
    title: 'GuardianHub',
    shortTitle: 'GuardianHub',
    subtitle: 'Run security operations from one control room.',
    headline: 'Run security operations from one control room.',
    description:
      'See how sites, guards, incidents, patrols and compliance can work together.',
    href: '/demos/guardianhub-preview',
    duration: '2–3 minutes',
    badge: 'Operations',
    category: 'Operations',
    accent: 'cyan',
    features: [
      'Site management',
      'Guard deployment',
      'Incident logging',
      'Patrol tracking',
      'Compliance records',
    ],
    outcome: 'Turn security operations into a live, accountable system your clients can see and trust.',
    previewType: 'security',
    status: 'Product Preview',
    flagship: false,
    teaserStats: [
      { label: 'Active Sites', value: '24', trend: 'Monitored' },
      { label: 'Guards On Duty', value: '18', trend: 'Across 3 regions' },
      { label: 'Incidents Today', value: '2', trend: 'Resolved' },
    ],
  },
  {
    id: 'lethub',
    number: '06',
    title: 'LetHub',
    shortTitle: 'LetHub',
    subtitle: 'Make property operations easier to control.',
    headline: 'Make property operations easier to control.',
    description:
      'Explore a modern landlord and lettings management experience.',
    href: '/demos/lethub-lettings-tour',
    duration: '2–3 minutes',
    badge: 'Property',
    category: 'Property',
    accent: 'amber',
    features: [
      'Property listings',
      'Tenant applications',
      'Maintenance tracking',
      'Rent management',
    ],
    outcome: 'Replace scattered property spreadsheets with one connected lettings platform.',
    previewType: 'property',
    status: 'Product Preview',
    flagship: false,
    teaserStats: [
      { label: 'Properties', value: '42', trend: 'Active' },
      { label: 'Tenants', value: '38', trend: 'Current' },
      { label: 'Rent Collected', value: '97%', trend: 'On time' },
    ],
  },
  {
    id: 'synqoro',
    number: '07',
    title: 'Synqoro',
    shortTitle: 'Synqoro',
    subtitle: 'Bring event operations together.',
    headline: 'Bring event operations together.',
    description:
      'Explore an event-management platform designed around planning and coordination.',
    href: '/demos/synqoro-event-demo',
    duration: '2–3 minutes',
    badge: 'Events',
    category: 'Events',
    accent: 'rose',
    features: [
      'Venue management',
      'Guest coordination',
      'Schedule planning',
      'Supplier tracking',
    ],
    outcome: 'Give event teams a single source of truth from planning through to the day itself.',
    previewType: 'events',
    status: 'Product Preview',
    flagship: false,
    teaserStats: [
      { label: 'Guests', value: '340', trend: 'Confirmed' },
      { label: 'Vendors', value: '12', trend: 'Booked' },
      { label: 'Tasks Done', value: '86%', trend: 'On schedule' },
    ],
  },
];

export const flagshipDemos = allDemos.filter((d) => d.flagship);
export const libraryDemos = allDemos;

export const categoryFilterLabels: { key: string; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Operations', label: 'Operations' },
  { key: 'AI & Sales', label: 'AI & Sales' },
  { key: 'Customer Experience', label: 'Customer Experience' },
  { key: 'Marketplaces', label: 'Marketplaces' },
  { key: 'Property', label: 'Property' },
  { key: 'Events', label: 'Events' },
];

export const accentMap: Record<
  Demo['accent'],
  {
    badge: string;
    icon: string;
    ring: string;
    glow: string;
    button: string;
    buttonHover: string;
    text: string;
    bar: string;
    previewBg: string;
    previewBorder: string;
    previewHighlight: string;
    cardBorder: string;
    cardHover: string;
  }
> = {
  cyan: {
    badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
    icon: 'bg-cyan-300/10 text-cyan-200',
    ring: 'ring-cyan-300/20',
    glow: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
    button: 'bg-cyan-300 text-slate-950',
    buttonHover: 'hover:bg-cyan-200',
    text: 'text-cyan-200',
    bar: 'bg-cyan-300',
    previewBg: 'bg-cyan-300/[0.04]',
    previewBorder: 'border-cyan-300/15',
    previewHighlight: 'bg-cyan-300/20',
    cardBorder: 'border-cyan-300/15',
    cardHover: 'hover:border-cyan-300/30',
  },
  orange: {
    badge: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
    icon: 'bg-orange-300/10 text-orange-200',
    ring: 'ring-orange-300/20',
    glow: 'from-orange-400/20 via-orange-400/5 to-transparent',
    button: 'bg-orange-300 text-slate-950',
    buttonHover: 'hover:bg-orange-200',
    text: 'text-orange-200',
    bar: 'bg-orange-300',
    previewBg: 'bg-orange-300/[0.04]',
    previewBorder: 'border-orange-300/15',
    previewHighlight: 'bg-orange-300/20',
    cardBorder: 'border-orange-300/15',
    cardHover: 'hover:border-orange-300/30',
  },
  violet: {
    badge: 'border-violet-300/20 bg-violet-300/10 text-violet-200',
    icon: 'bg-violet-300/10 text-violet-200',
    ring: 'ring-violet-300/20',
    glow: 'from-violet-400/20 via-violet-400/5 to-transparent',
    button: 'bg-violet-300 text-slate-950',
    buttonHover: 'hover:bg-violet-200',
    text: 'text-violet-200',
    bar: 'bg-violet-300',
    previewBg: 'bg-violet-300/[0.04]',
    previewBorder: 'border-violet-300/15',
    previewHighlight: 'bg-violet-300/20',
    cardBorder: 'border-violet-300/15',
    cardHover: 'hover:border-violet-300/30',
  },
  emerald: {
    badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    icon: 'bg-emerald-300/10 text-emerald-200',
    ring: 'ring-emerald-300/20',
    glow: 'from-emerald-400/20 via-emerald-400/5 to-transparent',
    button: 'bg-emerald-300 text-slate-950',
    buttonHover: 'hover:bg-emerald-200',
    text: 'text-emerald-200',
    bar: 'bg-emerald-300',
    previewBg: 'bg-emerald-300/[0.04]',
    previewBorder: 'border-emerald-300/15',
    previewHighlight: 'bg-emerald-300/20',
    cardBorder: 'border-emerald-300/15',
    cardHover: 'hover:border-emerald-300/30',
  },
  amber: {
    badge: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
    icon: 'bg-amber-300/10 text-amber-200',
    ring: 'ring-amber-300/20',
    glow: 'from-amber-400/20 via-amber-400/5 to-transparent',
    button: 'bg-amber-300 text-slate-950',
    buttonHover: 'hover:bg-amber-200',
    text: 'text-amber-200',
    bar: 'bg-amber-300',
    previewBg: 'bg-amber-300/[0.04]',
    previewBorder: 'border-amber-300/15',
    previewHighlight: 'bg-amber-300/20',
    cardBorder: 'border-amber-300/15',
    cardHover: 'hover:border-amber-300/30',
  },
  rose: {
    badge: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
    icon: 'bg-rose-300/10 text-rose-200',
    ring: 'ring-rose-300/20',
    glow: 'from-rose-400/20 via-rose-400/5 to-transparent',
    button: 'bg-rose-300 text-slate-950',
    buttonHover: 'hover:bg-rose-200',
    text: 'text-rose-200',
    bar: 'bg-rose-300',
    previewBg: 'bg-rose-300/[0.04]',
    previewBorder: 'border-rose-300/15',
    previewHighlight: 'bg-rose-300/20',
    cardBorder: 'border-rose-300/15',
    cardHover: 'hover:border-rose-300/30',
  },
};

export const businessNeeds = [
  {
    id: 'run-business',
    label: 'Run my business better',
    icon: 'ri-dashboard-line',
    recommendations: ['business-command-centre', 'guardianhub'],
  },
  {
    id: 'get-customers',
    label: 'Get more customers',
    icon: 'ri-flashlight-line',
    recommendations: ['ai-lead-system'],
  },
  {
    id: 'improve-experience',
    label: 'Improve customer experience',
    icon: 'ri-customer-service-line',
    recommendations: ['customer-portal'],
  },
  {
    id: 'manage-staff',
    label: 'Manage staff',
    icon: 'ri-team-line',
    recommendations: ['business-command-centre', 'guardianhub'],
  },
  {
    id: 'automate',
    label: 'Automate repetitive work',
    icon: 'ri-robot-2-line',
    recommendations: ['ai-lead-system'],
  },
  {
    id: 'build-marketplace',
    label: 'Build a marketplace',
    icon: 'ri-store-2-line',
    recommendations: ['quickguard'],
  },
  {
    id: 'manage-properties',
    label: 'Manage properties',
    icon: 'ri-building-line',
    recommendations: ['lethub'],
  },
  {
    id: 'build-saas',
    label: 'Build my own SaaS',
    icon: 'ri-rocket-line',
    recommendations: ['business-command-centre'],
  },
  {
    id: 'bespoke',
    label: 'Something bespoke',
    icon: 'ri-lightbulb-line',
    recommendations: [],
  },
];

export const capabilityLabels = [
  'Web Apps',
  'Customer Portals',
  'Staff Systems',
  'AI Workflows',
  'Automation',
  'Payments',
  'CRM',
  'Messaging',
  'Reporting',
  'Bookings',
  'Marketplaces',
  'Dashboards',
  'Integrations',
];

export const systemModules = [
  { id: 'command', label: 'Command Centre', icon: 'ri-dashboard-line', color: 'cyan' },
  { id: 'sales', label: 'AI Sales', icon: 'ri-brain-line', color: 'orange' },
  { id: 'portal', label: 'Customer Portal', icon: 'ri-customer-service-line', color: 'violet' },
  { id: 'payments', label: 'Payments', icon: 'ri-wallet-line', color: 'amber' },
  { id: 'automation', label: 'Automation', icon: 'ri-robot-2-line', color: 'emerald' },
  { id: 'staff', label: 'Staff Management', icon: 'ri-team-line', color: 'rose' },
  { id: 'crm', label: 'CRM', icon: 'ri-contacts-line', color: 'orange' },
  { id: 'files', label: 'Files', icon: 'ri-folder-line', color: 'cyan' },
  { id: 'bookings', label: 'Bookings', icon: 'ri-calendar-check-line', color: 'violet' },
];