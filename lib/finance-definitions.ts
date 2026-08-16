import { supabase } from '@/lib/supabase';

export const INVOICE_STATUSES = [
  'draft', 'awaiting_approval', 'approved', 'issued',
  'partially_paid', 'paid', 'overdue', 'disputed',
  'cancelled', 'written_off', 'archived'
] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const INVOICE_TYPES = ['project', 'maintenance', 'hosting', 'subscription', 'consulting', 'other'] as const;
export type InvoiceType = typeof INVOICE_TYPES[number];

export const PAYMENT_METHODS = ['bank_transfer', 'stripe', 'cash', 'cheque', 'direct_debit', 'other'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_STATUSES = [
  'pending', 'processing', 'succeeded', 'failed',
  'cancelled', 'refunded', 'partially_refunded', 'unknown'
] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const EXPENSE_STATUSES = [
  'draft', 'submitted', 'under_review', 'changes_required',
  'approved', 'rejected', 'paid', 'archived'
] as const;
export type ExpenseStatus = typeof EXPENSE_STATUSES[number];

export const EXPENSE_CATEGORIES = [
  'hosting', 'domains', 'apis', 'infrastructure', 'software',
  'travel', 'equipment', 'training', 'contractor', 'office',
  'marketing', 'legal', 'insurance', 'other'
] as const;

export const DISPUTE_STATUSES = ['open', 'under_review', 'resolved_in_favour', 'resolved_against', 'closed'] as const;

export const CREDIT_STATUSES = ['draft', 'approved', 'issued', 'applied', 'void'] as const;

export const REFUND_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;

export const DELIVERY_STATUSES = ['not_sent', 'sending', 'sent', 'delivered', 'bounced', 'failed'] as const;

export const RECONCILIATION_STATES = ['unmatched', 'partial', 'matched', 'overpaid', 'disputed'] as const;

export const PAYMENT_TERMS = ['NET_7', 'NET_14', 'NET_30', 'NET_60', 'NET_90', 'IMMEDIATE', 'CUSTOM'] as const;

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  awaiting_approval: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  issued: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  partially_paid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  disputed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  written_off: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  archived: 'bg-slate-700/10 text-slate-500 border-slate-700/20',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  issued: 'Issued',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
  written_off: 'Written Off',
  archived: 'Archived',
};

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DFP-INV-${year}${month}-${seq}`;
}

export function generateCreditReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DFP-CRN-${year}-${seq}`;
}

export function generateExpenseReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DFP-EXP-${year}-${seq}`;
}

export function generateSupplierReference(): string {
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DFP-SUP-${seq}`;
}

export function formatMoney(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
}

export function calculateInvoiceTotals(lines: { quantity: number; unit_price: number; discount: number; tax_rate: number }[]) {
  const subtotal = lines.reduce((s, l) => {
    const lineGross = l.quantity * l.unit_price;
    return s + (lineGross - (l.discount || 0));
  }, 0);
  const tax = lines.reduce((s, l) => {
    const lineGross = l.quantity * l.unit_price;
    const afterDiscount = lineGross - (l.discount || 0);
    return s + (afterDiscount * ((l.tax_rate || 0) / 100));
  }, 0);
  const total = subtotal + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function subtractInMinorUnits(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}

export function addInMinorUnits(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

export function isInvoiceMutable(status: string): boolean {
  return status === 'draft' || status === 'awaiting_approval';
}

export function isInvoiceEditable(status: string): boolean {
  return status === 'draft';
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', CAD: 'C$', AUD: 'A$' };
  return symbols[currency] || currency;
}

export interface InvoiceLineItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  project_id?: string;
  service_id?: string;
  milestone_id?: string;
  order_index: number;
}

export interface Payment {
  id?: string;
  invoice_id: string;
  client_id?: string;
  amount: number;
  currency: string;
  payment_date: string;
  method: string;
  status: string;
  provider?: string;
  provider_payment_id?: string;
  provider_event_id?: string;
  idempotency_key?: string;
  reconciliation_state: string;
  failure_reason?: string;
  recorded_by?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  confirmation_reason?: string;
  created_at?: string;
}

export interface CreditNote {
  id?: string;
  credit_reference: string;
  invoice_id: string;
  client_id?: string;
  reason: string;
  amount: number;
  currency: string;
  status: string;
  applied_amount: number;
  approved_by?: string;
  approved_at?: string;
  issued_at?: string;
  notes?: string;
  created_at?: string;
}

export interface Refund {
  id?: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  provider_refund_id?: string;
  processed_by?: string;
  processed_at?: string;
  notes?: string;
  created_at?: string;
}

export interface Expense {
  id?: string;
  expense_reference: string;
  claimant_id?: string;
  supplier_id?: string;
  project_id?: string;
  client_id?: string;
  category: string;
  description: string;
  expense_date: string;
  amount: number;
  currency: string;
  tax_amount: number;
  receipt_url?: string;
  status: string;
  reviewer_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  payment_state: string;
  paid_at?: string;
  created_at?: string;
}

export interface Supplier {
  id?: string;
  supplier_reference: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  payment_method?: string;
  payment_destination_masked?: string;
  tax_id?: string;
  tax_registered: boolean;
  status: string;
  verified_at?: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceDispute {
  id?: string;
  invoice_id: string;
  source: string;
  amount?: number;
  currency: string;
  status: string;
  reason?: string;
  evidence_url?: string;
  deadline?: string;
  owner_id?: string;
  outcome?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at?: string;
}