import type { GuardProfile, DemoJob, JobActivity, SecurityType } from './types';

export const DEMO_CLIENT = {
  businessName: 'Hawthorne Events Ltd.',
  contactName: 'James',
  greeting: 'Good afternoon, James.',
};

export const DEMO_GUARD: GuardProfile = {
  id: 'guard-marcus',
  name: 'Marcus Reed',
  role: 'Door Supervisor',
  rating: 4.9,
  completedJobs: 124,
  distance: 2.8,
  verified: true,
  initials: 'MR',
  accepted: false,
  checkedIn: false,
};

export const SECOND_GUARD: GuardProfile = {
  id: 'guard-aisha',
  name: 'Aisha Khan',
  role: 'Door Supervisor',
  rating: 4.8,
  completedJobs: 87,
  distance: 4.1,
  verified: true,
  initials: 'AK',
  accepted: false,
  checkedIn: false,
};

export const AVAILABLE_GUARDS: GuardProfile[] = [
  DEMO_GUARD,
  SECOND_GUARD,
  {
    id: 'guard-daniel',
    name: 'Daniel Price',
    role: 'Door Supervisor',
    rating: 4.9,
    completedJobs: 156,
    distance: 5.6,
    verified: true,
    initials: 'DP',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-sophie',
    name: 'Sophie Laurent',
    role: 'Security Officer',
    rating: 4.7,
    completedJobs: 93,
    distance: 3.4,
    verified: true,
    initials: 'SL',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-james-c',
    name: 'James Carter',
    role: 'Door Supervisor',
    rating: 4.6,
    completedJobs: 71,
    distance: 6.2,
    verified: true,
    initials: 'JC',
    accepted: false,
    checkedIn: false,
  },
  {
    id: 'guard-elena',
    name: 'Elena Vasquez',
    role: 'Event Security',
    rating: 4.8,
    completedJobs: 108,
    distance: 3.0,
    verified: true,
    initials: 'EV',
    accepted: false,
    checkedIn: false,
  },
];

export const SECURITY_TYPES: { value: SecurityType; icon: string }[] = [
  { value: 'Event Security', icon: 'ri-calendar-event-line' },
  { value: 'Door Supervisor', icon: 'ri-door-lock-line' },
  { value: 'Site Security', icon: 'ri-building-line' },
  { value: 'Retail Security', icon: 'ri-store-2-line' },
  { value: 'Corporate Security', icon: 'ri-briefcase-line' },
  { value: 'Other', icon: 'ri-more-line' },
];

export const REQUIREMENT_OPTIONS = [
  'SIA Door Supervisor licence',
  'Smart uniform',
  'Customer-facing experience',
  'First aid trained',
  'CCTV licence',
  'Vehicle patrol',
];

export const ACTIVITY_OPTIONS = [
  'Routine perimeter check complete',
  'Client contacted with update',
  'Crowd level increased — monitoring',
  'Access point verified secure',
  'Incident reported and logged',
  'Shift handover notes updated',
];

export const RATING_TAGS = ['Professional', 'On time', 'Helpful', 'Well presented', 'Communicative'];

export function createInitialJob(): DemoJob {
  return {
    id: 'job-demo-001',
    securityType: 'Event Security',
    location: 'Riverside Conference Centre',
    city: 'Birmingham',
    date: 'Saturday, 16 August',
    timeStart: '18:00',
    timeEnd: '01:00',
    hours: 7,
    guardsRequired: 2,
    requirements: [
      'SIA Door Supervisor licence',
      'Smart uniform',
      'Customer-facing experience',
    ],
    status: 'creating',
    guards: [],
    activities: [],
  };
}

export function createInitialActivities(): JobActivity[] {
  return [
    {
      id: 'act-1',
      timestamp: '09:42',
      type: 'system',
      message: 'Job posted to marketplace',
    },
    {
      id: 'act-2',
      timestamp: '09:42',
      type: 'system',
      message: 'Checking location — Birmingham',
    },
    {
      id: 'act-3',
      timestamp: '09:42',
      type: 'system',
      message: 'Checking licence requirements',
    },
    {
      id: 'act-4',
      timestamp: '09:43',
      type: 'system',
      message: '6 suitable guards available',
    },
  ];
}

export const LIFECYCLE_STAGES: { status: string; label: string; icon: string }[] = [
  { status: 'posted', label: 'Posted', icon: 'ri-send-plane-line' },
  { status: 'matched', label: 'Matched', icon: 'ri-user-search-line' },
  { status: 'accepted', label: 'Accepted', icon: 'ri-user-received-line' },
  { status: 'confirmed', label: 'Confirmed', icon: 'ri-check-double-line' },
  { status: 'checked_in', label: 'Checked In', icon: 'ri-map-pin-line' },
  { status: 'completed', label: 'Completed', icon: 'ri-task-line' },
  { status: 'approved', label: 'Approved', icon: 'ri-thumb-up-line' },
  { status: 'paid', label: 'Paid', icon: 'ri-bank-card-line' },
];

export function getLifecycleIndex(status: string): number {
  const idx = LIFECYCLE_STAGES.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx;
}

export const MARKETPLACE_BUILD_OPTIONS = [
  'Security',
  'Trades',
  'Care',
  'Cleaning',
  'Drivers',
  'Freelancers',
  'Events',
  'Other',
];

export const MARKETPLACE_FEATURES = [
  'Customer accounts',
  'Provider accounts',
  'Bookings',
  'Matching',
  'Payments',
  'Ratings',
  'Messaging',
  'Compliance',
  'Admin controls',
];