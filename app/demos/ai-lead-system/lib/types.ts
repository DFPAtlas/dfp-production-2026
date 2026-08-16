export type LeadStage = 'New' | 'Researching' | 'Qualified' | 'Response Ready' | 'Proposal' | 'Won';

export type ReplyStatus = 'locked' | 'draft' | 'approved';
export type ProposalStatus = 'locked' | 'draft' | 'approved';

export interface Lead {
  id: string;
  initials: string;
  company: string;
  contact: string;
  email: string;
  requirement: string;
  source: string;
  sector: string;
  location: string;
  employees: string;
  budget: string;
  estValue: string;
  timing: string;
  score: number;
  fit: 'High' | 'Medium' | 'Low';
  summary: string;
  message: string;
  enquiryType: string;
  serviceInquiry: string;
  projectType: string;
  techStack: string[];
  recentActivity: string;
}

export interface LeadState {
  stage: LeadStage;
  qualified: boolean;
  reply: ReplyStatus;
  proposal: ProposalStatus;
}

export interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
  type: 'system' | 'ai' | 'human' | 'milestone';
}

export interface IntelligenceCard {
  id: string;
  label: string;
  value: string;
  detail?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface WonDriver {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface RecentSignal {
  company: string;
  action: string;
  date: string;
  type: 'positive' | 'neutral' | 'warning';
}

export interface RecommendedContent {
  title: string;
  subtitle: string;
  type: string;
  size?: string;
  reason: string;
}

export interface QualificationFactor {
  label: string;
  score: number;
  max: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  active: boolean;
  completed: boolean;
}

export type WorkspaceTab = 'overview' | 'research' | 'qualification' | 'conversation' | 'proposal';

export interface TourStep {
  view: WorkspaceTab;
  title: string;
  instruction: string;
  highlightId?: string;
}

export interface SalesMetrics {
  newLeads: number;
  qualified: number;
  awaitingReview: number;
  responseTime: string;
  pipelineValue: string;
  leadsProcessed: number;
  leadsProcessedChange: string;
  responseRate: string;
  responseRateChange: string;
  meetingsBooked: number;
  meetingsBookedChange: string;
  pipelineValueNum: string;
  pipelineValueChange: string;
}

export interface ResearchItem {
  label: string;
  value: string;
}