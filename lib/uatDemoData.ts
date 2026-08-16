import type { LucideIcon } from 'lucide-react';
import {
  Bug,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Laptop,
  MessageCircle,
  MonitorSmartphone,
  Smartphone,
  TabletSmartphone,
  WalletCards,
} from 'lucide-react';

export type DemoAssignment = {
  id: string;
  title: string;
  project: string;
  summary: string;
  device: string;
  duration: string;
  reward: string;
  deadline: string;
  difficulty: 'Starter' | 'Intermediate' | 'Advanced';
  status: 'Available' | 'In progress' | 'Completed';
  icon: LucideIcon;
  checklist: string[];
};

export type DemoReport = {
  id: string;
  title: string;
  assignment: string;
  submitted: string;
  severity: 'Minor' | 'Medium' | 'Major' | 'Critical';
  status: 'Pending review' | 'Approved' | 'Duplicate' | 'Needs evidence';
  reward: string;
};

export type DemoPayment = {
  id: string;
  description: string;
  date: string;
  type: 'Reward' | 'Assignment' | 'Payout';
  amount: string;
  status: 'Approved' | 'Pending' | 'Paid';
};

export type DemoMessage = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

export const demoAssignments: DemoAssignment[] = [
  {
    id: 'UAT-204',
    title: 'E-commerce Checkout Flow',
    project: 'DFP Commerce Demo',
    summary: 'Test basket changes, delivery options, discount codes and the complete checkout journey.',
    device: 'Desktop + mobile',
    duration: '60 mins',
    reward: '£30',
    deadline: '3 days remaining',
    difficulty: 'Intermediate',
    status: 'Available',
    icon: MonitorSmartphone,
    checklist: ['Add and remove products', 'Try a valid and invalid discount code', 'Change delivery method', 'Complete the sample checkout'],
  },
  {
    id: 'UAT-205',
    title: 'Mobile Sign-up & Forms',
    project: 'Customer App Demo',
    summary: 'Review registration, password guidance, profile details and form error messages.',
    device: 'Mobile',
    duration: '45 mins',
    reward: '£20',
    deadline: '5 days remaining',
    difficulty: 'Starter',
    status: 'Available',
    icon: Smartphone,
    checklist: ['Create a sample account', 'Test weak password guidance', 'Submit incomplete forms', 'Check confirmation messaging'],
  },
  {
    id: 'UAT-206',
    title: 'Client Portal Dashboard',
    project: 'Digital Footprint Portal',
    summary: 'Check navigation, cards, filters and responsive behaviour across the client dashboard.',
    device: 'Desktop + tablet',
    duration: '75 mins',
    reward: '£35',
    deadline: '7 days remaining',
    difficulty: 'Advanced',
    status: 'In progress',
    icon: Laptop,
    checklist: ['Open every navigation route', 'Test filters and empty states', 'Resize the browser', 'Record any confusing wording'],
  },
  {
    id: 'UAT-199',
    title: 'Feedback Widget & Chat',
    project: 'Support Tools Demo',
    summary: 'Test the feedback widget, attachment controls and support conversation layout.',
    device: 'Tablet + mobile',
    duration: '35 mins',
    reward: '£15',
    deadline: 'Completed sample',
    difficulty: 'Starter',
    status: 'Completed',
    icon: TabletSmartphone,
    checklist: ['Open the widget', 'Submit feedback', 'Attach a sample image', 'Review the success state'],
  },
];

export const demoReports: DemoReport[] = [
  { id: 'BUG-1042', title: 'Payment option fails to load', assignment: 'E-commerce Checkout Flow', submitted: '28 Jul 2026', severity: 'Major', status: 'Pending review', reward: '—' },
  { id: 'BUG-1037', title: 'Email validation message is unclear', assignment: 'Mobile Sign-up & Forms', submitted: '26 Jul 2026', severity: 'Medium', status: 'Approved', reward: '£10' },
  { id: 'BUG-1031', title: 'Dashboard chart overlaps on tablet', assignment: 'Client Portal Dashboard', submitted: '24 Jul 2026', severity: 'Medium', status: 'Duplicate', reward: '—' },
  { id: 'BUG-1026', title: 'Attachment button has no visible focus state', assignment: 'Feedback Widget & Chat', submitted: '22 Jul 2026', severity: 'Minor', status: 'Approved', reward: '£5' },
  { id: 'BUG-1021', title: 'Checkout error cannot be reproduced', assignment: 'E-commerce Checkout Flow', submitted: '20 Jul 2026', severity: 'Major', status: 'Needs evidence', reward: '—' },
];

export const demoPayments: DemoPayment[] = [
  { id: 'PAY-405', description: 'Approved bug BUG-1037', date: '26 Jul 2026', type: 'Reward', amount: '+£10.00', status: 'Approved' },
  { id: 'PAY-401', description: 'Feedback Widget assignment', date: '23 Jul 2026', type: 'Assignment', amount: '+£15.00', status: 'Approved' },
  { id: 'PAY-397', description: 'Approved bug BUG-1026', date: '22 Jul 2026', type: 'Reward', amount: '+£5.00', status: 'Approved' },
  { id: 'PAY-390', description: 'Example payout', date: '15 Jul 2026', type: 'Payout', amount: '-£50.00', status: 'Paid' },
  { id: 'PAY-386', description: 'Client Portal assignment', date: '12 Jul 2026', type: 'Assignment', amount: '+£35.00', status: 'Approved' },
];

export const demoMessages: DemoMessage[] = [
  { id: 'MSG-88', sender: 'DFP UAT Team', subject: 'New checkout assignment available', preview: 'A new test matching your desktop and mobile devices is ready to preview.', time: '10:24', unread: true },
  { id: 'MSG-87', sender: 'Project Reviewer', subject: 'More evidence requested for BUG-1021', preview: 'Please add the browser version and a short screen recording showing the issue.', time: 'Yesterday', unread: true },
  { id: 'MSG-83', sender: 'DFP Payments', subject: 'Sample payment summary', preview: 'Your preview payment statement has been updated with approved rewards.', time: '24 Jul', unread: false },
  { id: 'MSG-79', sender: 'DFP UAT Team', subject: 'How to write a strong bug report', preview: 'Use clear steps, expected results, actual results and supporting evidence.', time: '20 Jul', unread: false },
];

export const dashboardStats = [
  { label: 'Available tests', value: '5', note: 'Sample assignments', icon: FileCheck2 },
  { label: 'Submitted reports', value: '12', note: 'Example history', icon: Bug },
  { label: 'Approved bugs', value: '7', note: 'Example result', icon: CheckCircle2 },
  { label: 'Example balance', value: '£68.50', note: 'Not a real balance', icon: WalletCards },
];

export const demoResources = [
  { title: 'Getting started with UAT', description: 'A simple introduction to test assignments, evidence and deadlines.', icon: FileCheck2, readingTime: '6 min read' },
  { title: 'How to report a useful bug', description: 'Learn how to write reproducible steps and explain expected versus actual results.', icon: Bug, readingTime: '8 min read' },
  { title: 'Understanding tester rewards', description: 'See how assignment fees and qualifying bug rewards are reviewed.', icon: CircleDollarSign, readingTime: '5 min read' },
  { title: 'Communicating with the project team', description: 'Keep questions and assignment updates clear and professional.', icon: MessageCircle, readingTime: '4 min read' },
];
