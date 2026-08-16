export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  active: boolean;
  organisation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  created_by: string | null;
  last_login_at: string | null;
  suspended_at: string | null;
  archived_at: string | null;
}

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  active: boolean;
  phone: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  user_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  project_lead: string | null;
  lead_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  project_type: string | null;
  budget_range: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  service_interest: string | null;
  location: string | null;
  assigned_to: string | null;
  source: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  client_id: string | null;
  name: string;
  slug: string | null;
  total_budget: number;
  budget: number;
  status: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  project_lead: string | null;
  priority: string;
  assigned_staff: string[];
  created_at: string | null;
  updated_at: string;
}

export interface MilestoneRow {
  id: string;
  project_id: string | null;
  title: string;
  name: string | null;
  description: string | null;
  status: string | null;
  target_date: string | null;
  due_date: string | null;
  order_index: number | null;
  sort_order: number;
  amount: number | null;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string;
}

export interface InvoiceRow {
  id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string | null;
  last_reminder_sent: string | null;
  updated_at: string;
}

export interface ProjectSubmissionRow {
  id: string;
  name: string;
  email: string;
  project_type: string;
  budget_range: string;
  initial_message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateRow {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  variables: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EmailImageRow {
  id: string;
  template_id: string | null;
  file_name: string;
  storage_path: string;
  public_url: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export type ConnectionStatus = 'Connected' | 'Partially Connected' | 'Configuration Required' | 'Failed' | 'Unknown';

export interface DiagnosticsResult {
  supabaseUrl: string;
  connection: ConnectionStatus;
  connectionError: string | null;
  authAvailable: ConnectionStatus;
  authError: string | null;
  profileLinked: ConnectionStatus;
  profile: { email: string | null; role: string | null; fullName: string | null } | null;
  profileError: string | null;
  dbQuery: ConnectionStatus;
  dbQueryResult: { clients: number; leads: number; projects: number } | null;
  dbQueryError: string | null;
  storageReady: ConnectionStatus;
  storageError: string | null;
  realtimeReady: ConnectionStatus;
  realtimeError: string | null;
  environment: string;
  lastTestTime: string;
}

