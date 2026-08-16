export interface EmailContact {
  id: string
  name: string
  email: string
  masked_email: string
  company_name: string
  contact_role: string
  phone: string
  source: string
  status: string
  consent_marketing: boolean
  consent_contact: boolean
  do_not_contact: boolean
  tags: string[]
  stage: string
  created_at: string
  updated_at: string
  last_activity_at: string
  brand_id?: string
  brand_name?: string
  product_name?: string
}

export interface ContactPreference {
  id: string
  organisation_id: string
  contact_id: string
  email: string
  brand_id: string | null
  marketing_subscribed: boolean
  subscription_categories: string[]
  frequency: string
  last_updated_at: string
  last_updated_source: string
}

export interface ConsentEvent {
  id: string
  organisation_id: string
  contact_id: string
  email: string
  brand_id: string | null
  purpose: string
  consent_status: 'granted' | 'not_granted' | 'pending' | 'withdrawn' | 'expired' | 'not_required' | 'unknown'
  lawful_basis: string | null
  source: string
  policy_version: string | null
  form_reference: string | null
  effective_at: string
  withdrawn_at: string | null
  source_type: string
}

export interface EmailAudience {
  id: string
  organisation_id: string
  name: string
  description: string
  audience_type: 'static' | 'dynamic' | 'test' | 'imported' | 'crm'
  brand_id: string | null
  brand_name?: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  definition: any
  inclusion_rules: any
  exclusion_rules: any
  eligible_estimate: number
  total_source_count: number
  suppression_count: number
  consent_coverage_pct: number | null
  last_refreshed_at: string | null
  owner_id: string | null
  owner_name?: string
  created_at: string
  updated_at: string
  campaign_count?: number
}

export interface ImportJob {
  id: string
  organisation_id: string
  file_name: string
  file_size: number
  column_mapping: any
  audience_id: string | null
  brand_id: string | null
  source: string
  consent_info: any
  mode: 'add_new' | 'add_fill_blanks' | 'add_update' | 'add_to_audience'
  status: 'pending' | 'validating' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_rows: number
  created_count: number
  updated_count: number
  skipped_count: number
  invalid_count: number
  suppressed_count: number
  failed_count: number
  result_summary: any
  created_by: string | null
  created_at: string
  finished_at: string | null
}

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  valid: 'Valid',
  unverified: 'Unverified',
  invalid: 'Invalid',
  hard_bounced: 'Hard Bounced',
  soft_bounced: 'Repeated Soft Bounce',
  complained: 'Complained',
  unsubscribed: 'Unsubscribed',
  suppressed: 'Suppressed',
  pending_consent: 'Pending Consent',
  deleted: 'Deleted',
}

export const CONSENT_STATUS_LABELS: Record<string, string> = {
  granted: 'Granted',
  not_granted: 'Not Granted',
  pending: 'Pending',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  not_required: 'Not Required',
  unknown: 'Unknown',
}

export const CONSENT_STATUS_COLORS: Record<string, string> = {
  granted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  not_granted: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  withdrawn: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  not_required: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  unknown: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

export const AUDIENCE_TYPE_LABELS: Record<string, string> = {
  static: 'Static List',
  dynamic: 'Dynamic Segment',
  test: 'Test Group',
  imported: 'Imported List',
  crm: 'CRM-Backed',
}

export const SUBSCRIPTION_CATEGORIES = [
  { id: 'newsletters', label: 'Newsletters' },
  { id: 'product_updates', label: 'Product Updates' },
  { id: 'service_updates', label: 'Service Updates' },
  { id: 'events', label: 'Events' },
  { id: 'offers', label: 'Offers & Promotions' },
  { id: 'research', label: 'Research & Surveys' },
  { id: 'wedding_updates', label: 'Wedding Updates' },
  { id: 'security_updates', label: 'Security Updates' },
  { id: 'account_billing', label: 'Account & Billing' },
  { id: 'appointment_reminders', label: 'Appointment Reminders' },
]

export const TRANSACTIONAL_CATEGORIES = ['security_updates', 'account_billing', 'appointment_reminders']

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1)
  return `${visible}***@${domain}`
}

export function getBlankConsentEvent(): ConsentEvent {
  return {
    id: '',
    organisation_id: '',
    contact_id: '',
    email: '',
    brand_id: null,
    purpose: 'marketing',
    consent_status: 'unknown',
    lawful_basis: null,
    source: '',
    policy_version: null,
    form_reference: null,
    effective_at: new Date().toISOString(),
    withdrawn_at: null,
    source_type: 'manual',
  }
}

export function getBlankAudience(): EmailAudience {
  return {
    id: '',
    organisation_id: '',
    name: '',
    description: '',
    audience_type: 'static',
    brand_id: null,
    status: 'draft',
    definition: {},
    inclusion_rules: [],
    exclusion_rules: [],
    eligible_estimate: 0,
    total_source_count: 0,
    suppression_count: 0,
    consent_coverage_pct: null,
    last_refreshed_at: null,
    owner_id: null,
    created_at: '',
    updated_at: '',
  }
}