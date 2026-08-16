export const APPLICATION_STATUSES = [
  'draft', 'submitted', 'under_review', 'more_information_required', 'approved', 'declined', 'waitlisted', 'suspended', 'closed',
] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; text: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'bg-slate-500/10', text: 'text-slate-600' },
  submitted: { label: 'Submitted', color: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  under_review: { label: 'Under Review', color: '#8B5CF6', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  more_information_required: { label: 'More Info Required', color: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  approved: { label: 'Approved', color: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  declined: { label: 'Declined', color: '#EF4444', bg: 'bg-red-500/10', text: 'text-red-600' },
  waitlisted: { label: 'Waitlisted', color: '#06B6D4', bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
  suspended: { label: 'Suspended', color: '#F97316', bg: 'bg-orange-500/10', text: 'text-orange-600' },
  closed: { label: 'Closed', color: '#6B7280', bg: 'bg-gray-500/10', text: 'text-gray-600' },
};

export const EXPERIENCE_LEVELS = [
  'Complete beginner',
  'Some general experience',
  'Regular technology user',
  'Previous UAT or QA experience',
  'Professional testing experience',
] as const;

export const DEVICE_OPTIONS = [
  'Windows desktop or laptop',
  'Mac desktop or laptop',
  'Android phone',
  'Android tablet',
  'iPhone',
  'iPad',
  'Chromebook',
  'Smart TV',
  'Other',
] as const;

export const DEVICE_KEY_MAP: Record<string, string> = {
  'Windows desktop or laptop': 'windows',
  'Mac desktop or laptop': 'macos',
  'Android phone': 'android',
  'Android tablet': 'android-tablet',
  'iPhone': 'ios',
  'iPad': 'ipad',
  'Chromebook': 'chromebook',
  'Smart TV': 'smart-tv',
  'Other': 'other-device',
};

export const BROWSER_OPTIONS = [
  'Google Chrome',
  'Microsoft Edge',
  'Mozilla Firefox',
  'Safari',
  'Opera',
  'Other',
] as const;

export const INTERNET_OPTIONS = [
  'Home broadband',
  'Mobile data',
  'Public or shared Wi-Fi',
  'Other',
] as const;

export const CAPABILITY_OPTIONS = [
  { key: 'screenshots', label: 'Taking screenshots' },
  { key: 'screen_recording', label: 'Recording your screen' },
  { key: 'follow_instructions', label: 'Following written test instructions' },
  { key: 'describe_steps', label: 'Describing steps that caused a problem' },
  { key: 'video_calls', label: 'Joining occasional video or telephone calls' },
  { key: 'multiple_devices', label: 'Testing on more than one device' },
] as const;

export const TESTING_INTEREST_OPTIONS = [
  'Websites',
  'Mobile applications',
  'Desktop software',
  'Customer portals',
  'Staff dashboards',
  'Booking systems',
  'Payment and checkout flows',
  'Forms and application processes',
  'Accessibility',
  'Email templates',
  'AI tools and assistants',
  'General usability',
  'Visual design',
  'Mobile responsiveness',
  'Other',
] as const;

export const AVAILABILITY_HOURS_OPTIONS = [
  'Less than 2 hours per week',
  '2–5 hours per week',
  '6–10 hours per week',
  'More than 10 hours per week',
  'Availability varies',
] as const;

export const DAY_OPTIONS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

export const TIME_OPTIONS = [
  'Morning (8am–12pm)',
  'Afternoon (12pm–5pm)',
  'Evening (5pm–9pm)',
  'Late night (9pm–12am)',
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  'UK bank transfer',
  'PayPal',
  'Another approved method',
  'Decide later',
] as const;

export const PAYMENT_CONFIRMATIONS = [
  'I understand that each test may have different payment rules.',
  'I understand that duplicate, invalid, fraudulent or out-of-scope reports may not qualify for payment.',
  'I understand that I am responsible for declaring and paying my own tax, National Insurance and VAT where applicable, except where DFP is legally required to make deductions or operate PAYE.',
  'I understand that DFP is not responsible for my personal tax return, tax payments, penalties, interest or accounting costs unless the law places responsibility on DFP.',
] as const;

export const ELIGIBILITY_CONFIRMATIONS = [
  'I am at least 18 years old.',
  'I understand that applying does not guarantee acceptance.',
  'I understand that testing opportunities are not guaranteed.',
  'I will provide accurate information.',
] as const;

export const INDUSTRY_OPTIONS = [
  'Property and lettings',
  'Weddings and events',
  'Security services',
  'Automotive and dealerships',
  'Retail and e-commerce',
  'Finance and payments',
  'Healthcare',
  'Home services and trades',
  'Business software',
  'Hospitality and travel',
  'Education',
  'Recruitment and HR',
  'Warehousing and logistics',
  'Smart homes and connected devices',
  'Other',
  'No specialist industry experience',
] as const;

export const INDUSTRY_KEY_MAP: Record<string, string> = {
  'Property and lettings': 'property',
  'Weddings and events': 'weddings',
  'Security services': 'security',
  'Automotive and dealerships': 'automotive',
  'Retail and e-commerce': 'ecommerce',
  'Finance and payments': 'finance',
  'Healthcare': 'healthcare',
  'Home services and trades': 'home-services',
  'Business software': 'business-software',
  'Hospitality and travel': 'hospitality',
  'Education': 'education',
  'Recruitment and HR': 'hr',
  'Warehousing and logistics': 'logistics',
  'Smart homes and connected devices': 'smart-home',
};

export const EXPERIENCE_SOURCE_OPTIONS = [
  'Work',
  'Personal use',
  'Volunteering',
  'Study',
  'Other',
] as const;

export const CONFIDENCE_LEVELS = [
  'Basic familiarity',
  'Good working knowledge',
  'Strong practical knowledge',
  'Professional / specialist knowledge',
] as const;

export const TEST_ENVIRONMENT_OPTIONS = [
  'Fast home broadband',
  'Slower broadband',
  'Mobile data',
  'Weak mobile signal',
  'Public or shared Wi-Fi',
  'Multiple browsers',
  'Multiple screen sizes',
  'Quiet environment',
  'Busy environment',
  'Different locations',
  'Interrupted connection testing where authorised',
] as const;

export const TESTING_ACTIVITY_OPTIONS = [
  'Following a prepared test script',
  'Exploring freely',
  'Testing complete user journeys',
  'Checking forms and validation',
  'Signup and login testing',
  'Checkout and payment testing',
  'Mobile responsiveness',
  'Reviewing wording and instructions',
  'Accessibility testing',
  'Security-focused testing where authorised',
  'Comparing a build against a design',
  'Email and notification testing',
  'Spoken feedback',
  'Screen recording',
  'Live testing sessions',
  'Multi-device testing',
  'Retesting fixed bugs',
] as const;

export const TESTING_STRENGTH_OPTIONS = [
  'Attention to detail',
  'Clear written explanations',
  'Finding unusual problems',
  'Understanding non-technical users',
  'Visual and design review',
  'Technical troubleshooting',
  'Accessibility awareness',
  'Customer-service perspective',
  'Following detailed instructions',
  'Multi-device testing',
  'Patience with repeated testing',
  'Good spoken feedback',
] as const;

export const TESTING_LEVEL_OPTIONS = [
  'Simple guided testing',
  'General user-journey testing',
  'Detailed multi-step testing',
  'Technical testing',
  'Accessibility testing',
  'Security testing where authorised',
  'A mixture based on my profile',
] as const;

export const USER_PERSPECTIVE_OPTIONS = [
  'Parent or family household',
  'Small-business owner',
  'Office worker',
  'Remote worker',
  'Landlord or property professional',
  'Tenant or renter',
  'Wedding organiser',
  'Wedding guest',
  'Driver or vehicle buyer',
  'Online shopper',
  'Tradesperson',
  'Hospitality customer',
  'Older or less-confident technology user',
  'Experienced technology user',
  'Smart-home user',
  'Other',
] as const;

export const ACCESSIBILITY_CAPABILITY_OPTIONS = [
  'Keyboard-only navigation',
  'Screen zoom',
  'Large text',
  'Colour contrast',
  'Screen readers',
  'Voice control',
  'Captions and transcripts',
  'Simple-language review',
  'Other assistive technology',
  'Interested in DFP accessibility training',
] as const;

export const RESPONSE_SPEED_OPTIONS = [
  'Within a few hours',
  'Same day',
  'Within 24 hours',
  'Within 2–3 days',
  'It varies',
] as const;

export const COMMUNICATION_METHOD_OPTIONS = [
  'Email',
  'DFP tester dashboard',
  'SMS',
  'Telephone',
  'Video call',
  'Written tasks only',
] as const;

export const SESSION_LENGTH_OPTIONS = [
  '10–20 minutes',
  '20–45 minutes',
  '45–90 minutes',
  'More than 90 minutes',
  'Depends on the task',
] as const;

export const NOTICE_REQUIRED_OPTIONS = [
  'Same day',
  '24 hours',
  '2–3 days',
  'One week',
  'It varies',
] as const;

export const SUITABILITY_LABELS = [
  'Excellent match',
  'Strong match',
  'Possible match',
  'Manual review',
  'Does not meet required criteria',
] as const;
export type SuitabilityLabel = typeof SUITABILITY_LABELS[number];

export const MATCHING_DIMENSIONS = [
  'deviceMatch',
  'industryMatch',
  'skillsMatch',
  'availabilityMatch',
  'communicationMatch',
  'reportingMatch',
  'accessibilityMatch',
] as const;
export type MatchingDimension = typeof MATCHING_DIMENSIONS[number];

export function generateApplicationReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `DFP-UAT-APP-${year}-${seq}`;
}

export interface IndustryExperience {
  industry: string;
  source: string;
  confidence: string;
}

export interface DeviceProfile {
  deviceLabel: string;
  manufacturer: string;
  model: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenSize: string;
  canInstallApps: string;
  ownership: string;
}

export interface PracticalBugReport {
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  deviceBrowser: string;
  happenedAgain: string;
  additionalNotes: string;
}

export interface MatchingProfile {
  experienceLevel: string;
  industryConfidence: Record<string, string>;
  bugReportScore: number;
  deviceCoverage: string[];
  browserCoverage: string[];
  testingActivities: string[];
  preferredDifficulty: string;
  accessibilityCapability: string[];
  availabilityHours: string;
  responseSpeed: string;
  communicationMethods: string[];
  conflictFlag: boolean;
  trainingNeeds: string[];
  currentAssignmentLoad: number;
}

export interface ProjectMatchingRequirements {
  required: {
    deviceTypes?: string[];
    browsers?: string[];
    countryRegion?: string;
    minimumTestingLevel?: string;
    testingActivities?: string[];
    availabilityWindow?: string;
    communicationMethod?: string;
    accessibilityExperience?: boolean;
    screenRecording?: boolean;
    maxTesterCount?: number;
  };
  preferred: {
    industries?: string[];
    devices?: string[];
    userPerspectives?: string[];
    reportingStrength?: number;
    responseSpeed?: string;
    availability?: string;
    experienceLevel?: string;
  };
}

export interface TesterMatchResult {
  testerId: string;
  dimensionScores: Record<MatchingDimension, number>;
  suitabilityLabel: SuitabilityLabel;
  explanation: string;
  missingRequirements: string[];
  calculatedAt: string;
}

export interface WizardApplicationData {
  legalName: string;
  displayName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  townCity: string;
  county: string;
  country: string;
  postcode: string;
  preferredContactMethod: string;
  experienceLevel: string;
  hasTestedBefore: string;
  techConfidence: string;
  hasReportedBugs: string;
  relevantWorkArea: string;
  relevantExperienceText: string;
  motivation: string;
  industryExperience: IndustryExperience[];
  industryOtherText: string;
  devices: string[];
  browsers: string[];
  internetConnection: string[];
  capabilities: Record<string, boolean>;
  deviceProfiles: DeviceProfile[];
  testEnvironments: string[];
  deviceRestrictions: string;
  testingActivities: string[];
  testerStrengths: string[];
  preferredTestingLevel: string;
  practicalBugReport: PracticalBugReport;
  testingInterests: string[];
  userPerspectives: string[];
  userPerspectiveOtherText: string;
  accessibilityInterest: string;
  accessibilityCapabilities: string[];
  projectConflictStatus: string;
  projectConflictDetails: string;
  accessibilityTools: string;
  availabilityHours: string;
  availabilityDays: string[];
  availabilityTimes: string[];
  shortNoticeAvailable: string;
  comfortableUnfinished: string;
  responseSpeed: string;
  communicationMethods: string[];
  comfortableCommunication: Record<string, boolean>;
  preferredSessionLength: string;
  noticeRequired: string;
  preferredPaymentMethod: string;
  paymentConfirmations: boolean[];
  eligibilityConfirmations: boolean[];
}