import {
  Lead,
  LeadState,
  TimelineEvent,
  IntelligenceCard,
  WonDriver,
  RecentSignal,
  RecommendedContent,
  QualificationFactor,
  WorkflowStep,
  TourStep,
  SalesMetrics,
  ResearchItem,
} from './types';

export const leads: Lead[] = [
  {
    id: 'brighton-electrical',
    initials: 'BES',
    company: 'Brighton Electrical Services',
    contact: 'Daniel Price',
    email: 'daniel@brighton-electrical.example',
    requirement: 'Lead management and automated follow-up',
    source: 'Website enquiry',
    sector: 'Electrical Contracting',
    location: 'Brighton, UK',
    employees: '52 Employees',
    budget: '\u00a35,000\u2013\u00a38,000',
    estValue: '\u00a384K',
    timing: '6\u201310 weeks',
    score: 86,
    fit: 'High',
    summary:
      'A growing electrical contractor needs a clearer way to capture enquiries, track follow-up and make sure opportunities are not being missed across their team.',
    message:
      'We are looking for a partner to help deliver electrical upgrades across our new office fit-out in Brighton. Please get in touch.',
    enquiryType: 'Website Contact Form',
    serviceInquiry: 'Commercial Electrical Upgrade',
    projectType: 'Commercial Electrical Upgrade',
    techStack: ['Google Workspace', 'Microsoft 365', 'Sage Intacct'],
    recentActivity: 'New office fit-out project announced in Hove',
  },
  {
    id: 'summit-mechanical',
    initials: 'SML',
    company: 'Summit Mechanical Ltd',
    contact: 'Alex Turner',
    email: 'alex@summit-mechanical.example',
    requirement: 'HVAC maintenance scheduling platform',
    source: 'Referral',
    sector: 'HVAC & Maintenance',
    location: 'Manchester, UK',
    employees: '38 Employees',
    budget: '\u00a312,000\u2013\u00a318,000',
    estValue: '\u00a3120K',
    timing: '10\u201314 weeks',
    score: 88,
    fit: 'High',
    summary:
      'A mechanical services company wants to digitise their maintenance scheduling and improve customer communication across multiple commercial contracts.',
    message:
      'We manage HVAC systems for over forty commercial buildings. Our current paper-based scheduling is creating delays and missed appointments.',
    enquiryType: 'Referral Introduction',
    serviceInquiry: 'Maintenance Scheduling Platform',
    projectType: 'HVAC Service Platform',
    techStack: ['Salesforce', 'Xero', 'Custom CRM'],
    recentActivity: 'Won a new council maintenance contract',
  },
  {
    id: 'harbor-builders',
    initials: 'HB',
    company: 'Harbor Builders Co.',
    contact: 'Sarah Mitchell',
    email: 'sarah@harbor-builders.example',
    requirement: 'Project management and client portal',
    source: 'LinkedIn campaign',
    sector: 'Commercial Construction',
    location: 'Bristol, UK',
    employees: '24 Employees',
    budget: '\u00a38,000\u2013\u00a312,000',
    estValue: '\u00a365K',
    timing: '8\u201312 weeks',
    score: 72,
    fit: 'Medium',
    summary:
      'A construction firm wants a client portal where customers can track project progress, view documents and communicate without endless email threads.',
    message:
      'We need a way for our clients to see project updates in real time. Right now it is all emails and phone calls and things get lost.',
    enquiryType: 'LinkedIn Lead Gen',
    serviceInquiry: 'Client Portal & PM System',
    projectType: 'Construction Client Portal',
    techStack: ['QuickBooks', 'Dropbox', 'Slack'],
    recentActivity: 'Completed a marina development project',
  },
  {
    id: 'pinnacle-facilities',
    initials: 'PF',
    company: 'Pinnacle Facilities',
    contact: 'Marcus Webb',
    email: 'marcus@pinnacle-facilities.example',
    requirement: 'Facilities management dashboard',
    source: 'Website enquiry',
    sector: 'Facilities Management',
    location: 'London, UK',
    employees: '67 Employees',
    budget: '\u00a315,000\u2013\u00a322,000',
    estValue: '\u00a338K',
    timing: '12\u201316 weeks',
    score: 68,
    fit: 'Medium',
    summary:
      'A facilities management provider wants a central dashboard to monitor service tickets, contractor performance and building compliance across their portfolio.',
    message:
      'We manage twelve office buildings and need a single place to track service requests, contractor visits and compliance deadlines.',
    enquiryType: 'Website Contact Form',
    serviceInquiry: 'FM Dashboard & Ticketing',
    projectType: 'Facilities Management Platform',
    techStack: ['ServiceNow', 'SAP', 'Power BI'],
    recentActivity: 'Expanded to a new building in Canary Wharf',
  },
  {
    id: 'vector-engineering',
    initials: 'VE',
    company: 'Vector Engineering',
    contact: 'James Nolan',
    email: 'james@vector-engineering.example',
    requirement: 'Engineering services quotation system',
    source: 'Demo request',
    sector: 'Engineering Services',
    location: 'Birmingham, UK',
    employees: '15 Employees',
    budget: '\u00a33,000\u2013\u00a35,000',
    estValue: '\u00a395K',
    timing: '4\u20136 weeks',
    score: 55,
    fit: 'Low',
    summary:
      'An engineering consultancy is exploring automated quotation and proposal generation to reduce manual admin time on smaller projects.',
    message:
      'We spend too much time on quotes for small projects. Can you help us automate the proposal process?',
    enquiryType: 'Demo Request Form',
    serviceInquiry: 'Quotation Automation',
    projectType: 'Engineering Quote System',
    techStack: ['Excel', 'Word', 'Email'],
    recentActivity: 'Published a new case study on their website',
  },
];

