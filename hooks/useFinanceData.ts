'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface FinanceOverview {
  draftCount: number;
  awaitingApprovalCount: number;
  issuedCount: number;
  overdueCount: number;
  overdueAmountGb: number;
  outstandingAmountGb: number;
  paymentsReceivedCount: number;
  paymentsReceivedAmount: number;
  failedPaymentCount: number;
  expensesAwaitingReview: number;
  disputedCount: number;
  loading: boolean;
}

export function useFinanceOverview(): FinanceOverview {
  const [data, setData] = useState<FinanceOverview>({
    draftCount: 0, awaitingApprovalCount: 0, issuedCount: 0,
    overdueCount: 0, overdueAmountGb: 0, outstandingAmountGb: 0,
    paymentsReceivedCount: 0, paymentsReceivedAmount: 0,
    failedPaymentCount: 0, expensesAwaitingReview: 0,
    disputedCount: 0, loading: true
  });

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString();
      const [{ data: invoices }, { data: payments }, { data: expenses }, { data: disputes }] = await Promise.all([
        supabase.from('invoices').select('status,total,amount_outstanding,due_date,currency').not('status', 'eq', 'archived'),
        supabase.from('payments').select('status,amount'),
        supabase.from('expenses').select('status').eq('status', 'under_review'),
        supabase.from('invoice_disputes').select('status').eq('status', 'open'),
      ]);

      const invs = invoices || [];
      setData({
        draftCount: invs.filter(i => i.status === 'draft').length,
        awaitingApprovalCount: invs.filter(i => i.status === 'awaiting_approval').length,
        issuedCount: invs.filter(i => i.status === 'issued').length,
        overdueCount: invs.filter(i => i.status === 'overdue' || (i.status === 'issued' && i.due_date && new Date(i.due_date) < new Date())).length,
        overdueAmountGb: invs.filter(i => (i.status === 'overdue' || (i.status === 'issued' && i.due_date && new Date(i.due_date) < new Date())) && i.currency === 'GBP').reduce((s, i) => s + parseFloat(String(i.amount_outstanding || i.total || 0)), 0),
        outstandingAmountGb: invs.filter(i => i.currency === 'GBP' && i.status !== 'draft' && i.status !== 'cancelled' && i.status !== 'written_off' && i.status !== 'archived' && i.status !== 'paid').reduce((s, i) => s + parseFloat(String(i.amount_outstanding || 0)), 0),
        paymentsReceivedCount: (payments || []).filter(p => p.status === 'succeeded').length,
        paymentsReceivedAmount: (payments || []).filter(p => p.status === 'succeeded').reduce((s, p) => s + parseFloat(String(p.amount)), 0),
        failedPaymentCount: (payments || []).filter(p => p.status === 'failed').length,
        expensesAwaitingReview: (expenses || []).length,
        disputedCount: (disputes || []).length,
        loading: false
      });
    }
    load();
  }, []);

  return data;
}

export function useInvoiceDetail(invoiceId: string) {
  const [invoice, setInvoice] = useState<Record<string, unknown> | null>(null);
  const [lineItems, setLineItems] = useState<Record<string, unknown>[]>([]);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [credits, setCredits] = useState<Record<string, unknown>[]>([]);
  const [refunds, setRefunds] = useState<Record<string, unknown>[]>([]);
  const [dispute, setDispute] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: inv }, { data: lines }, { data: pays },
      { data: creds }, { data: refs }, { data: disp },
    ] = await Promise.all([
      supabase.from('invoices').select('*, clients(company_name, contact_name, email)').eq('id', invoiceId).maybeSingle(),
      supabase.from('invoice_line_items').select('*').eq('invoice_id', invoiceId).order('order_index'),
      supabase.from('payments').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false }),
      supabase.from('credit_notes').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false }),
      supabase.from('refunds').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false }),
      supabase.from('invoice_disputes').select('*').eq('invoice_id', invoiceId).maybeSingle(),
    ]);
    if (inv) setInvoice(inv as Record<string, unknown>);
    if (lines) setLineItems(lines as Record<string, unknown>[]);
    if (pays) setPayments(pays as Record<string, unknown>[]);
    if (creds) setCredits(creds as Record<string, unknown>[]);
    if (refs) setRefunds(refs as Record<string, unknown>[]);
    if (disp) setDispute(disp as Record<string, unknown>);
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { invoice, lineItems, payments, credits, refunds, dispute, loading, refresh: fetchAll };
}

export function useFinanceData() {
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);

  const fetchInvoices = useCallback(async () => {
    const { data } = await supabase.from('invoices').select('*, clients(company_name, contact_name, email)').order('created_at', { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async () => {
    const { data } = await supabase.from('clients').select('id,company_name,contact_name,email').order('company_name');
    if (data) setClients(data);
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('id,name,client_id').order('name');
    if (data) setProjects(data);
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProjects();
  }, [fetchInvoices, fetchClients, fetchProjects]);

  return { invoices, clients, projects, loading, refreshInvoices: fetchInvoices };
}