export const CMS_EDITORIAL_STATUSES = [
  'Draft',
  'In Progress',
  'Ready for Review',
  'Changes Requested',
  'Awaiting Approval',
  'Approved',
  'Scheduled',
  'Published',
  'Unpublished',
  'Expired',
  'Archived',
] as const;
export type CmsEditorialStatus = (typeof CMS_EDITORIAL_STATUSES)[number];

export const CMS_SECTION_TYPES = [
  'Hero',
  'Intro',
  'Text and Image',
  'Features',
  'Services',
  'Statistics',
  'Logo Grid',
  'Process',
  'Case Studies',
  'Testimonials',
  'Staff',
  'FAQ',
  'CTA',
  'Contact Form',
  'Video',
  'Gallery',
  'Related Content',
  'Announcement',
] as const;
export type CmsSectionType = (typeof CMS_SECTION_TYPES)[number];

export const CMS_PAGE_TYPES = ['page', 'landing', 'collection', 'legal', 'blog'] as const;
export type CmsPageType = (typeof CMS_PAGE_TYPES)[number];

export const CMS_COLLECTION_TYPES = ['services', 'staff', 'case-studies', 'testimonials', 'faqs', 'announcements', 'legal'] as const;
export type CmsCollectionType = (typeof CMS_COLLECTION_TYPES)[number];

export const CMS_NAV_AREAS = ['header', 'footer', 'sidebar', 'mobile'] as const;
export type CmsNavArea = (typeof CMS_NAV_AREAS)[number];

export const CMS_ANNOUNCEMENT_STYLES = ['info', 'success', 'warning', 'error', 'promo'] as const;

export const editorialStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10' },
  'In Progress': { label: 'In Progress', color: '#F59E0B', bg: 'bg-amber-500/10' },
  'Ready for Review': { label: 'Ready for Review', color: '#3B82F6', bg: 'bg-blue-500/10' },
  'Changes Requested': { label: 'Changes Requested', color: '#F97316', bg: 'bg-orange-500/10' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: '#7C3AED', bg: 'bg-purple-500/10' },
  'Approved': { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10' },
  'Scheduled': { label: 'Scheduled', color: '#06B6D4', bg: 'bg-cyan-500/10' },
  'Published': { label: 'Published', color: '#10B981', bg: 'bg-emerald-500/10' },
  'Unpublished': { label: 'Unpublished', color: '#EF4444', bg: 'bg-red-500/10' },
  'Expired': { label: 'Expired', color: '#78716C', bg: 'bg-stone-500/10' },
  'Archived': { label: 'Archived', color: '#64748B', bg: 'bg-slate-500/10' },
};

export const sectionTypeIcons: Record<string, string> = {
  'Hero': 'ri-image-line',
  'Intro': 'ri-file-text-line',
  'Text and Image': 'ri-image-edit-line',
  'Features': 'ri-grid-line',
  'Services': 'ri-tools-line',
  'Statistics': 'ri-bar-chart-line',
  'Logo Grid': 'ri-layout-grid-line',
  'Process': 'ri-git-branch-line',
  'Case Studies': 'ri-folder-chart-line',
  'Testimonials': 'ri-chat-quote-line',
  'Staff': 'ri-team-line',
  'FAQ': 'ri-question-answer-line',
  'CTA': 'ri-arrow-right-circle-line',
  'Contact Form': 'ri-mail-send-line',
  'Video': 'ri-video-line',
  'Gallery': 'ri-gallery-line',
  'Related Content': 'ri-links-line',
  'Announcement': 'ri-megaphone-line',
};

