export const TESTER_PROFILE_STATUSES = [
  'applicant', 'onboarding', 'active', 'temporarily_unavailable', 'paused', 'restricted', 'suspended', 'former_tester', 'archived',
] as const;
export type TesterProfileStatus = typeof TESTER_PROFILE_STATUSES[number];

export const TESTER_PROFILE_STATUS_CONFIG: Record<TesterProfileStatus, { label: string; color: string; bg: string }> = {
  applicant: { label: 'Applicant', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  onboarding: { label: 'Onboarding', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-emerald-500/10' },
  temporarily_unavailable: { label: 'Temporarily Unavailable', color: '#F59E0B', bg: 'bg-amber-500/10' },
  paused: { label: 'Paused', color: '#94A3B8', bg: 'bg-slate-500/10' },
  restricted: { label: 'Restricted', color: '#F97316', bg: 'bg-orange-500/10' },
  suspended: { label: 'Suspended', color: '#EF4444', bg: 'bg-red-500/10' },
  former_tester: { label: 'Former Tester', color: '#6B7280', bg: 'bg-gray-500/10' },
  archived: { label: 'Archived', color: '#6B7280', bg: 'bg-gray-500/10' },
};

export const ONBOARDING_STATUSES = [
  'not_started', 'profile_incomplete', 'agreements_required', 'under_review', 'approved', 'rejected', 'more_information_required',
] as const;
export type OnboardingStatus = typeof ONBOARDING_STATUSES[number];

export const ONBOARDING_STATUS_CONFIG: Record<OnboardingStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#94A3B8', bg: 'bg-slate-500/10' },
  profile_incomplete: { label: 'Profile Incomplete', color: '#F59E0B', bg: 'bg-amber-500/10' },
  agreements_required: { label: 'Agreements Required', color: '#F97316', bg: 'bg-orange-500/10' },
  under_review: { label: 'Under Review', color: '#8B5CF6', bg: 'bg-violet-500/10' },
  approved: { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'bg-red-500/10' },
  more_information_required: { label: 'More Information Required', color: '#3B82F6', bg: 'bg-blue-500/10' },
};

export const AVAILABILITY_STATES = ['available', 'limited_availability', 'unavailable', 'on_assignment', 'paused'] as const;
export type AvailabilityState = typeof AVAILABILITY_STATES[number];

export const AVAILABILITY_STATE_CONFIG: Record<AvailabilityState, { label: string; color: string }> = {
  available: { label: 'Available', color: '#10B981' },
  limited_availability: { label: 'Limited', color: '#F59E0B' },
  unavailable: { label: 'Unavailable', color: '#EF4444' },
  on_assignment: { label: 'On Assignment', color: '#3B82F6' },
  paused: { label: 'Paused', color: '#94A3B8' },
};

export const PERFORMANCE_BANDS = ['excellent', 'strong', 'good', 'developing', 'review_required', 'not_enough_data'] as const;
export type PerformanceBand = typeof PERFORMANCE_BANDS[number];

export const PERFORMANCE_BAND_CONFIG: Record<PerformanceBand, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#10B981' },
  strong: { label: 'Strong', color: '#06B6D4' },
  good: { label: 'Good', color: '#8B5CF6' },
  developing: { label: 'Developing', color: '#F59E0B' },
  review_required: { label: 'Review Required', color: '#F97316' },
  not_enough_data: { label: 'Not Enough Data', color: '#94A3B8' },
};

export const CAPABILITY_TYPES = [
  'website_testing', 'mobile_testing', 'ecommerce_testing', 'saas_testing',
  'accessibility_testing', 'usability_testing', 'content_testing',
  'compatibility_testing', 'performance_testing', 'pbx_testing',
] as const;
export type CapabilityType = typeof CAPABILITY_TYPES[number];

export const CAPABILITY_TYPE_LABELS: Record<CapabilityType, string> = {
  website_testing: 'Website Testing',
  mobile_testing: 'Mobile Testing',
  ecommerce_testing: 'Ecommerce Testing',
  saas_testing: 'SaaS Testing',
  accessibility_testing: 'Accessibility Testing',
  usability_testing: 'Usability Testing',
  content_testing: 'Content Testing',
  compatibility_testing: 'Compatibility Testing',
  performance_testing: 'Performance Testing',
  pbx_testing: 'PBX Testing',
};

export const AGREEMENT_TYPES = [
  'tester_terms', 'confidentiality', 'privacy_notice', 'evidence_rules', 'payment_terms', 'project_nda',
] as const;
export type AgreementType = typeof AGREEMENT_TYPES[number];

