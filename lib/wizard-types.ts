export interface NewClientData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  industry: string;
}

export interface ClientInfo {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
}

export interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

export interface WizardData {
  clientMode: 'existing' | 'new';
  existingClientId: string;
  newClient: NewClientData;
  businessOverview: string;
  targetCustomers: string;
  problemStatement: string;
  currentSystems: string;
  painPoints: string;
  services: string[];
  primaryGoal: string;
  successDefinition: string;
  measurableOutcomes: string[];
  deliverables: string[];
  contentNeeds: string[];
  integrationsList: string[];
  exclusions: string[];
  dependencies: string;
  scopeNotes: string;
  platformStack: string;
  hostingProvider: string;
  domainName: string;
  emailProvider: string;
  databaseType: string;
  existingIntegrations: string;
  authRequired: boolean;
  migrationRequired: boolean;
  accessibilityWCAG: boolean;
  analyticsRequired: boolean;
  complianceNotes: string;
  securityNotes: string;
  userRolesList: string[];
  adminDashboard: boolean;
  clientPortal: boolean;
  paymentRequired: boolean;
  emailRequired: boolean;
  fileUploadRequired: boolean;
  budgetAmount: string;
  budgetRangeLabel: string;
  paymentPlan: string;
  targetStart: string;
  targetLaunch: string;
  priorityLevel: string;
  projectName: string;
  projectLead: string;
  descriptionSummary: string;
  roadmapItems: RoadmapItemData[];
}

export interface RoadmapItemData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
}

export interface StepConfig {
  num: number;
  title: string;
  subtitle: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const SERVICE_OPTIONS = [
  { value: 'website_development', label: 'Website Development', icon: 'ri-window-line', description: 'Custom websites and web applications' },
  { value: 'ai_automation', label: 'AI Automation', icon: 'ri-robot-2-line', description: 'AI agents, chatbots, and intelligent workflows' },
  { value: 'business_automation', label: 'Business Automation', icon: 'ri-settings-3-line', description: 'Process automation and system integration' },
  { value: 'custom_software', label: 'Custom Software', icon: 'ri-code-box-line', description: 'Bespoke software development' },
  { value: 'cloud_infrastructure', label: 'Cloud Infrastructure', icon: 'ri-cloud-line', description: 'Cloud architecture, deployment, and management' },
  { value: 'it_support', label: 'IT Support', icon: 'ri-customer-service-2-line', description: 'Ongoing technical support services' },
  { value: 'cyber_security', label: 'Cyber Security', icon: 'ri-shield-check-line', description: 'Security auditing and protection' },
  { value: 'cctv_security', label: 'CCTV & Security', icon: 'ri-camera-line', description: 'Physical security systems' },
  { value: 'digital_transformation', label: 'Digital Transformation', icon: 'ri-rocket-line', description: 'End-to-end digital strategy and execution' },
  { value: 'other', label: 'Other', icon: 'ri-more-line', description: 'Something not listed here' },
];

export const GOAL_OPTIONS = [
  'Increase leads and sales',
  'Save time and reduce admin',
  'Automate manual workflows',
  'Improve customer service',
  'Improve cyber security',
  'Modernise legacy systems',
  'Launch a new digital platform',
  'Improve data and reporting',
  'Enable remote working',
  'Ensure regulatory compliance',
];

export const CATEGORY_OPTIONS = [
  'service', 'ai', 'automation', 'infrastructure', 'security', 'compliance',
  'analytics', 'mobile', 'integration', 'maintenance',
];

export const BUDGET_RANGE_OPTIONS = [
  { label: 'Under £5,000', value: 'under_5000', min: 0, max: 5000 },
  { label: '£5,000 – £15,000', value: '5000_15000', min: 5000, max: 15000 },
  { label: '£15,000 – £30,000', value: '15000_30000', min: 15000, max: 30000 },
  { label: '£30,000 – £50,000', value: '30000_50000', min: 30000, max: 50000 },
  { label: '£50,000 – £100,000', value: '50000_100000', min: 50000, max: 100000 },
  { label: '£100,000+', value: '100000_plus', min: 100000, max: null },
];

export const PAYMENT_PLAN_OPTIONS = [
  'Full payment upfront',
  '50% upfront / 50% on completion',
  'Milestone-based payments',
  'Monthly retainer',
  'Quarterly billing',
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const STEPS: StepConfig[] = [
  { num: 1, title: 'Client Details', subtitle: 'Who is this project for?' },
  { num: 2, title: 'Business Overview', subtitle: 'Understanding the client' },
  { num: 3, title: 'Services Required', subtitle: 'What services are needed?' },
  { num: 4, title: 'Project Goals', subtitle: 'What does success look like?' },
  { num: 5, title: 'Project Scope', subtitle: 'What will be delivered?' },
  { num: 6, title: 'Technical Requirements', subtitle: 'Platform and infrastructure' },
  { num: 7, title: 'Budget & Timeline', subtitle: 'Investment and schedule' },
  { num: 8, title: 'Roadmap Opportunities', subtitle: 'Future possibilities' },
  { num: 9, title: 'Review & Create', subtitle: 'Confirm everything before creating' },
];

export function createEmptyWizardData(): WizardData {
  return {
    clientMode: 'existing',
    existingClientId: '',
    newClient: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      industry: '',
    },
    businessOverview: '',
    targetCustomers: '',
    problemStatement: '',
    currentSystems: '',
    painPoints: '',
    services: [],
    primaryGoal: '',
    successDefinition: '',
    measurableOutcomes: [''],
    deliverables: [''],
    contentNeeds: [''],
    integrationsList: [''],
    exclusions: [''],
    dependencies: '',
    scopeNotes: '',
    platformStack: '',
    hostingProvider: '',
    domainName: '',
    emailProvider: '',
    databaseType: '',
    existingIntegrations: '',
    authRequired: false,
    migrationRequired: false,
    accessibilityWCAG: false,
    analyticsRequired: false,
    complianceNotes: '',
    securityNotes: '',
    userRolesList: [''],
    adminDashboard: false,
    clientPortal: true,
    paymentRequired: false,
    emailRequired: false,
    fileUploadRequired: false,
    budgetAmount: '',
    budgetRangeLabel: '',
    paymentPlan: '',
    targetStart: '',
    targetLaunch: '',
    priorityLevel: 'medium',
    projectName: '',
    projectLead: '',
    descriptionSummary: '',
    roadmapItems: [],
  };
}