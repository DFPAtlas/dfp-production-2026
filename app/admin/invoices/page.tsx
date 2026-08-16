'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { FileText, Search, RefreshCw, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import FinanceOverview from '@/components/admin/finance/FinanceOverview';
import InvoicesTable from '@/components/admin/finance/InvoicesTable';
import InvoiceForm from '@/components/admin/finance/InvoiceForm';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchInvoices = useCallback(async () => {
    const { data } = await supabase.from('invoices').select('*, clients(company_name, contact_name, email)').order('created_at', { ascending: false });
    if (data) setInvoices(data as Record<string, unknown>[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'cancelled') update.cancelled_at = new Date().toISOString();
    if (status === 'written_off') update.written_off_at = new Date().toISOString();
    const { error } = await supabase.from('invoices').update(update).eq('id', id);
    if (!error) {
      setInvoices(prev => prev.map(i => String(i.id) === id ? { ...i, ...update } : i));
      showNotification('success', `Invoice status changed to ${status.replace(/_/g, ' ')}`);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: linesErr } = await supabase.from('invoice_line_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) {
      setInvoices(prev => prev.filter(i => String(i.id) !== id));
      showNotification('success', 'Invoice deleted');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    setSendingReminder(invoiceId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invoice-reminders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoiceId })
      });
      const result = await response.json();
      if (result.success) {
        showNotification('success', `Reminder sent for ${result.invoice_number}`);
        setInvoices(prev => prev.map(i => String(i.id) === invoiceId ? { ...i, last_reminder_sent: new Date().toISOString() } : i));
      } else { showNotification('error', result.message || 'Failed to send reminder'); }
    } catch { showNotification('error', 'Failed to send reminder'); }
    finally { setSendingReminder(null); }
  };

  let displayedInvoices = invoices;
  if (statusFilter !== 'all') displayedInvoices = displayedInvoices.filter(i => String(i.status) === statusFilter);

  return (
    <AdminShell>
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${
              notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoices</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create, approve, issue and track client invoices</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>

        <FinanceOverview />

        {loading ? (
          <div className="mt-8 flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="mt-8 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by number, client, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none pr-8"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="awaiting_approval">Awaiting Approval</option>
                  <option value="approved">Approved</option>
                  <option value="issued">Issued</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                  <option value="disputed">Disputed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="written_off">Written Off</option>
                </select>
                <button
                  onClick={() => { setRefreshing(true); fetchInvoices(); }}
                  disabled={refreshing}
                  className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <InvoicesTable
              invoices={displayedInvoices}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSendReminder={handleSendReminder}
              sendingReminder={sendingReminder}
              searchQuery={searchQuery}
            />

            {invoices.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No invoices yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first invoice to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      <InvoiceForm isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} onSuccess={() => { showNotification('success', 'Invoice created'); fetchInvoices(); }} />
    </AdminShell>
  );
}