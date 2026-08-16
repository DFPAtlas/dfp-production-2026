export type WebsiteStatus =
  | 'setup' | 'discovery' | 'design' | 'development'
  | 'staging' | 'client_review' | 'launch_ready' | 'live'
  | 'maintenance' | 'paused' | 'archived';

export type WebsiteType =
  | 'brochure' | 'ecommerce' | 'saas' | 'portal'
  | 'marketplace' | 'booking' | 'internal_system' | 'other';

export type EnvironmentType = 'development' | 'staging' | 'production';

export type MaintenanceStatus = 'none' | 'scheduled' | 'in_progress';

export const WEBSITE_STATUSES: { value: WebsiteStatus; label: string; color: string }[] = [
  { value: 'setup', label: 'Setup', color: '#6B7280' },
  { value: 'discovery', label: 'Discovery', color: '#8B5CF6' },
  { value: 'design', label: 'Design', color: '#EC4899' },
  { value: 'development', label: 'Development', color: '#3B82F6' },
  { value: 'staging', label: 'Staging', color: '#F59E0B' },
  { value: 'client_review', label: 'Client Review', color: '#06B6D4' },
  { value: 'launch_ready', label: 'Launch Ready', color: '#10B981' },
  { value: 'live', label: 'Live', color: '#22C55E' },
  { value: 'maintenance', label: 'Maintenance', color: '#F97316' },
  { value: 'paused', label: 'Paused', color: '#94A3B8' },
  { value: 'archived', label: 'Archived', color: '#475569' },
];

export const WEBSITE_TYPES: { value: WebsiteType; label: string }[] = [
  { value: 'brochure', label: 'Brochure' },
  { value: 'ecommerce', label: 'eCommerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'portal', label: 'Portal' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'booking', label: 'Booking' },
  { value: 'internal_system', label: 'Internal System' },
  { value: 'other', label: 'Other' },
];

export const ENVIRONMENT_TYPES: { value: EnvironmentType; label: string; color: string }[] = [
  { value: 'development', label: 'Development', color: '#6B7280' },
  { value: 'staging', label: 'Staging', color: '#F59E0B' },
  { value: 'production', label: 'Production', color: '#10B981' },
];

export function getWebsiteStatusDef(status: string) {
  return WEBSITE_STATUSES.find(s => s.value === status) || WEBSITE_STATUSES[0];
}

export function getWebsiteTypeDef(type: string) {
  return WEBSITE_TYPES.find(t => t.value === type) || WEBSITE_TYPES[0];
}

export function getEnvironmentTypeDef(type: string) {
  return ENVIRONMENT_TYPES.find(e => e.value === type) || ENVIRONMENT_TYPES[0];
}