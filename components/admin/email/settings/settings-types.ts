export type ProviderStatus = 'unconfigured' | 'configured' | 'testing' | 'active' | 'needs_attention' | 'disabled' | 'failed';
export type DomainStatus = 'pending' | 'dns_pending' | 'verifying' | 'verified' | 'failed' | 'disabled' | 'archived';
export type SenderStatus = 'active' | 'disabled';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed' | 'expired';
export type ProfileType = 'marketing' | 'transactional' | 'support' | 'no_reply' | 'internal_notification';

export interface ProviderConnection {
  id: string;
  organisation_id: string;
  provider: string;
  status: ProviderStatus;
  safe_account_metadata: Record<string, unknown> | null;
  configuration_source: string;
  last_checked_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendingDomain {
  id: string;
  organisation_id: string;
  brand_kit_id: string | null;
  provider_connection_id: string | null;
  domain: string;
  status: DomainStatus;
  provider_domain_id: string | null;
  verification_details: Record<string, unknown> | null;
  tracking_domain: string | null;
  is_default: boolean;
  last_checked_at: string | null;
  dns_records: DnsRecord[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string;
  sender_count?: number;
}

export interface DnsRecord {
  type: string;
  host: string;
  value: string;
  priority?: number;
  ttl?: string;
  purpose: string;
  status: 'pending' | 'found' | 'missing' | 'incorrect' | 'conflicting' | 'verified';
}

export interface SenderProfile {
  id: string;
  organisation_id: string;
  brand_kit_id: string | null;
  sending_domain_id: string | null;
  internal_name: string;
  from_name: string | null;
  from_email: string;
  reply_to_name: string | null;
  reply_to_email: string | null;
  profile_type: ProfileType;
  verification_status: VerificationStatus;
  is_default: boolean;
  is_brand_default: boolean;
  status: SenderStatus;
  last_used_at: string | null;
  usage_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string;
  domain_name?: string;
}

export interface DeliverabilitySettings {
  id: string;
  organisation_id: string;
  settings: DeliverabilityConfig;
  updated_by: string | null;
  updated_at: string;
}

export interface DeliverabilityConfig {
  tracking_default: 'enabled' | 'disabled';
  bounce_threshold_hard: number;
  bounce_threshold_soft: number;
  complaint_warning_threshold: number;
  soft_bounce_retry_limit: number;
  suppression_rules: 'strict' | 'standard';
  daily_send_limit: number | null;
  hourly_send_limit: number | null;
  large_send_confirmation_threshold: number;
  test_recipient_allowlist: string[];
  alert_roles: string[];
  provider_fail_closed: boolean;
}

export const DEFAULT_DELIVERABILITY_CONFIG: DeliverabilityConfig = {
  tracking_default: 'enabled',
  bounce_threshold_hard: 3,
  bounce_threshold_soft: 5,
  complaint_warning_threshold: 2,
  soft_bounce_retry_limit: 3,
  suppression_rules: 'strict',
  daily_send_limit: null,
  hourly_send_limit: null,
  large_send_confirmation_threshold: 50,
  test_recipient_allowlist: [],
  alert_roles: [],
  provider_fail_closed: true,
};

export const PROVIDER_LABELS: Record<string, string> = {
  resend: 'Resend',
  ses: 'Amazon SES',
  sendgrid: 'SendGrid',
  mailgun: 'Mailgun',
  postmark: 'Postmark',
};

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  marketing: 'Marketing',
  transactional: 'Transactional',
  support: 'Support',
  no_reply: 'No Reply',
  internal_notification: 'Internal Notification',
};

export const DNS_RECORD_TEMPLATES: Record<string, DnsRecord[]> = {
  resend: [
    { type: 'TXT', host: '@', value: 'resend-verification=xxxxxxxxxxxx', purpose: 'Domain verification', status: 'pending', ttl: '3600' },
    { type: 'MX', host: '@', value: 'feedback-smtp.us-east-1.amazonses.com', priority: 10, purpose: 'Return path / bounce handling', status: 'pending', ttl: '3600' },
    { type: 'TXT', host: '@', value: 'v=spf1 include:amazonses.com ~all', purpose: 'SPF record for Resend SES', status: 'pending', ttl: '3600' },
    { type: 'CNAME', host: 'resend._domainkey', value: 'resend._domainkey.example.com', purpose: 'DKIM signature', status: 'pending', ttl: '3600' },
    { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com', purpose: 'DMARC policy', status: 'pending', ttl: '3600' },
  ],
};

export const CLICKABLE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unconfigured: { label: 'Not Configured', color: 'text-slate-500 bg-slate-500/10' },
  configured: { label: 'Configured', color: 'text-sky-400 bg-sky-400/10' },
  testing: { label: 'Testing', color: 'text-amber-400 bg-amber-400/10' },
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-400/10' },
  needs_attention: { label: 'Needs Attention', color: 'text-red-400 bg-red-400/10' },
  disabled: { label: 'Disabled', color: 'text-slate-500 bg-slate-500/10' },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-400/10' },
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-400/10' },
  dns_pending: { label: 'DNS Pending', color: 'text-amber-400 bg-amber-400/10' },
  verifying: { label: 'Verifying', color: 'text-sky-400 bg-sky-400/10' },
  verified: { label: 'Verified', color: 'text-emerald-400 bg-emerald-400/10' },
  archived: { label: 'Archived', color: 'text-slate-500 bg-slate-500/10' },
  unverified: { label: 'Unverified', color: 'text-slate-400 bg-slate-400/10' },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-400/10' },
};