export const initialLeadStates: Record<string, LeadState> = {
  'brighton-electrical': {
    stage: 'New',
    qualified: false,
    reply: 'locked',
    proposal: 'locked',
  },
  'summit-mechanical': {
    stage: 'Qualified',
    qualified: true,
    reply: 'draft',
    proposal: 'locked',
  },
  'harbor-builders': {
    stage: 'New',
    qualified: false,
    reply: 'locked',
    proposal: 'locked',
  },
  'pinnacle-facilities': {
    stage: 'Researching',
    qualified: false,
    reply: 'locked',
    proposal: 'locked',
  },
  'vector-engineering': {
    stage: 'New',
    qualified: false,
    reply: 'locked',
    proposal: 'locked',
  },
};

export const initialTimeline: TimelineEvent[] = [
  {
    time: '13:42',
    label: 'Website enquiry captured',
    detail: 'New website enquiry from Brighton Electrical Services',
    type: 'system',
  },
];

export const salesMetrics: SalesMetrics = {
  newLeads: 12,
  qualified: 7,
  awaitingReview: 3,
  responseTime: '2m 18s',
  pipelineValue: '\u00a32.4M',
  leadsProcessed: 142,
  leadsProcessedChange: '+18%',
  responseRate: '38%',
  responseRateChange: '+7%',
  meetingsBooked: 27,
  meetingsBookedChange: '+12%',
  pipelineValueNum: '\u00a32.4M',
  pipelineValueChange: '+15%',
};

export const defaultIntelligence: IntelligenceCard[] = [
  { id: 'buying-intent', label: 'Buying Intent', value: 'High', detail: 'The enquiry describes an active operational problem and requests a solution.' },
  { id: 'likely-need', label: 'Likely Need', value: 'Lead capture, follow-up automation, sales visibility', detail: 'Multiple related needs identified from the enquiry context.' },
  { id: 'commercial-fit', label: 'Commercial Fit', value: 'Strong', detail: 'Budget range and timeline are realistic for the scope described.' },
  { id: 'next-action', label: 'Next Best Action', value: 'Qualify requirements before preparing a response.', detail: 'AI recommends gathering more detail on team size and current tools.' },
];

export const wonDrivers: WonDriver[] = [
  { label: 'Fast Response (<2hrs)', value: 68, trend: 'up' },
  { label: 'Proposal Relevance', value: 63, trend: 'up' },
  { label: 'Meeting Conversion', value: 41, trend: 'up' },
];