export const AGREEMENT_TYPE_LABELS: Record<AgreementType, string> = {
  tester_terms: 'Tester Terms',
  confidentiality: 'Confidentiality',
  privacy_notice: 'Privacy Notice',
  evidence_rules: 'Evidence Rules',
  payment_terms: 'Payment Terms',
  project_nda: 'Project NDA',
};

export const WARNING_ACTION_TYPES = [
  'advisory_note', 'formal_warning', 'temporary_restriction', 'job_category_restriction', 'suspension', 'removal',
] as const;
export type WarningActionType = typeof WARNING_ACTION_TYPES[number];

export const WARNING_ACTION_LABELS: Record<WarningActionType, string> = {
  advisory_note: 'Advisory Note',
  formal_warning: 'Formal Warning',
  temporary_restriction: 'Temporary Restriction',
  job_category_restriction: 'Job Category Restriction',
  suspension: 'Suspension',
  removal: 'Removal',
};

export const APPEAL_STATES = ['none', 'submitted', 'under_review', 'upheld', 'rejected'] as const;
export const APPEAL_STATE_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: 'No Appeal', color: '#94A3B8' },
  submitted: { label: 'Appeal Submitted', color: '#3B82F6' },
  under_review: { label: 'Under Review', color: '#8B5CF6' },
  upheld: { label: 'Upheld', color: '#10B981' },
  rejected: { label: 'Rejected', color: '#EF4444' },
};

export const ENTITLEMENT_ELIGIBILITY_STATES = [
  'not_yet_eligible', 'awaiting_review', 'eligible', 'partially_eligible', 'not_eligible', 'manual_review',
] as const;

export const ENTITLEMENT_ELIGIBILITY_CONFIG: Record<string, { label: string; color: string }> = {
  not_yet_eligible: { label: 'Not Yet Eligible', color: '#94A3B8' },
  awaiting_review: { label: 'Awaiting Review', color: '#F59E0B' },
  eligible: { label: 'Eligible', color: '#10B981' },
  partially_eligible: { label: 'Partially Eligible', color: '#F97316' },
  not_eligible: { label: 'Not Eligible', color: '#EF4444' },
  manual_review: { label: 'Manual Review', color: '#8B5CF6' },
};

export const PAYMENT_APPROVAL_STATES = [
  'draft', 'awaiting_review', 'changes_required', 'approved', 'rejected',
  'sent_to_finance', 'processing', 'paid', 'failed', 'cancelled', 'disputed',
] as const;

export const PAYMENT_APPROVAL_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  awaiting_review: { label: 'Awaiting Review', color: '#F59E0B' },
  changes_required: { label: 'Changes Required', color: '#F97316' },
  approved: { label: 'Approved', color: '#06B6D4' },
  rejected: { label: 'Rejected', color: '#EF4444' },
  sent_to_finance: { label: 'Sent to Finance', color: '#3B82F6' },
  processing: { label: 'Processing', color: '#8B5CF6' },
  paid: { label: 'Paid', color: '#10B981' },
  failed: { label: 'Failed', color: '#DC2626' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
  disputed: { label: 'Disputed', color: '#EC4899' },
};

export const DISPUTE_STATUSES = ['open', 'under_review', 'information_required', 'upheld', 'partially_upheld', 'rejected', 'resolved', 'closed'] as const;
export const DISPUTE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#F59E0B' },
  under_review: { label: 'Under Review', color: '#8B5CF6' },
  information_required: { label: 'Information Required', color: '#3B82F6' },
  upheld: { label: 'Upheld', color: '#10B981' },
  partially_upheld: { label: 'Partially Upheld', color: '#F97316' },
  rejected: { label: 'Rejected', color: '#EF4444' },
  resolved: { label: 'Resolved', color: '#10B981' },
  closed: { label: 'Closed', color: '#6B7280' },
};

export const ELIGIBILITY_RESULTS = ['eligible', 'eligible_with_review', 'not_eligible', 'missing_information'] as const;
export const ELIGIBILITY_RESULT_CONFIG: Record<string, { label: string; color: string }> = {
  eligible: { label: 'Eligible', color: '#10B981' },
  eligible_with_review: { label: 'Eligible with Review', color: '#F59E0B' },
  not_eligible: { label: 'Not Eligible', color: '#EF4444' },
  missing_information: { label: 'Missing Information', color: '#94A3B8' },
};

export function generateTesterReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-UAT-TST-${year}-${seq}`;
}

export function generateDisputeReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-UAT-DSP-${year}-${seq}`;
}

export function generateEntitlementReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-UAT-ENT-${year}-${seq}`;
}