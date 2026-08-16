'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  FileText, Download, CreditCard, CheckCircle, Clock,
  AlertTriangle, Search, ChevronDown, X, Calendar, PoundSterling, ArrowUpDown,
} from 'lucide-react';
import PortalShell from '../PortalShell';



const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.supabase.co', '.functions.supabase.co');

interface Invoice {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

type FilterTab = 'all' | 'paid' | 'pending' | 'overdue';
type SortKey = 'invoice_number' | 'amount' | 'due_date' | 'status';
type SortDir = 'asc' | 'desc';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    paid: { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    pending: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', icon: <Clock className="w-3.5 h-3.5" /> },
    overdue: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} whitespace-nowrap`}>{c.icon}{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function downloadInvoice(invoice: Invoice) {
  const content = `INVOICE\n========================================\nInvoice Number: ${invoice.invoice_number}\nDate: ${formatDate(invoice.created_at)}\nDue Date: ${formatDate(invoice.due_date)}\nStatus: ${invoice.status.toUpperCase()}\n========================================\nDescription: ${invoice.description}\nAmount: £${Number(invoice.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}\n========================================\nPaid At: ${invoice.paid_at ? formatDate(invoice.paid_at) : 'Not yet paid'}\n========================================\nDigital Footprint \u2014 Reshaping Your Digital World`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${invoice.invoice_number}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('due_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!clientData) { setLoading(false); return; }

      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (data) setInvoices(data as Invoice[]);
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  const handlePay = async (invoice: Invoice) => {
    setPayLoading(invoice.id);
    setPayError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ invoiceId: invoice.id, amount: Number(invoice.amount), description: invoice.description, customerEmail: session?.user?.email, successUrl: `${window.location.origin}/portal/invoices?paid=true`, cancelUrl: `${window.location.origin}/portal/invoices`, mode: 'payment' }),
      });
      const result = await res.json();
      if (result.url) window.location.href = result.url;
      else setPayError('Failed to create payment session.');
    } catch { setPayError('Something went wrong.'); }
    finally { setPayLoading(null); }
  };

  const filtered = invoices.filter(i => filter === 'all' || i.status === filter).filter(i =>
    search === '' || i.invoice_number.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'invoice_number') cmp = a.invoice_number.localeCompare(b.invoice_number);
    else if (sortKey === 'amount') cmp = Number(a.amount) - Number(b.amount);
    else if (sortKey === 'due_date') cmp = (a.due_date || '').localeCompare(b.due_date || '');
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalOutstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'paid', label: 'Paid', count: stats.paid },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'overdue', label: 'Overdue', count: stats.overdue },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      {payError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl text-sm border bg-red-100 text-red-700 border-red-200">
          <span>{payError}</span>
          <button onClick={() => setPayError(null)} className="ml-3 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0" aria-label="Dismiss">
            <i className="ri-close-line w-4 h-4 flex items-center justify-center" />
          </button>
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Billing Centre</h1>
          <p className="text-slate-400 mt-1">Manage your invoices and payments</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Outstanding Balance', value: `£${totalOutstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, color: '#F59E0B', icon: AlertTriangle },
            { label: 'Total Paid', value: `£${totalPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, color: '#10B981', icon: CheckCircle },
            { label: 'Pending', value: stats.pending, color: '#06B6D4', icon: Clock },
            { label: 'Overdue', value: stats.overdue, color: '#EF4444', icon: AlertTriangle },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400 font-medium">{s.label}</span>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-[rgba(255,255,255,0.06)]">
                {filterTabs.map((tab) => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${filter === tab.key ? 'bg-[#06B6D4] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    {tab.label} <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search invoices..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-full sm:w-56 pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 focus:bg-white/[0.08] focus:outline-none focus:border-[#06B6D4]/40 text-white placeholder:text-slate-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <button onClick={() => toggleSort('invoice_number')} className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">Invoice <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-4">Description</div>
            <button onClick={() => toggleSort('amount')} className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">Amount <ArrowUpDown className="w-3 h-3" /></button>
            <button onClick={() => toggleSort('status')} className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">Status <ArrowUpDown className="w-3 h-3" /></button>
            <button onClick={() => toggleSort('due_date')} className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">Due Date <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                <p className="text-sm text-slate-400">No invoices found</p>
                {search && <button onClick={() => { setSearch(''); setFilter('all'); }} className="mt-2 text-sm text-[#06B6D4] hover:underline cursor-pointer font-medium">Clear filters</button>}
              </div>
            ) : (
              filtered.map((invoice, i) => (
                <motion.div key={invoice.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="lg:col-span-2 flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 flex-shrink-0"><FileText className="w-4 h-4 text-slate-400" /></div>
                    <div><p className="text-sm font-semibold text-white">{invoice.invoice_number}</p><p className="text-xs text-slate-500 lg:hidden">{formatShortDate(invoice.due_date)}</p></div>
                  </div>
                  <div className="lg:col-span-4">
                    <p className="text-sm text-slate-300 line-clamp-1">{invoice.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Issued {formatShortDate(invoice.created_at)}</p>
                  </div>
                  <div className="lg:col-span-2 flex items-center gap-1">
                    <PoundSterling className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-white">{Number(invoice.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="lg:col-span-1"><StatusBadge status={invoice.status} /></div>
                  <div className="lg:col-span-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`text-sm ${invoice.status === 'overdue' ? 'text-[#EF4444] font-semibold' : 'text-slate-300'}`}>{formatDate(invoice.due_date)}</span>
                    {invoice.paid_at && <span className="text-xs text-[#10B981] ml-1">(Paid {formatShortDate(invoice.paid_at)})</span>}
                  </div>
                  <div className="lg:col-span-1 flex items-center justify-end gap-1">
                    {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                      <button onClick={() => handlePay(invoice)} disabled={payLoading === invoice.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60">
                        {payLoading === invoice.id ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}Pay Now
                      </button>
                    )}
                    <button onClick={() => setSelectedInvoice(invoice)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => downloadInvoice(invoice)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><Download className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <div className="px-5 py-3 bg-white/[0.02] border-t border-[rgba(255,255,255,0.06)] text-xs text-slate-500">
            Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedInvoice && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInvoice(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} className="bg-[#1E293B] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)]">
                  <h3 className="text-lg font-bold text-white">Invoice Details</h3>
                  <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: 'Invoice Number', value: selectedInvoice.invoice_number },
                    { label: 'Amount', value: `£${Number(selectedInvoice.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, bold: true },
                    { label: 'Description', value: selectedInvoice.description },
                    { label: 'Issued Date', value: formatDate(selectedInvoice.created_at) },
                    { label: 'Due Date', value: formatDate(selectedInvoice.due_date), highlight: selectedInvoice.status === 'overdue' },
                    ...(selectedInvoice.paid_at ? [{ label: 'Paid At', value: new Date(selectedInvoice.paid_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), color: 'text-[#10B981]' }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{row.label}</span>
                      <span className={`text-sm ${row.bold ? 'text-lg font-bold text-white' : row.color ? row.color + ' font-medium' : row.highlight ? 'text-[#EF4444] font-semibold' : 'text-slate-300 text-right max-w-[60%]'}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Status</span><StatusBadge status={selectedInvoice.status} /></div>
                </div>
                <div className="flex items-center gap-3 p-5 border-t border-[rgba(255,255,255,0.08)] bg-white/[0.02]">
                  <button onClick={() => { downloadInvoice(selectedInvoice); setSelectedInvoice(null); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-300 hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"><Download className="w-4 h-4" />Download</button>
                  {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                    <button onClick={() => { handlePay(selectedInvoice); setSelectedInvoice(null); }} disabled={payLoading === selectedInvoice.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60">
                      {payLoading === selectedInvoice.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}Pay Now
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}
