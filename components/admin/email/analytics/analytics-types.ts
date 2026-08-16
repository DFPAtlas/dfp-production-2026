export type DeliveryEventType =
  | 'sent'
  | 'accepted'
  | 'delivered'
  | 'delayed'
  | 'opened'
  | 'clicked'
  | 'soft_bounced'
  | 'hard_bounced'
  | 'complained'
  | 'unsubscribed'
  | 'failed';

export interface DeliveryEvent {
  id: string;
  organisation_id: string;
  provider: string;
  provider_event_id: string;
  provider_message_id: string;
  campaign_id: string | null;
  automation_id: string | null;
  transactional_mapping_id: string | null;
  recipient_message_id: string | null;
  event_type: DeliveryEventType;
  event_time: string;
  safe_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RecipientMessage {
  id: string;
  organisation_id: string;
  source_type: string;
  source_id: string;
  source_version_id: string | null;
  contact_id: string | null;
  masked_recipient: string;
  provider_message_id: string;
  current_status: string;
  submitted_at: string | null;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounce_type: string | null;
  bounce_description: string | null;
  complaint_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuppressionRecord {
  id: string;
  organisation_id: string;
  contact_id: string | null;
  normalised_email_hash: string;
  masked_email: string;
  reason: SuppressionReason;
  scope: 'global' | 'brand' | 'category' | 'list';
  brand_id: string | null;
  source_type: string;
  source_reference: string;
  is_permanent: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SuppressionReason =
  | 'hard_bounce'
  | 'repeated_soft_bounce'
  | 'complaint'
  | 'unsubscribe'
  | 'manual_block'
  | 'invalid_address'
  | 'legal_compliance';

export const SUPPRESSION_REASON_LABELS: Record<SuppressionReason, string> = {
  hard_bounce: 'Hard Bounce',
  repeated_soft_bounce: 'Repeated Soft Bounce',
  complaint: 'Spam Complaint',
  unsubscribe: 'Unsubscribed',
  manual_block: 'Manual Block',
  invalid_address: 'Invalid Address',
  legal_compliance: 'Legal/Compliance',
};

export interface LinkClick {
  id: string;
  organisation_id: string;
  recipient_message_id: string;
  campaign_id: string | null;
  automation_id: string | null;
  transactional_mapping_id: string | null;
  link_url: string;
  link_label: string | null;
  destination_domain: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  clicked_at: string;
  created_at: string;
}

export interface AnalyticsSummary {
  sent: number;
  accepted: number;
  delivered: number;
  deliveryRate: number | null;
  uniqueOpens: number;
  openRate: number | null;
  uniqueClicks: number;
  clickRate: number | null;
  clickToOpenRate: number | null;
  softBounces: number;
  hardBounces: number;
  unsubscribes: number;
  complaints: number;
  failed: number;
  suppressed: number;
}

export interface CampaignReport {
  id: string;
  name: string;
  brand: string;
  subject: string;
  status: string;
  sentDate: string | null;
  recipients: number;
  delivered: number;
  uniqueOpens: number;
  uniqueClicks: number;
  bounces: number;
  unsubscribes: number;
  complaints: number;
}

export interface AutomationReport {
  id: string;
  name: string;
  status: string;
  triggerCount: number;
  started: number;
  completed: number;
  stopped: number;
  failed: number;
  emailsSent: number;
  deliveries: number;
  opens: number;
  clicks: number;
  avgCompletionMs: number | null;
  delayedCount: number;
  topFailureStep: string | null;
}

export interface TransactionalReport {
  eventKey: string;
  product: string;
  internalName: string;
  triggered: number;
  submitted: number;
  delivered: number;
  failed: number;
  hardBounces: number;
  softBounces: number;
  complaints: number;
  medianResponseMs: number | null;
  recentIncident: boolean;
  activeTemplate: string | null;
  activeSender: string | null;
}

export interface DeliverabilitySummary {
  deliveryRate: number | null;
  hardBounceRate: number | null;
  softBounceRate: number | null;
  complaintRate: number | null;
  unsubscribeRate: number | null;
  rejectionRate: number | null;
  senderHealth: { name: string; email: string; deliveryRate: number | null; status: string }[];
  domainHealth: { domain: string; deliveryRate: number | null; bounces: number; complaints: number }[];
  incidents: { id: string; type: string; description: string; detectedAt: string; resolved: boolean }[];
}

export type DateRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  custom: 'Custom range',
};

export function getDateRangeStart(range: DateRange, customStart?: string): string {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString();
    }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString();
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString();
    }
    case '90d': {
      const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString();
    }
    case 'custom': return customStart || new Date(now.getTime() - 30 * 86400000).toISOString();
    default: {
      const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString();
    }
  }
}

export function emptySummary(): AnalyticsSummary {
  return {
    sent: 0, accepted: 0, delivered: 0, deliveryRate: null,
    uniqueOpens: 0, openRate: null, uniqueClicks: 0, clickRate: null,
    clickToOpenRate: null, softBounces: 0, hardBounces: 0,
    unsubscribes: 0, complaints: 0, failed: 0, suppressed: 0,
  };
}

export function calcRate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}