export interface PricingPlan {
  id: string;
  category: 'websites' | 'systems' | 'ai' | 'care';
  name: string;
  badge?: string;
  pricePrefix: string;
  price: string;
  priceSuffix?: string;
  supportPrice?: string;
  description: string;
  features: string[];
  featured: boolean;
  ctaLabel: string;
  enquiryNeed: string;
  enquiryPackage: string;
  stripePriceId: string | null;
}

export interface PricingCategory {
  id: 'websites' | 'systems' | 'ai' | 'care';
  label: string;
  icon: string;
  note?: string;
  plans: PricingPlan[];
}

export const pricingCategories: PricingCategory[] = [
  {
    id: 'websites',
    label: 'Websites',
    icon: 'ri-computer-line',
    plans: [
      {
        id: 'launch',
        category: 'websites',
        name: 'Launch',
        pricePrefix: 'From',
        price: '£1,495',
        description: 'A confident digital start.',
        features: [
          'Up to 5 core pages',
          'Bespoke responsive design',
          'Contact & enquiry forms',
          'SEO foundations',
          'Analytics included',
        ],
        featured: false,
        ctaLabel: 'Start with Launch',
        enquiryNeed: 'website',
        enquiryPackage: 'Launch',
        stripePriceId: null,
      },
      {
        id: 'growth',
        category: 'websites',
        name: 'Growth',
        badge: 'MOST POPULAR',
        pricePrefix: 'From',
        price: '£2,995',
        description: 'Designed to generate enquiries.',
        features: [
          'Up to 10 core pages',
          'Conversion-led design',
          'Blog or news system',
          'Bookings & CRM integration',
          'Enhanced analytics',
        ],
        featured: true,
        ctaLabel: 'Choose Growth',
        enquiryNeed: 'website',
        enquiryPackage: 'Growth',
        stripePriceId: null,
      },
      {
        id: 'commerce',
        category: 'websites',
        name: 'Commerce',
        pricePrefix: 'From',
        price: '£4,995',
        description: 'Built to sell and scale.',
        features: [
          'Online shop or checkout',
          'Stripe payment integration',
          'Product & order management',
          'Customer accounts',
          'Automated order emails',
        ],
        featured: false,
        ctaLabel: 'Explore Commerce',
        enquiryNeed: 'website',
        enquiryPackage: 'Commerce',
        stripePriceId: null,
      },
    ],
  },
  {
    id: 'systems',
    label: 'Business Systems',
    icon: 'ri-settings-3-line',
    note: 'SaaS MVPs from £20,000 and advanced multi-tenant platforms from £35,000.',
    plans: [
      {
        id: 'business-dashboard',
        category: 'systems',
        name: 'Business Dashboard',
        pricePrefix: 'From',
        price: '£4,995',
        description: 'Bring your day-to-day operations into one clear workspace.',
        features: [
          'Secure staff access',
          'Operational dashboard',
          'Structured business data',
          'Core workflow tools',
          'Deployment and handover',
        ],
        featured: false,
        ctaLabel: 'Plan a Dashboard',
        enquiryNeed: 'portal',
        enquiryPackage: 'Business Dashboard',
        stripePriceId: null,
      },
      {
        id: 'client-staff-portal',
        category: 'systems',
        name: 'Client & Staff Portal',
        badge: 'MOST POPULAR',
        pricePrefix: 'From',
        price: '£7,500',
        description: 'A secure connected space for your team and customers.',
        features: [
          'Role-based user access',
          'Client and staff workspaces',
          'Database integration',
          'Notifications and activity history',
          'Responsive portal experience',
        ],
        featured: true,
        ctaLabel: 'Plan a Portal',
        enquiryNeed: 'portal',
        enquiryPackage: 'Client & Staff Portal',
        stripePriceId: null,
      },
      {
        id: 'operational-system',
        category: 'systems',
        name: 'Operational System',
        pricePrefix: 'From',
        price: '£12,500',
        description: 'Replace disconnected tools with one tailored system.',
        features: [
          'Multi-stage workflows',
          'Advanced permissions',
          'Third-party integrations',
          'Reporting and automation',
          'Testing and launch support',
        ],
        featured: false,
        ctaLabel: 'Discuss Your System',
        enquiryNeed: 'saas',
        enquiryPackage: 'Operational System',
        stripePriceId: null,
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Automation',
    icon: 'ri-robot-line',
    note: 'External AI, voice, messaging, storage and API usage charges are scoped separately.',
    plans: [
      {
        id: 'workflow-starter',
        category: 'ai',
        name: 'Workflow Starter',
        pricePrefix: 'From',
        price: '£1,495',
        supportPrice: 'Support from £149/month',
        description: 'Automate one clearly defined repetitive process.',
        features: [
          'One business workflow',
          'Form, email or CRM connection',
          'Basic AI processing',
          'Error notifications',
          'Staff handover',
        ],
        featured: false,
        ctaLabel: 'Automate a Workflow',
        enquiryNeed: 'automation',
        enquiryPackage: 'Workflow Starter',
        stripePriceId: null,
      },
      {
        id: 'business-automation',
        category: 'ai',
        name: 'Business Automation',
        badge: 'MOST POPULAR',
        pricePrefix: 'From',
        price: '£3,995',
        supportPrice: 'Support from £299/month',
        description: 'Connect multiple workflows across the business.',
        features: [
          'Up to 3 connected workflows',
          'CRM or database integration',
          'AI-assisted processing',
          'Monitoring and alerts',
          'Monthly optimisation option',
        ],
        featured: true,
        ctaLabel: 'Plan My Automation',
        enquiryNeed: 'automation',
        enquiryPackage: 'Business Automation',
        stripePriceId: null,
      },
      {
        id: 'ai-workforce',
        category: 'ai',
        name: 'AI Workforce',
        pricePrefix: 'From',
        price: '£7,500',
        supportPrice: 'Support from £599/month',
        description: 'Build coordinated AI agents around your operations.',
        features: [
          'Coordinated AI agents',
          'Business knowledge base',
          'Approval checkpoints',
          'Multiple integrations',
          'Usage and activity monitoring',
        ],
        featured: false,
        ctaLabel: 'Explore AI Workforce',
        enquiryNeed: 'automation',
        enquiryPackage: 'AI Workforce',
        stripePriceId: null,
      },
    ],
  },
  {
    id: 'care',
    label: 'Care Plans',
    icon: 'ri-shield-check-line',
    note: 'Included update time may roll forward for one month only. Larger development requests are quoted separately.',
    plans: [
      {
        id: 'essential-care',
        category: 'care',
        name: 'Essential Care',
        pricePrefix: '',
        price: '£79/month',
        description: 'Reliable protection for a professional website.',
        features: [
          'Managed hosting',
          'Security monitoring',
          'Automated backups',
          'SSL management',
          '30 minutes of updates',
        ],
        featured: false,
        ctaLabel: 'Choose Essential',
        enquiryNeed: 'website-improvement',
        enquiryPackage: 'Essential Care',
        stripePriceId: null,
      },
      {
        id: 'business-care',
        category: 'care',
        name: 'Business Care',
        badge: 'MOST POPULAR',
        pricePrefix: '',
        price: '£149/month',
        description: 'Ongoing support for an active business website.',
        features: [
          'Everything in Essential',
          'Performance monitoring',
          'Priority support',
          'Content assistance',
          '90 minutes of updates',
        ],
        featured: true,
        ctaLabel: 'Choose Business Care',
        enquiryNeed: 'website-improvement',
        enquiryPackage: 'Business Care',
        stripePriceId: null,
      },
      {
        id: 'priority-care',
        category: 'care',
        name: 'Priority Care',
        pricePrefix: '',
        price: '£299/month',
        description: 'Faster support and more improvement time.',
        features: [
          'Everything in Business Care',
          'Integration monitoring',
          'Database checks',
          'Priority response',
          '3 hours of updates',
        ],
        featured: false,
        ctaLabel: 'Choose Priority Care',
        enquiryNeed: 'website-improvement',
        enquiryPackage: 'Priority Care',
        stripePriceId: null,
      },
    ],
  },
];

export function getPlanCtaHref(plan: PricingPlan): string {
  if (plan.category === 'websites') {
    return `/checkout?package=${encodeURIComponent(plan.id)}`;
  }
  if (plan.stripePriceId) {
    return `/api/checkout?priceId=${encodeURIComponent(plan.stripePriceId)}`;
  }
  return `/contact?need=${encodeURIComponent(plan.enquiryNeed)}&package=${encodeURIComponent(plan.enquiryPackage)}`;
}

export function getPlanIcon(planId: string): string {
  const map: Record<string, string> = {
    launch: 'ri-rocket-line',
    growth: 'ri-line-chart-line',
    commerce: 'ri-shopping-cart-line',
    'business-dashboard': 'ri-dashboard-line',
    'client-staff-portal': 'ri-team-line',
    'operational-system': 'ri-server-line',
    'workflow-starter': 'ri-flashlight-line',
    'business-automation': 'ri-settings-3-line',
    'ai-workforce': 'ri-cpu-line',
    'essential-care': 'ri-shield-line',
    'business-care': 'ri-shield-check-line',
    'priority-care': 'ri-vip-crown-line',
  };
  return map[planId] || 'ri-circle-line';
}