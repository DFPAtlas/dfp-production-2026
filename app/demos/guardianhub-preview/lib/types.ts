export type ViewKey =
  | 'command'
  | 'sites'
  | 'guards'
  | 'patrols'
  | 'incidents'
  | 'rota'
  | 'compliance'
  | 'clients';

export interface DemoSite {
  id: string;
  name: string;
  client: string;
  status: 'healthy' | 'attention' | 'critical';
  guardsOnDuty: number;
  guardsRequired: number;
  shiftStart: string;
  shiftEnd: string;
  nextPatrolDue: string;
  patrolOverdue: boolean;
  patrolCheckpoints: PatrolCheckpoint[];
  instructions: string[];
  hasOpenIncident: boolean;
}

export interface PatrolCheckpoint {
  id: string;
  name: string;
  completed: boolean;
}

export interface DemoGuard {
  id: string;
  name: string;
  role: string;
  initials: string;
  status: 'on_duty' | 'off_duty' | 'on_break';
  currentSiteId: string | null;
  shiftStart: string;
  shiftEnd: string;
  compliance: 'current' | 'expiring_soon' | 'action_required';
  lastPatrol: string | null;
  siaLicence: string;
}

export interface DemoIncident {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  siteId: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'acknowledged' | 'resolving' | 'resolved';
  timeline: IncidentTimelineEntry[];
}

export interface IncidentTimelineEntry {
  time: string;
  message: string;
  type: 'created' | 'update' | 'action' | 'resolved';
}

export interface RotaShift {
  id: string;
  siteId: string;
  siteName: string;
  start: string;
  end: string;
  assignedGuards: string[];
  requiredGuards: number;
  status: 'covered' | 'attention' | 'unassigned';
}

export interface ComplianceRecord {
  id: string;
  guardId: string;
  guardName: string;
  type: string;
  status: 'current' | 'expiring_soon' | 'action_required';
  expiresIn: string | null;
  detail: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  message: string;
  type: 'checkin' | 'patrol' | 'incident' | 'system' | 'handover' | 'rota';
  siteId?: string;
  guardId?: string;
}

export interface IntelligenceInsight {
  id: string;
  category: string;
  title: string;
  detail: string;
  action: string;
  resolved: boolean;
}

export interface ClientReport {
  siteId: string;
  siteName: string;
  guardCoverage: number;
  patrolsCompleted: number;
  patrolsTotal: number;
  incidentsResolved: number;
  escalations: number;
  status: 'healthy' | 'attention' | 'critical';
}

export interface TourStep {
  title: string;
  instruction: string;
  view: ViewKey;
}