export function generatePageReference(): string {
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-CMS-PG-2026-${num}`;
}

export const PRODUCT_STATUSES = [
  'Concept', 'Research', 'In Development', 'Internal Testing',
  'Private Alpha', 'Private Beta', 'Public Beta', 'Launching Soon',
  'Live', 'Paused', 'Retired', 'Archived',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_VISIBILITY = ['Private', 'Internal only', 'Unlisted preview', 'Public', 'Archived'] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITY)[number];

export const PRODUCT_CATEGORIES = [
  'Business Software', 'Marketplace', 'AI and Automation', 'Property',
  'Security', 'Wedding and Events', 'Workplace', 'Other',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CTA_TYPES = [
  'visit_product', 'request_demo', 'join_early_access', 'contact_dfp',
  'view_case_study', 'coming_soon', 'register_interest', 'none',
] as const;
export type ProductCtaType = (typeof PRODUCT_CTA_TYPES)[number];

export const productStatusConfig: Record<string, { label: string; color: string }> = {
  'Concept': { label: 'Concept', color: '#64748B' },
  'Research': { label: 'Research', color: '#64748B' },
  'In Development': { label: 'In Development', color: '#F59E0B' },
  'Internal Testing': { label: 'Internal Testing', color: '#F97316' },
  'Private Alpha': { label: 'Private Alpha', color: '#8B5CF6' },
  'Private Beta': { label: 'Private Beta', color: '#8B5CF6' },
  'Public Beta': { label: 'Public Beta', color: '#3B82F6' },
  'Launching Soon': { label: 'Launching Soon', color: '#7C3AED' },
  'Live': { label: 'Live', color: '#10B981' },
  'Paused': { label: 'Paused', color: '#F59E0B' },
  'Retired': { label: 'Retired', color: '#94A3B8' },
  'Archived': { label: 'Archived', color: '#64748B' },
};

export const ctaTypeIcons: Record<string, string> = {
  'visit_product': 'ri-external-link-line',
  'request_demo': 'ri-calendar-check-line',
  'join_early_access': 'ri-rocket-line',
  'contact_dfp': 'ri-mail-send-line',
  'view_case_study': 'ri-folder-chart-line',
  'coming_soon': 'ri-time-line',
  'register_interest': 'ri-notification-line',
  'none': 'ri-information-line',
};

export const TEAM_PROFILE_STATUSES = [
  'Draft', 'Needs staff confirmation', 'Ready for review',
  'Approved', 'Published', 'Hidden', 'Archived',
] as const;
export type TeamProfileStatus = (typeof TEAM_PROFILE_STATUSES)[number];

export const TEAM_DEPARTMENTS = [
  'Leadership', 'Product and Strategy', 'UI Development',
  'UX Development', 'Software Engineering', 'AI and Automation',
  'Client Delivery', 'Quality Assurance', 'Support',
  'Sales and Partnerships', 'Operations',
] as const;
export type TeamDepartment = (typeof TEAM_DEPARTMENTS)[number];

export const teamProfileStatusConfig: Record<string, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Needs staff confirmation': { label: 'Needs Confirmation', color: '#F59E0B' },
  'Ready for review': { label: 'Ready for Review', color: '#3B82F6' },
  'Approved': { label: 'Approved', color: '#10B981' },
  'Published': { label: 'Published', color: '#10B981' },
  'Hidden': { label: 'Hidden', color: '#F97316' },
  'Archived': { label: 'Archived', color: '#64748B' },
};

export const DEMO_FORMATS = [
  'interactive_sandbox', 'guided_product_tour', 'recorded_video',
  'screenshot_walkthrough', 'live_demonstration_request', 'private_preview',
  'concept_preview', 'coming_soon',
] as const;
export type DemoFormat = (typeof DEMO_FORMATS)[number];

export const DEMO_STATUSES = [
  'Draft', 'Internal review', 'Available internally', 'Private invitation only',
  'Public preview', 'Public demo', 'Temporarily unavailable', 'Retired', 'Archived',
] as const;
export type DemoStatus = (typeof DEMO_STATUSES)[number];

export const DEMO_VISIBILITY = ['Private', 'Internal only', 'Unlisted preview', 'Public demo', 'Public preview', 'Archived'] as const;
export type DemoVisibility = (typeof DEMO_VISIBILITY)[number];

export const demoFormatConfig: Record<string, { label: string; icon: string; color: string }> = {
  'interactive_sandbox': { label: 'Interactive Sandbox', icon: 'ri-play-circle-line', color: '#10B981' },
  'guided_product_tour': { label: 'Guided Product Tour', icon: 'ri-guide-line', color: '#3B82F6' },
  'recorded_video': { label: 'Recorded Video', icon: 'ri-video-line', color: '#8B5CF6' },
  'screenshot_walkthrough': { label: 'Screenshot Walkthrough', icon: 'ri-image-line', color: '#F59E0B' },
  'live_demonstration_request': { label: 'Live Demo Request', icon: 'ri-calendar-check-line', color: '#F97316' },
  'private_preview': { label: 'Private Preview', icon: 'ri-eye-off-line', color: '#EF4444' },
  'concept_preview': { label: 'Concept Preview', icon: 'ri-lightbulb-line', color: '#94A3B8' },
  'coming_soon': { label: 'Coming Soon', icon: 'ri-time-line', color: '#64748B' },
};

export const demoStatusConfig: Record<string, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Internal review': { label: 'Internal Review', color: '#F59E0B' },
  'Available internally': { label: 'Available Internally', color: '#3B82F6' },
  'Private invitation only': { label: 'Private Invitation Only', color: '#8B5CF6' },
  'Public preview': { label: 'Public Preview', color: '#06B6D4' },
  'Public demo': { label: 'Public Demo', color: '#10B981' },
  'Temporarily unavailable': { label: 'Temporarily Unavailable', color: '#F97316' },
  'Retired': { label: 'Retired', color: '#64748B' },
  'Archived': { label: 'Archived', color: '#94A3B8' },
};

export const HELP_ARTICLE_STATUSES = [
  'Draft', 'Technical review', 'Support review', 'Legal/security review',
  'Approved', 'Published', 'Outdated', 'Hidden', 'Archived',
] as const;
export type HelpArticleStatus = (typeof HELP_ARTICLE_STATUSES)[number];

export const HELP_ARTICLE_VISIBILITY = ['Public', 'Authenticated', 'Restricted', 'Archived'] as const;
export type HelpArticleVisibility = (typeof HELP_ARTICLE_VISIBILITY)[number];

export const HELP_CATEGORIES = [
  'getting-started', 'accounts-and-sign-in', 'client-portal',
  'projects-and-delivery', 'files-and-approvals', 'billing-and-invoices',
  'product-access', 'uat-testing', 'pbx', 'privacy-and-data',
  'security', 'troubleshooting', 'contact-and-support',
] as const;
export type HelpCategory = (typeof HELP_CATEGORIES)[number];

export const HELP_AUDIENCES = [
  'public', 'prospective-clients', 'existing-clients', 'product-users',
  'uat-testers', 'staff', 'pbx-users', 'partners',
] as const;
export type HelpAudience = (typeof HELP_AUDIENCES)[number];

export const helpArticleStatusConfig: Record<string, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Technical review': { label: 'Technical Review', color: '#3B82F6' },
  'Support review': { label: 'Support Review', color: '#F59E0B' },
  'Legal/security review': { label: 'Legal/Security Review', color: '#EF4444' },
  'Approved': { label: 'Approved', color: '#7C3AED' },
  'Published': { label: 'Published', color: '#10B981' },
  'Outdated': { label: 'Outdated', color: '#F97316' },
  'Hidden': { label: 'Hidden', color: '#64748B' },
  'Archived': { label: 'Archived', color: '#94A3B8' },
};

export const helpCategoryConfig: Record<string, { label: string; icon: string }> = {
  'getting-started': { label: 'Getting Started', icon: 'ri-rocket-line' },
  'accounts-and-sign-in': { label: 'Accounts and Sign-In', icon: 'ri-user-line' },
  'client-portal': { label: 'Client Portal', icon: 'ri-dashboard-line' },
  'projects-and-delivery': { label: 'Projects and Delivery', icon: 'ri-git-branch-line' },
  'files-and-approvals': { label: 'Files and Approvals', icon: 'ri-file-text-line' },
  'billing-and-invoices': { label: 'Billing and Invoices', icon: 'ri-bill-line' },
  'product-access': { label: 'Product Access', icon: 'ri-stack-line' },
  'uat-testing': { label: 'UAT Testing', icon: 'ri-test-tube-line' },
  'pbx': { label: 'PBX', icon: 'ri-phone-line' },
  'privacy-and-data': { label: 'Privacy and Data', icon: 'ri-shield-check-line' },
  'security': { label: 'Security', icon: 'ri-shield-line' },
  'troubleshooting': { label: 'Troubleshooting', icon: 'ri-tools-line' },
  'contact-and-support': { label: 'Contact and Support', icon: 'ri-customer-service-line' },
};

export const PARTNER_APPLICATION_TYPES = [
  'partner_enquiry', 'referral_registration', 'supplier_interest',
  'technology_integration', 'delivery_collaboration', 'strategic_partnership', 'other',
] as const;
export type PartnerApplicationType = (typeof PARTNER_APPLICATION_TYPES)[number];

export const PARTNER_APPLICATION_STATUSES = [
  'Submitted', 'Screening', 'More information required', 'Under review',
  'Meeting requested', 'Due diligence', 'Approved', 'Declined',
  'On hold', 'Withdrawn', 'Archived',
] as const;
export type PartnerApplicationStatus = (typeof PARTNER_APPLICATION_STATUSES)[number];

export const partnerTypeConfig: Record<string, { label: string; icon: string; description: string }> = {
  'partner_enquiry': { label: 'Partner Enquiry', icon: 'ri-briefcase-line', description: 'General partnership interest' },
  'referral_registration': { label: 'Referral Registration', icon: 'ri-user-shared-line', description: 'Register as a referral partner' },
  'supplier_interest': { label: 'Supplier Interest', icon: 'ri-truck-line', description: 'Supply products or services' },
  'technology_integration': { label: 'Technology Integration', icon: 'ri-code-s-slash-line', description: 'Integrate your technology with DFP' },
  'delivery_collaboration': { label: 'Delivery Collaboration', icon: 'ri-team-line', description: 'Implementation and delivery partnership' },
  'strategic_partnership': { label: 'Strategic Partnership', icon: 'ri-building-2-line', description: 'Long-term strategic collaboration' },
  'other': { label: 'Other', icon: 'ri-more-line', description: 'Another type of relationship' },
};

export const partnerStatusConfig: Record<string, { label: string; color: string }> = {
  'Submitted': { label: 'Submitted', color: '#3B82F6' },
  'Screening': { label: 'Screening', color: '#8B5CF6' },
  'More information required': { label: 'More Info Required', color: '#F59E0B' },
  'Under review': { label: 'Under Review', color: '#F97316' },
  'Meeting requested': { label: 'Meeting Requested', color: '#06B6D4' },
  'Due diligence': { label: 'Due Diligence', color: '#7C3AED' },
  'Approved': { label: 'Approved', color: '#10B981' },
  'Declined': { label: 'Declined', color: '#EF4444' },
  'On hold': { label: 'On Hold', color: '#FACC15' },
  'Withdrawn': { label: 'Withdrawn', color: '#94A3B8' },
  'Archived': { label: 'Archived', color: '#64748B' },
};

export const PARTNER_RELATIONSHIP_TYPES = [
  'Referral partner', 'Technology partner', 'Integration partner',
  'Implementation partner', 'Delivery partner', 'Supplier',
  'Consultant', 'Strategic partner', 'Education or community partner',
] as const;
export type PartnerRelationshipType = (typeof PARTNER_RELATIONSHIP_TYPES)[number];

export const SUPPLIER_CATEGORIES = [
  'Cloud Infrastructure', 'Software Development', 'AI and Machine Learning',
  'Security', 'Design and UX', 'Content and Marketing', 'Business Consulting',
  'Telecommunications', 'Hardware', 'Managed Services', 'Other',
] as const;

export const TECH_INTEGRATION_CATEGORIES = [
  'API Integration', 'Platform Extension', 'Data Sync', 'Single Sign-On',
  'Embedded Component', 'Payment Processing', 'Communication APIs',
  'Identity Verification', 'Analytics', 'Other',
] as const;

export const REFERRAL_NO_REWARD_NOTE = 'Digital Footprint reviews each referral individually. No commission, payment, or reward programme is currently active. Submitting a referral does not create any payment obligation.';

export const VACANCY_STATUSES = [
  'Draft', 'Approval required', 'Approved', 'Scheduled',
  'Open', 'Paused', 'Closed', 'Filled', 'Cancelled', 'Archived',
] as const;
export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  'Permanent', 'Fixed term', 'Part time', 'Apprenticeship',
  'Internship or placement', 'Graduate role', 'Temporary employed role',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_LOCATION_TYPES = [
  'Remote', 'Hybrid', 'Office based', 'Field based', 'Location dependent',
] as const;
export type WorkLocationType = (typeof WORK_LOCATION_TYPES)[number];

export const VACANCY_DEPARTMENTS = [
  'Leadership', 'Product and Strategy', 'UI Development', 'UX Development',
  'Software Engineering', 'AI and Automation', 'Client Delivery',
  'Quality Assurance', 'Support', 'Sales and Partnerships', 'Operations',
] as const;

export const APPLICATION_STATUSES = [
  'Submitted', 'Screening', 'Shortlist review', 'Interview proposed',
  'Interview scheduled', 'Assessment', 'References', 'Offer preparation',
  'Offer made', 'Hired', 'Not progressing', 'Withdrawn', 'On hold', 'Archived',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const vacancyStatusConfig: Record<string, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: '#94A3B8' },
  'Approval required': { label: 'Approval Required', color: '#F59E0B' },
  'Approved': { label: 'Approved', color: '#10B981' },
  'Scheduled': { label: 'Scheduled', color: '#7C3AED' },
  'Open': { label: 'Open', color: '#3B82F6' },
  'Paused': { label: 'Paused', color: '#F97316' },
  'Closed': { label: 'Closed', color: '#EF4444' },
  'Filled': { label: 'Filled', color: '#10B981' },
  'Cancelled': { label: 'Cancelled', color: '#64748B' },
  'Archived': { label: 'Archived', color: '#94A3B8' },
};

export const applicationStatusConfig: Record<string, { label: string; color: string }> = {
  'Submitted': { label: 'Submitted', color: '#3B82F6' },
  'Screening': { label: 'Screening', color: '#8B5CF6' },
  'Shortlist review': { label: 'Shortlist Review', color: '#7C3AED' },
  'Interview proposed': { label: 'Interview Proposed', color: '#F59E0B' },
  'Interview scheduled': { label: 'Interview Scheduled', color: '#06B6D4' },
  'Assessment': { label: 'Assessment', color: '#F97316' },
  'References': { label: 'References', color: '#6366F1' },
  'Offer preparation': { label: 'Offer Preparation', color: '#EC4899' },
  'Offer made': { label: 'Offer Made', color: '#14B8A6' },
  'Hired': { label: 'Hired', color: '#10B981' },
  'Not progressing': { label: 'Not Progressing', color: '#F97316' },
  'Withdrawn': { label: 'Withdrawn', color: '#94A3B8' },
  'On hold': { label: 'On Hold', color: '#FACC15' },
  'Archived': { label: 'Archived', color: '#64748B' },
};

export const employmentTypeConfig: Record<string, { label: string; icon: string }> = {
  'Permanent': { label: 'Permanent', icon: 'ri-briefcase-line' },
  'Fixed term': { label: 'Fixed Term', icon: 'ri-calendar-check-line' },
  'Part time': { label: 'Part Time', icon: 'ri-time-line' },
  'Apprenticeship': { label: 'Apprenticeship', icon: 'ri-book-open-line' },
  'Internship or placement': { label: 'Internship', icon: 'ri-graduation-cap-line' },
  'Graduate role': { label: 'Graduate Role', icon: 'ri-award-line' },
  'Temporary employed role': { label: 'Temporary', icon: 'ri-hourglass-line' },
};

export const workLocationTypeConfig: Record<string, { label: string; icon: string }> = {
  'Remote': { label: 'Remote', icon: 'ri-home-office-line' },
  'Hybrid': { label: 'Hybrid', icon: 'ri-building-line' },
  'Office based': { label: 'Office Based', icon: 'ri-building-2-line' },
  'Field based': { label: 'Field Based', icon: 'ri-road-map-line' },
  'Location dependent': { label: 'Location Dependent', icon: 'ri-map-pin-line' },
};