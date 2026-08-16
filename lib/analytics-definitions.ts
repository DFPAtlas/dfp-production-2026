export const CONSENT_VERSION = '1.0.0';

export const CONSENT_STORAGE_KEY = 'dfp_analytics_consent';

export const CONSENT_CATEGORIES = [
  { key: 'necessary', label: 'Strictly Necessary', description: 'Required for the website to function correctly. Cannot be disabled.', required: true },
  { key: 'functional', label: 'Functional', description: 'Remember your preferences and settings to improve your experience.', required: false },
  { key: 'analytics', label: 'Analytics', description: 'Help us understand how visitors use our website so we can improve it.', required: false },
  { key: 'marketing', label: 'Marketing', description: 'Used to deliver relevant advertisements and measure campaign performance.', required: false },
] as const;

export type ConsentCategory = typeof CONSENT_CATEGORIES[number]['key'];

export interface ConsentState {
  version: string;
  categories: ConsentCategory[];
  updatedAt: string;
  withdrawnAt: string | null;
}

export const ALLOWED_PUBLIC_EVENTS = [
  'public_page_viewed',
  'primary_navigation_selected',
  'footer_link_selected',
  'account_gateway_opened',
  'product_directory_viewed',
  'product_viewed',
  'product_cta_selected',
  'demo_viewed',
  'demo_started',
  'demo_request_submitted',
  'early_access_submitted',
  'service_viewed',
  'contact_started',
  'contact_submitted',
  'strategy_request_submitted',
  'quote_request_submitted',
  'help_search_used',
  'help_article_viewed',
  'support_request_submitted',
  'status_page_viewed',
  'security_report_submitted',
  'accessibility_issue_submitted',
  'team_profile_viewed',
  'partner_application_submitted',
  'referral_submitted',
  'vacancy_viewed',
  'career_application_submitted',
  'cookie_consent_updated',
  'cookie_consent_withdrawn',
] as const;

export type AllowedEventName = typeof ALLOWED_PUBLIC_EVENTS[number];

export const DISALLOWED_PAYLOAD_FIELDS = [
  'full_name', 'email', 'email_address', 'telephone', 'phone', 'phone_number',
  'message', 'description', 'cover_note', 'cv_name', 'cv_content',
  'candidate_name', 'candidate_email', 'candidate_answer',
  'account_role', 'organisation_id', 'internal_record_id',
  'payment_details', 'auth_token', 'access_token', 'refresh_token',
  'password', 'secret', 'api_key', 'precise_location', 'latitude', 'longitude',
  'address', 'postcode', 'date_of_birth', 'national_insurance',
];

export const ALLOWED_PAYLOAD_FIELDS = [
  'page_route', 'content_slug', 'product_key', 'service_key', 'demo_key',
  'conversion_type', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'referring_domain', 'landing_page',
  'first_source', 'latest_source', 'device_class',
  'language', 'consent_state', 'environment', 'anonymous_session_ref',
  'conversion_ref', 'event_idempotency_key',
];

export const SENSITIVE_QUERY_PARAMS = [
  'token', 'auth', 'reset_token', 'invitation', 'preview',
  'payment', 'session', 'code', 'state', 'access_token',
  'refresh_token', 'id_token', 'api_key', 'key', 'secret',
  'password', 'signature', 'hash', 'nonce',
];

export interface SafePayload {
  page_route?: string;
  content_slug?: string;
  product_key?: string;
  service_key?: string;
  demo_key?: string;
  conversion_type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referring_domain?: string;
  landing_page?: string;
  first_source?: string;
  latest_source?: string;
  device_class?: string;
  language?: string;
  consent_state?: string;
  environment?: string;
  anonymous_session_ref?: string;
  conversion_ref?: string;
  event_idempotency_key?: string;
}

export type DeviceClass = 'desktop' | 'tablet' | 'mobile' | 'unknown';

export interface ConversionDefinition {
  name: string;
  event: AllowedEventName;
  requiresServerConfirmation: boolean;
}