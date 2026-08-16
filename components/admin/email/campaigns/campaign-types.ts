export interface CampaignData {
  id?: string;
  organisation_id?: string | null;
  name: string;
  description: string;
  brand_kit_id: string | null;
  campaign_type: CampaignType;
  source_template_id: string | null;
  source_template_version_id: string | null;
  status: CampaignStatus;
  owner_id: string | null;
  tags: string[];
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CampaignType = 'marketing' | 'newsletter' | 'product_announcement' | 'service_update' | 'event_invitation' | 'customer_update' | 'internal' | 'other';

export type CampaignStatus =
  | 'draft'
  | 'ready_for_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled'
  | 'failed';

export interface CampaignVersionData {
  id?: string;
  organisation_id?: string | null;
  campaign_id: string;
  version_number: number;
  editor_document?: Record<string, unknown> | null;
  rendered_html?: string | null;
  rendered_text?: string | null;
  subject: string | null;
  preview_text: string | null;
  sender_profile_id: string | null;
  tracking_settings: TrackingSettings | null;
  audience_definition: AudienceDefinition | null;
  exclusion_definition: ExclusionDefinition | null;
  validation_summary?: Record<string, unknown> | null;
  created_by?: string | null;
  created_at?: string;
}

export interface TrackingSettings {
  trackOpens: boolean;
  trackClicks: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

export interface AudienceDefinition {
  type: 'saved_audience' | 'segment' | 'contact_list' | 'manual_test' | 'crm_filter';
  source?: string;
  segmentRules?: SegmentRule[];
}

export interface ExclusionDefinition {
  audienceIds: string[];
  segmentIds: string[];
  tags: string[];
  recentCampaignId: string | null;
}

export interface SegmentRule {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
}

export interface SenderProfile {
  id: string;
  fromName: string;
  fromEmail: string;
  replyToName: string;
  replyToEmail: string;
  verified: boolean;
}

export interface SendJob {
  id: string;
  campaign_id: string;
  campaign_version_id: string | null;
  status: string;
  scheduled_for: string | null;
  estimated_recipients: number;
  final_recipients: number;
  submitted_count: number;
  delivered_count: number;
  failed_count: number;
  idempotency_key: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export const CAMPAIGN_TYPES: { value: CampaignType; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'product_announcement', label: 'Product Announcement' },
  { value: 'service_update', label: 'Service Update' },
  { value: 'event_invitation', label: 'Event Invitation' },
  { value: 'customer_update', label: 'Customer Update' },
  { value: 'internal', label: 'Internal Communication' },
  { value: 'other', label: 'Other' },
];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  paused: 'Paused',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  ready_for_review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  changes_requested: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  scheduled: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  sending: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function defaultTrackingSettings(): TrackingSettings {
  return { trackOpens: true, trackClicks: true, utmSource: '', utmMedium: 'email', utmCampaign: '', utmContent: '' };
}

export function defaultAudienceDefinition(): AudienceDefinition {
  return { type: 'contact_list' };
}

export function defaultExclusionDefinition(): ExclusionDefinition {
  return { audienceIds: [], segmentIds: [], tags: [], recentCampaignId: null };
}