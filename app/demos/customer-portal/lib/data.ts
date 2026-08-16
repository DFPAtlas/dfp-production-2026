import {
  Milestone,
  PortalFile,
  PortalMessage,
  Invoice,
  ActivityEvent,
  TeamMember,
  TourStep,
  NotificationItem,
  ProjectStats,
} from './types';

export const projectStats: ProjectStats = {
  progress: 78,
  daysRemaining: 12,
  nextApproval: 'Dashboard',
  health: 'On Track',
  totalValue: 18400,
  paidToDate: 11600,
  remaining: 6800,
};

export const milestones: Milestone[] = [
  {
    id: 'discovery',
    title: 'Discovery',
    status: 'Complete',
    date: 'Completed 8 Jul 2026',
    description: 'Business goals, user journeys and technical scope agreed with the client.',
    stageLabel: 'Discovery',
  },
  {
    id: 'design',
    title: 'UX & Design',
    status: 'Complete',
    date: 'Completed 18 Jul 2026',
    description: 'Wireframes, visual concepts and design system approved.',
    stageLabel: 'Design',
  },
  {
    id: 'build',
    title: 'Core Build',
    status: 'Complete',
    date: 'Completed 29 Jul 2026',
    description: 'Frontend, CMS integration and core application features delivered.',
    stageLabel: 'Build',
  },
  {
    id: 'review',
    title: 'Client Review',
    status: 'Current',
    date: 'In progress',
    description: 'Final dashboard design awaiting client approval before launch preparation.',
    stageLabel: 'Review',
  },
  {
    id: 'launch',
    title: 'Launch',
    status: 'Upcoming',
    date: '28 Aug 2026',
    description: 'Production deployment, final testing and go-live support.',
    stageLabel: 'Launch',
  },
];

export const initialFiles: PortalFile[] = [
  {
    id: 'brief',
    name: 'Project brief.pdf',
    type: 'PDF',
    size: '1.8 MB',
    uploadedBy: 'Amelia Hart',
    date: '8 Jul 2026',
    category: 'Documents',
    status: 'Approved',
  },
  {
    id: 'wireframes',
    name: 'Approved wireframes.pdf',
    type: 'PDF',
    size: '4.2 MB',
    uploadedBy: 'Amelia Hart',
    date: '18 Jul 2026',
    category: 'Design',
    status: 'Approved',
  },
  {
    id: 'copy',
    name: 'Homepage copy.docx',
    type: 'DOCX',
    size: '620 KB',
    uploadedBy: 'Aster & Co.',
    date: '23 Jul 2026',
    category: 'Documents',
    status: 'Approved',
  },
  {
    id: 'design',
    name: 'Dashboard prototype v3.pdf',
    type: 'PDF',
    size: '8.1 MB',
    uploadedBy: 'Amelia Hart',
    date: '7 Aug 2026',
    category: 'Design',
    status: 'Needs Review',
  },
  {
    id: 'brand',
    name: 'Brand assets.zip',
    type: 'ZIP',
    size: '12.4 MB',
    uploadedBy: 'Sophie Reed',
    date: '25 Jul 2026',
    category: 'Design',
    status: 'Approved',
  },
  {
    id: 'invoice-003',
    name: 'Invoice-003.pdf',
    type: 'PDF',
    size: '180 KB',
    uploadedBy: 'Amelia Hart',
    date: '1 Aug 2026',
    category: 'Invoices',
    status: 'Pending',
  },
];