export const recentSignals: RecentSignal[] = [
  { company: 'Brighton Electrical Services', action: 'New office fit-out project mentioned on LinkedIn', date: 'May 20', type: 'positive' },
  { company: 'Brighton Electrical Services', action: 'Viewed pricing page', date: 'May 21', type: 'neutral' },
  { company: 'Brighton Electrical Services', action: 'Downloaded case study: Office Electrical Upgrades', date: 'May 21', type: 'positive' },
];

export const recommendedContent: RecommendedContent = {
  title: 'Office Electrical Upgrades',
  subtitle: 'Solution Overview',
  type: 'PDF',
  size: '2.4 MB',
  reason: 'Matches project type and recent signals.',
};

export const qualificationFactors: QualificationFactor[] = [
  { label: 'Need', score: 90, max: 100 },
  { label: 'Budget', score: 80, max: 100 },
  { label: 'Authority', score: 85, max: 100 },
  { label: 'Timeline', score: 80, max: 100 },
  { label: 'Fit', score: 90, max: 100 },
];

export const workflowSteps: WorkflowStep[] = [
  { id: 'enquiry', label: 'Enquiry', active: true, completed: true },
  { id: 'capture', label: 'Capture', active: false, completed: true },
  { id: 'research', label: 'Research', active: false, completed: false },
  { id: 'qualification', label: 'Qualification', active: false, completed: false },
  { id: 'approval', label: 'Human Approval', active: false, completed: false },
  { id: 'response', label: 'Response', active: false, completed: false },
  { id: 'proposal', label: 'Proposal', active: false, completed: false },
  { id: 'sales', label: 'Sales Team', active: false, completed: false },
];

export const tourSteps: TourStep[] = [
  {
    view: 'overview',
    title: 'Capture the enquiry',
    instruction: 'See how a lead enters the system automatically from a website enquiry.',
    highlightId: 'incoming-enquiry',
  },
  {
    view: 'research',
    title: 'Research the business',
    instruction: 'Turn a basic enquiry into useful context with simulated AI research.',
    highlightId: 'research-panel',
  },
  {
    view: 'qualification',
    title: 'Qualify the opportunity',
    instruction: 'See whether this lead deserves sales attention with a clear score.',
    highlightId: 'qualification-score',
  },
  {
    view: 'qualification',
    title: 'Keep a human in control',
    instruction: 'Approve the AI recommendation. AI prepares. Your team decides.',
    highlightId: 'approval-buttons',
  },
  {
    view: 'conversation',
    title: 'Prepare the response',
    instruction: 'See AI create a useful starting point for your sales team.',
    highlightId: 'ai-draft',
  },
  {
    view: 'proposal',
    title: 'Create the opportunity',
    instruction: 'Move the lead into the sales pipeline as a qualified opportunity.',
    highlightId: 'proposal-panel',
  },
];

export const researchItems = (lead: Lead): ResearchItem[] => [
  { label: 'Company', value: lead.company },
  { label: 'Sector', value: lead.sector },
  { label: 'Size', value: lead.employees },
  { label: 'Revenue Range', value: lead.estValue },
  { label: 'Headquarters', value: lead.location },
  { label: 'Key Services', value: 'Electrical Install, Maintenance, Testing & Inspection' },
  { label: 'Recent Activity', value: lead.recentActivity },
  { label: 'Tech Stack', value: lead.techStack.join(', ') },
];

export const aiDraftEmail = (lead: Lead): string =>
  `Hi ${lead.contact.split(' ')[0]},

Thanks for getting in touch.

From what you have described, it sounds as though your team needs a clearer way to capture enquiries, track follow-up and make sure opportunities are not being missed.

Digital Footprint can build a workflow around the way your team already operates rather than forcing you into a generic CRM. We specialise in lead management systems for trades and service businesses like yours.

Happy to schedule a quick call this week to learn more about your requirements and share how we can help.

Best regards,
James Sales
Digital Footprint`;

export const aiDraftSubject = (lead: Lead): string =>
  `Re: Electrical upgrade for your ${lead.location.split(',')[0].toLowerCase()} office fit-out`;

export const proposalModules = [
  'Lead capture',
  'CRM pipeline',
  'AI qualification',
  'Automated reminders',
  'Response drafting',
  'Reporting dashboard',
];

export const proposalScope = [
  'Discovery and requirements mapping',
  'UX and interface design',
  'Platform development',
  'Integrations and automation',
  'Testing, training and launch',
];