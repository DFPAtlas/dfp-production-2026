export interface EditorBlockData {
  id: string;
  type: string;
  data: Record<string, unknown>;
  style: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface EditorColumn {
  id: string;
  width: number;
  blocks: EditorBlockData[];
}

export interface EditorRow {
  id: string;
  columns: EditorColumn[];
}

export interface EditorSection {
  id: string;
  label: string;
  rows: EditorRow[];
}

export interface EditorSettings {
  width: number;
  outerBackground: string;
  contentBackground: string;
  defaultFont: string;
  defaultTextColor: string;
  defaultLinkColor: string;
  defaultSpacing: number;
  mobileBreakpoint: number;
}

export interface EditorDocument {
  version: number;
  settings: EditorSettings;
  sections: EditorSection[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  variables: string[] | null;
  editor_document: EditorDocument | null;
  preview_text: string | null;
  status: string;
  revision: number;
  is_legacy: boolean;
  editor_settings: EditorSettings | null;
  brand_kit_id: string | null;
  brand_overrides: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const BLOCK_DEFINITIONS: Record<string, { label: string; icon: string; category: string; defaultData: Record<string, unknown>; defaultStyle: Record<string, unknown> }> = {
  heading: { label: 'Heading', icon: 'ri-heading', category: 'Basic', defaultData: { text: 'Heading text', level: 'h2' }, defaultStyle: { fontFamily: 'Arial, sans-serif', fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', textAlign: 'left', padding: '12px 0' } },
  text: { label: 'Text', icon: 'ri-text', category: 'Basic', defaultData: { text: 'Add your text here. You can edit this directly on the canvas.' }, defaultStyle: { fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'normal', color: '#475569', textAlign: 'left', lineHeight: '1.6', padding: '8px 0' } },
  image: { label: 'Image', icon: 'ri-image-line', category: 'Basic', defaultData: { src: '', alt: '', link: '' }, defaultStyle: { width: '100%', borderRadius: '0px', padding: '8px 0', textAlign: 'center' } },
  button: { label: 'Button', icon: 'ri-cursor-line', category: 'Basic', defaultData: { text: 'Click Here', url: '#' }, defaultStyle: { backgroundColor: '#06B6D4', color: '#ffffff', borderRadius: '8px', padding: '12px 32px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', width: 'auto' } },
  divider: { label: 'Divider', icon: 'ri-separator', category: 'Basic', defaultData: {}, defaultStyle: { width: '100%', thickness: '1px', style: 'solid', color: '#e2e8f0', padding: '16px 0' } },
  spacer: { label: 'Spacer', icon: 'ri-space', category: 'Basic', defaultData: {}, defaultStyle: { height: '24px' } },
  oneColumn: { label: 'One Column', icon: 'ri-layout-column-line', category: 'Layout', defaultData: {}, defaultStyle: { padding: '0', gap: '0', background: 'transparent' } },
  twoColumns: { label: 'Two Columns', icon: 'ri-layout-2-line', category: 'Layout', defaultData: {}, defaultStyle: { padding: '0', gap: '16px', background: 'transparent', mobileStack: true } },
  threeColumns: { label: 'Three Columns', icon: 'ri-layout-3-line', category: 'Layout', defaultData: {}, defaultStyle: { padding: '0', gap: '12px', background: 'transparent', mobileStack: true } },
  logo: { label: 'Logo', icon: 'ri-building-line', category: 'Business', defaultData: { src: '', alt: 'Logo', link: '' }, defaultStyle: { width: '140px', textAlign: 'center', padding: '16px 0' } },
  featureCard: { label: 'Feature Card', icon: 'ri-vip-crown-line', category: 'Business', defaultData: { title: 'Feature Title', description: 'Describe the feature benefit here.', icon: 'ri-star-line' }, defaultStyle: { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px', textAlign: 'left', borderColor: '#e2e8f0' } },
  contactDetails: { label: 'Contact', icon: 'ri-contacts-line', category: 'Business', defaultData: { company: 'Company Name', address: '', email: '', phone: '', website: '' }, defaultStyle: { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#475569', textAlign: 'left', padding: '16px 0' } },
  socialLinks: { label: 'Social Links', icon: 'ri-share-line', category: 'Business', defaultData: { links: [] }, defaultStyle: { textAlign: 'center', padding: '16px 0', iconSize: '24px', gap: '12px' } },
  preheader: { label: 'Preheader', icon: 'ri-mail-send-line', category: 'Email', defaultData: { text: '' }, defaultStyle: { display: 'none' } },
  header: { label: 'Header', icon: 'ri-layout-top-line', category: 'Email', defaultData: { logo: '', title: 'Digital Footprint' }, defaultStyle: { backgroundColor: '#ffffff', padding: '24px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' } },
  footer: { label: 'Footer', icon: 'ri-layout-bottom-line', category: 'Email', defaultData: { company: 'Digital Footprint', address: '', unsubscribeText: 'Unsubscribe', unsubscribeUrl: '{{unsubscribe_url}}' }, defaultStyle: { backgroundColor: '#f8fafc', padding: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontFamily: 'Arial, sans-serif' } },
  unsubscribe: { label: 'Unsubscribe', icon: 'ri-mail-close-line', category: 'Email', defaultData: { text: 'Unsubscribe from this list', url: '{{unsubscribe_url}}' }, defaultStyle: { fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' } },
  viewInBrowser: { label: 'View in Browser', icon: 'ri-window-line', category: 'Email', defaultData: { text: 'View this email in your browser' }, defaultStyle: { fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '8px 0' } },
};

export const BLOCK_CATEGORIES: { name: string; blocks: string[] }[] = [
  { name: 'Basic', blocks: ['heading', 'text', 'image', 'button', 'divider', 'spacer'] },
  { name: 'Layout', blocks: ['oneColumn', 'twoColumns', 'threeColumns'] },
  { name: 'Business', blocks: ['logo', 'featureCard', 'contactDetails', 'socialLinks'] },
  { name: 'Email', blocks: ['preheader', 'header', 'footer', 'unsubscribe', 'viewInBrowser'] },
];

export const MERGE_TAGS = [
  { tag: 'first_name', label: 'First Name', supported: true },
  { tag: 'last_name', label: 'Last Name', supported: true },
  { tag: 'full_name', label: 'Full Name', supported: true },
  { tag: 'company_name', label: 'Company Name', supported: true },
  { tag: 'project_name', label: 'Project Name', supported: false },
  { tag: 'website_url', label: 'Website URL', supported: false },
  { tag: 'preview_url', label: 'Preview URL', supported: false },
  { tag: 'appointment_date', label: 'Appointment Date', supported: false },
  { tag: 'invoice_amount', label: 'Invoice Amount', supported: false },
  { tag: 'payment_url', label: 'Payment URL', supported: false },
  { tag: 'support_email', label: 'Support Email', supported: false },
  { tag: 'unsubscribe_url', label: 'Unsubscribe URL', supported: true },
];