export const initialMessages: PortalMessage[] = [
  {
    id: 'm1',
    author: 'Amelia Hart',
    role: 'Project Manager',
    body: 'Hi Daniel, the final dashboard prototype is ready for your review. I have simplified the navigation and increased the contrast on the key metrics cards. Let me know what you think.',
    time: 'Today, 10:14',
    client: false,
    avatar: 'AH',
  },
  {
    id: 'm2',
    author: 'Daniel Price',
    role: 'Client',
    body: 'Thanks Amelia. The layout looks much clearer. I will review it this afternoon and get back to you.',
    time: 'Today, 10:46',
    client: true,
    avatar: 'DP',
  },
  {
    id: 'm3',
    author: 'Chris Morgan',
    role: 'Development',
    body: 'Once the dashboard is approved, I can begin the final CMS integration and performance optimisation. Everything is lined up on our side.',
    time: 'Today, 11:05',
    client: false,
    avatar: 'CM',
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'deposit',
    label: 'Deposit',
    amount: 4800,
    due: 'Paid 8 Jul 2026',
    status: 'Paid',
    description: 'Initial deposit covering discovery, planning and design commencement.',
    milestone: 'Discovery',
  },
  {
    id: 'design-milestone',
    label: 'Design milestone',
    amount: 3400,
    due: 'Paid 18 Jul 2026',
    status: 'Paid',
    description: 'Payment for completed UX and visual design phase.',
    milestone: 'UX & Design',
  },
  {
    id: 'build-milestone',
    label: 'Build milestone',
    amount: 3400,
    due: 'Paid 29 Jul 2026',
    status: 'Paid',
    description: 'Payment for core application build and CMS integration.',
    milestone: 'Core Build',
  },
  {
    id: 'final',
    label: 'Final milestone',
    amount: 6800,
    due: 'Due after approval',
    status: 'Scheduled',
    description: 'Final balance covering testing, deployment and launch support.',
    milestone: 'Launch',
  },
];

export const initialActivity: ActivityEvent[] = [
  {
    id: 'a1',
    time: 'Today, 10:42',
    label: 'Dashboard prototype ready for review',
    detail: 'Amelia uploaded the final dashboard prototype v3',
    type: 'file',
  },
  {
    id: 'a2',
    time: 'Yesterday, 16:30',
    label: 'Homepage build completed',
    detail: 'Core build milestone reached',
    type: 'milestone',
  },
  {
    id: 'a3',
    time: '7 Aug, 14:18',
    label: 'New design files uploaded',
    detail: 'Brand assets and wireframes added to project files',
    type: 'file',
  },
  {
    id: 'a4',
    time: '6 Aug, 11:05',
    label: 'Build milestone completed',
    detail: 'Core application build signed off by Digital Footprint',
    type: 'milestone',
  },
  {
    id: 'a5',
    time: '1 Aug, 09:20',
    label: 'Build milestone invoice issued',
    detail: 'Invoice-003 for £3,400',
    type: 'payment',
  },
];

export const teamMembers: TeamMember[] = [
  { name: 'Amelia Hart', role: 'Project Manager', initials: 'AH' },
  { name: 'Chris Morgan', role: 'Development', initials: 'CM' },
  { name: 'Sophie Reed', role: 'UX Design', initials: 'SR' },
];

export const tourSteps: TourStep[] = [
  {
    view: 'overview',
    title: 'Check your project',
    instruction: 'See progress, status and what happens next.',
  },
  {
    view: 'milestones',
    title: 'Review a milestone',
    instruction: 'Follow the project journey without chasing updates.',
  },
  {
    view: 'approvals',
    title: 'Approve your work',
    instruction: 'See how client approvals keep delivery moving.',
  },
  {
    view: 'messages',
    title: 'Send a message',
    instruction: 'Keep project communication in one place.',
  },
  {
    view: 'files',
    title: 'Find your files',
    instruction: 'Access project documents whenever you need them.',
  },
  {
    view: 'billing',
    title: 'Understand payments',
    instruction: 'Know what is paid, outstanding and coming next.',
  },
];

export const initialNotifications: NotificationItem[] = [
  { id: 'n1', message: 'Dashboard ready for approval', time: '10m ago', read: false },
  { id: 'n2', message: 'New project file added', time: '2h ago', read: false },
  { id: 'n3', message: 'Build milestone completed', time: '1d ago', read: true },
];