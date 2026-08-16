export type Perspective = 'client' | 'guard';

export type JobStatus =
  | 'creating'
  | 'posted'
  | 'matching'
  | 'matched'
  | 'accepted'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'paid';

export type SecurityType =
  | 'Event Security'
  | 'Door Supervisor'
  | 'Site Security'
  | 'Retail Security'
  | 'Corporate Security'
  | 'Other';

export interface GuardProfile {
  id: string;
  name: string;
  role: string;
  rating: number;
  completedJobs: number;
  distance: number;
  verified: boolean;
  initials: string;
  accepted: boolean;
  checkedIn: boolean;
}

export interface JobActivity {
  id: string;
  timestamp: string;
  type: 'system' | 'guard' | 'client' | 'checkin' | 'completion';
  message: string;
  guardId?: string;
}

export interface DemoJob {
  id: string;
  securityType: SecurityType;
  location: string;
  city: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  hours: number;
  guardsRequired: number;
  requirements: string[];
  status: JobStatus;
  guards: GuardProfile[];
  activities: JobActivity[];
  rating?: number;
  ratingTags?: string[];
}

export interface DemoState {
  perspective: Perspective;
  job: DemoJob | null;
  tourStep: number;
  tourActive: boolean;
  entryDismissed: boolean;
  showCompletion: boolean;
  showBuildCTA: boolean;
  jobDaySimulated: boolean;
}

export const TOUR_STEPS = [
  { id: 1, title: 'Create the job', description: 'Tell QuickGuard what security you need.', target: 'client-dashboard' },
  { id: 2, title: 'Find suitable guards', description: 'See the marketplace match the requirement.', target: 'matching-view' },
  { id: 3, title: 'Switch sides', description: 'See what the guard receives.', target: 'perspective-switcher' },
  { id: 4, title: 'Accept the job', description: 'Watch both sides update.', target: 'guard-job-card' },
  { id: 5, title: 'Confirm the team', description: 'See the booking become operational.', target: 'client-confirmation' },
  { id: 6, title: 'Run the shift', description: 'Simulate check-in and activity.', target: 'job-day-actions' },
  { id: 7, title: 'Complete the job', description: 'Create a clear completion record.', target: 'completion-area' },
  { id: 8, title: 'Close the marketplace loop', description: 'Confirm completion, payment and rating.', target: 'payment-rating' },
];