export interface BrandKitLogo {
  primary?: string;
  lightBg?: string;
  darkBg?: string;
  compactIcon?: string;
  emailHeader?: string;
  footerLogo?: string;
  primaryAlt?: string;
}

export interface BrandKitColours {
  primary: string;
  secondary: string;
  accent: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  link: string;
  buttonText: string;
  emailBg: string;
  contentBg: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandKitTypography {
  headingFont: string;
  bodyFont: string;
  fallbackHeading: string;
  fallbackBody: string;
  bodySize: string;
  headingScale: string;
  lineHeight: string;
  linkStyle: string;
  defaultWeight: string;
}

export interface BrandKitButtons {
  primaryBg: string;
  secondaryBg: string;
  primaryText: string;
  secondaryText: string;
  border: string;
  borderRadius: string;
  hPadding: string;
  vPadding: string;
  fontSize: string;
  fontWeight: string;
  defaultAlign: string;
  fullWidthMobile: boolean;
}

export interface BrandKitLayout {
  emailWidth: number;
  outerBackground: string;
  contentBackground: string;
  globalPadding: string;
  sectionSpacing: string;
  mobilePadding: string;
  containerRadius: string;
  border: string;
  dividerColour: string;
  imageRadius: string;
}

export interface BrandKitHeader {
  logoType: 'centered' | 'left' | 'leftWithLink';
  logoWidth: string;
  backgroundColor: string;
  padding: string;
  alignment: string;
  websiteLink: string;
  announcement: string;
  viewInBrowser: boolean;
  divider: boolean;
  mobileAlignment: string;
}

export interface BrandKitFooter {
  backgroundColor: string;
  textColor: string;
  showLogo: boolean;
  publicName: string;
  legalName: string;
  registeredOffice: string;
  companyNumber: string;
  supportEmail: string;
  website: string;
  socialLinks: BrandSocialLink[];
  privacyUrl: string;
  preferencesUrl: string;
  unsubscribePlaceholder: string;
  poweredByText: boolean;
  alignment: string;
  padding: string;
  divider: boolean;
}

export interface BrandKitContact {
  publicName: string;
  legalName: string;
  registeredOffice: string;
  companyNumber: string;
  vatNumber: string;
  supportEmail: string;
  noreplyEmail: string;
  replyToEmail: string;
  telephone: string;
  website: string;
  privacyUrl: string;
  termsUrl: string;
  preferencesUrl: string;
  unsubscribePlaceholder: string;
}

export interface BrandSocialLink {
  platform: string;
  url: string;
  label: string;
  order: number;
  visible: boolean;
}

export interface BrandKitVoiceSettings extends Record<string, unknown> {
  tone_descriptors?: string;
  reading_level?: string;
  formality?: string;
  preferred_terms?: string;
  restricted_phrases?: string;
  capitalization_rules?: string;
  punctuation_guidance?: string;
  greeting_style?: string;
  sign_off_style?: string;
  max_subject_length?: string;
  max_paragraph_length?: string;
  compliance_notes?: string;
  example_copy?: string;
}

export type BrandKitLocaleOverrides = Record<string, Record<string, string>>;

export interface BrandKit {
  id: string;
  organisation_id: string;
  name: string;
  product_name: string | null;
  description: string | null;
  website_domain: string | null;
  status: string;
  is_default: boolean;
  logo_settings: BrandKitLogo | null;
  colour_settings: BrandKitColours | null;
  typography_settings: BrandKitTypography | null;
  button_settings: BrandKitButtons | null;
  layout_settings: BrandKitLayout | null;
  header_settings: BrandKitHeader | null;
  footer_settings: BrandKitFooter | null;
  contact_settings: BrandKitContact | null;
  social_settings: BrandSocialLink[] | null;
  ai_voice_settings: BrandKitVoiceSettings | null;
  locale_overrides: BrandKitLocaleOverrides | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  template_count?: number;
}

export interface ReusableSection {
  id: string;
  organisation_id: string;
  brand_kit_id: string | null;
  name: string;
  category: string;
  section_type: string;
  description: string | null;
  editor_document: unknown;
  rendered_html: string | null;
  status: string;
  source_template_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string;
}

export const SECTION_CATEGORIES = [
  'header', 'footer', 'hero', 'introduction', 'call-to-action',
  'feature-row', 'project-status', 'website-preview', 'payment',
  'appointment', 'contact', 'social', 'legal', 'other',
];

export const SOCIAL_PLATFORMS = [
  'facebook', 'twitter', 'instagram', 'linkedin', 'youtube',
  'tiktok', 'pinterest', 'github', 'whatsapp', 'telegram',
];

export function defaultColours(): BrandKitColours {
  return {
    primary: '#06B6D4', secondary: '#1E293B', accent: '#22D3EE',
    headingText: '#0F172A', bodyText: '#334155', mutedText: '#64748B',
    link: '#06B6D4', buttonText: '#FFFFFF',
    emailBg: '#F1F5F9', contentBg: '#FFFFFF', border: '#E2E8F0',
    success: '#22C55E', warning: '#F59E0B', error: '#EF4444',
  };
}

export function defaultTypography(): BrandKitTypography {
  return {
    headingFont: 'Arial, Helvetica, sans-serif',
    bodyFont: 'Arial, Helvetica, sans-serif',
    fallbackHeading: 'sans-serif',
    fallbackBody: 'sans-serif',
    bodySize: '14px',
    headingScale: '1.5',
    lineHeight: '1.6',
    linkStyle: 'underline',
    defaultWeight: '400',
  };
}

export function defaultButtons(): BrandKitButtons {
  return {
    primaryBg: '#06B6D4', secondaryBg: '#F1F5F9',
    primaryText: '#FFFFFF', secondaryText: '#1E293B',
    border: 'none', borderRadius: '8px',
    hPadding: '32px', vPadding: '12px',
    fontSize: '14px', fontWeight: 'bold',
    defaultAlign: 'center', fullWidthMobile: true,
  };
}

export function defaultLayout(): BrandKitLayout {
  return {
    emailWidth: 600, outerBackground: '#F1F5F9',
    contentBackground: '#FFFFFF', globalPadding: '20px',
    sectionSpacing: '24px', mobilePadding: '12px',
    containerRadius: '0px', border: 'none',
    dividerColour: '#E2E8F0', imageRadius: '4px',
  };
}

export function defaultHeader(): BrandKitHeader {
  return {
    logoType: 'centered', logoWidth: '140px',
    backgroundColor: '#FFFFFF', padding: '24px',
    alignment: 'center', websiteLink: '',
    announcement: '', viewInBrowser: false,
    divider: true, mobileAlignment: 'center',
  };
}

export function defaultFooter(): BrandKitFooter {
  return {
    backgroundColor: '#F8FAFC', textColor: '#64748B',
    showLogo: true, publicName: '', legalName: '',
    registeredOffice: '', companyNumber: '',
    supportEmail: '', website: '',
    socialLinks: [], privacyUrl: '', preferencesUrl: '',
    unsubscribePlaceholder: '{{unsubscribe_url}}',
    poweredByText: true, alignment: 'center',
    padding: '32px', divider: true,
  };
}

export function defaultContact(): BrandKitContact {
  return {
    publicName: '', legalName: '', registeredOffice: '',
    companyNumber: '', vatNumber: '',
    supportEmail: '', noreplyEmail: '', replyToEmail: '',
    telephone: '', website: '',
    privacyUrl: '', termsUrl: '', preferencesUrl: '',
    unsubscribePlaceholder: '{{unsubscribe_url}}',
  };
}

export function defaultLogo(): BrandKitLogo {
  return {
    primary: '', lightBg: '', darkBg: '',
    compactIcon: '', emailHeader: '', footerLogo: '',
    primaryAlt: 'Logo',
  };
}
