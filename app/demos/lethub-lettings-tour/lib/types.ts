export interface Property {
  id: string;
  address: string;
  city: string;
  status: 'Occupied' | 'Vacant';
  tenantName: string;
  rentAmount: number;
  rentFrequency: string;
  nextPaymentDate: string;
  complianceStatus: 'Current' | 'Expiring Soon' | 'Action Required';
  openRepairs: number;
  healthScore: number;
}

export interface Tenancy {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  depositStatus: string;
  nextReviewDate: string;
}

export interface MaintenanceIssue {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Assigned' | 'In Progress' | 'Complete';
  contractor?: string;
  contractorType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface ComplianceItem {
  id: string;
  propertyId: string;
  type: string;
  expiryDate: string;
  status: 'Current' | 'Expiring Soon' | 'Action Required';
}

export interface RentRecord {
  id: string;
  propertyId: string;
  tenantName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Outstanding';
  paidDate?: string;
}

export interface Document {
  id: string;
  propertyId: string;
  category: string;
  title: string;
  date: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  property?: string;
  type: 'maintenance' | 'compliance' | 'rent' | 'message' | 'general';
}

export interface AttentionItem {
  id: string;
  type: 'maintenance' | 'compliance' | 'rent';
  property: string;
  title: string;
  detail: string;
  priority: 'High' | 'Medium' | 'Low';
  propertyId: string;
}

export interface Insight {
  id: string;
  category: 'maintenance' | 'compliance' | 'rent';
  title: string;
  detail: string;
  status: 'active' | 'resolved';
  actionText: string;
}

export type View =
  | 'overview'
  | 'properties'
  | 'tenancies'
  | 'maintenance'
  | 'compliance'
  | 'rent'
  | 'documents'
  | 'messages';

export type Perspective = 'manager' | 'tenant';