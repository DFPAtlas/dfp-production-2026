export type LeadStage =
  | 'new'
  | 'review_required'
  | 'qualified'
  | 'contact_planned'
  | 'contacted'
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'disqualified'
  | 'on_hold'
  | 'archived';

export type LeadPriority = 'low' | 'medium' | 'high' | 'critical';

export type LeadSource =
  | 'website_form'
  | 'referral'
  | 'event'
  | 'outbound'
  | 'partner'
  | 'campaign'
  | 'existing_client'
  | 'telephone'
  | 'manual';

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  review_required: 'Review Required',
  qualified: 'Qualified',
  contact_planned: 'Contact Planned',
  contacted: 'Contacted',
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  disqualified: 'Disqualified',
  on_hold: 'On Hold',
  archived: 'Archived',
};

export const STAGE_ORDER: LeadStage[] = [
  'new',
  'review_required',
  'qualified',
  'contact_planned',
  'contacted',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'disqualified',
  'on_hold',
  'archived',
];

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  review_required: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  qualified: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  contact_planned: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  discovery: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  proposal: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  negotiation: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  disqualified: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const STAGE_DOT_COLORS: Record<LeadStage, string> = {
  new: '#60A5FA',
  review_required: '#A78BFA',
  qualified: '#22D3EE',
  contact_planned: '#818CF8',
  contacted: '#FBBF24',
  discovery: '#2DD4BF',
  proposal: '#FB923C',
  negotiation: '#F472B6',
  won: '#34D399',
  lost: '#F87171',
  disqualified: '#9CA3AF',
  on_hold: '#FACC15',
  archived: '#94A3B8',
};

export const PIPELINE_STAGES: LeadStage[] = [
  'new',
  'review_required',
  'qualified',
  'contact_planned',
  'contacted',
  'discovery',
  'proposal',
  'negotiation',
];

export const CLOSED_STAGES: LeadStage[] = ['won', 'lost', 'disqualified'];

export const ACTIVE_STAGES: LeadStage[] = STAGE_ORDER.filter(
  (s) => !CLOSED_STAGES.includes(s) && s !== 'archived'
);

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website_form: 'Website Form',
  referral: 'Referral',
  event: 'Event',
  outbound: 'Outbound Research',
  partner: 'Partner',
  campaign: 'Campaign',
  existing_client: 'Existing Client',
  telephone: 'Telephone',
  manual: 'Manual Entry',
};

export const CHANNELS = ['email', 'telephone', 'meeting', 'sms', 'form', 'other'] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  telephone: 'Telephone',
  meeting: 'Meeting',
  sms: 'SMS',
  form: 'Form',
  other: 'Other',
};

export function generateLeadReference(index: number): string {
  const padded = String(index).padStart(6, '0');
  return `DFP-LEAD-${new Date().getFullYear()}-${padded}`;
}

export function getNextStage(current: LeadStage): LeadStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function stageRequiresReason(stage: LeadStage): boolean {
  return ['won', 'lost', 'disqualified', 'archived'].includes(stage);
}