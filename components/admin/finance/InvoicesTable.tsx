'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { Eye, Trash2, CheckCircle, X, ChevronDown, Mail, MoreHorizontal } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, formatMoney } from '@/lib/finance-definitions';
import Link from 'next/link';

interface InvoicesTableProps {
  invoices: Record<string, unknown>[];
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSendReminder: (id: string) => Promise<void>;
  sendingReminder: string | null;
  searchQuery: string;
}

export default function InvoicesTable({ invoices, onStatusChange, onDelete, onSendReminder, sendingReminder, searchQuery }: InvoicesTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const filtered = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const client = (inv.clients as { company_name?: string; contact_name?: string } | null);
    return (
      String(inv.invoice_number || '').toLowerCase().includes(q) ||
      String(inv.description || '').toLowerCase().includes(q) ||
      (client?.company_name || '').toLowerCase().includes(q) ||
      (client?.contact_name || '').toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Issue/Due</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid</th>
            <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((inv) => {
            const client = inv.clients as { company_name?: string; contact_name?: string; email?: string } | null;
            const status = String(inv.status || 'draft');
            const total = parseFloat(String(inv.total || inv.amount || 0));
            const amountPaid = parseFloat(String(inv.amount_paid || 0));
            const currency = String(inv.currency || 'GBP');
            const dueDate = inv.due_date ? new Date(String(inv.due_date)) : null;
            const isOverdue = dueDate && dueDate < new Date() && status !== 'paid' && status !== 'cancelled' && status !== 'written_off' && status !== 'archived';

            return (
              <motion.tr key={String(inv.id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 px-5">
                  <Link href={`/admin/invoices/${inv.id}`} className="block group cursor-pointer">
                    <p className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors">{String(inv.invoice_number || '')}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{String(inv.description || '')}</p>
                  </Link>
                </td>
                <td className="py-4 px-5">
                  <p className="text-sm text-white">{client?.company_name || client?.contact_name || 'Unknown'}</p>
                  {client?.email && <p className="text-xs text-slate-400">{String(client.email)}</p>}
                </td>
                <td className="py-4 px-5">
                  <p className="text-sm font-bold text-[#06B6D4]">{formatMoney(total, currency)}</p>
                  {amountPaid > 0 && status !== 'paid' && (
                    <p className="text-xs text-slate-400">{formatMoney(amountPaid, currency)} paid</p>
                  )}
                </td>
                <td className="py-4 px-5">
                  {inv.issue_date ? (
                    <p className="text-xs text-slate-300">Issued: {new Date(String(inv.issue_date)).toLocaleDateString('en-GB')}</p>
                  ) : null}
                  {dueDate && (
                    <p className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                      Due: {dueDate.toLocaleDateString('en-GB')}
                    </p>
                  )}
                </td>
                <td className="py-4 px-5">
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdown(statusDropdown === String(inv.id) ? null : String(inv.id))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer flex items-center gap-1 ${STATUS_COLORS[status] || 'bg-white/5 text-slate-400 border-white/10'}`}
                    >
                      {STATUS_LABELS[status] || status}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {statusDropdown === String(inv.id) && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 mt-1 w-40 bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-30 py-1"
                        >
                          {['draft','awaiting_approval','approved','issued','overdue','paid','disputed','cancelled','written_off'].map(s => (
                            <button key={s} onClick={() => { onStatusChange(String(inv.id), s); setStatusDropdown(null); }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            >
                              {STATUS_LABELS[s] || s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <p className="text-sm text-slate-300">{formatMoney(amountPaid, currency)}</p>
                  {status === 'paid' && inv.paid_at != null && (
                    <p className="text-xs text-emerald-400">{new Date(String(inv.paid_at)).toLocaleDateString('en-GB')}</p>
                  )}
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/invoices/${inv.id}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {status !== 'paid' && status !== 'cancelled' && status !== 'written_off' && (
                      <button onClick={() => onSendReminder(String(inv.id))} disabled={sendingReminder === String(inv.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {sendingReminder === String(inv.id) ? (
                          <div className="w-4 h-4 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
                        ) : <Mail className="w-4 h-4" />}
                      </button>
                    )}
                    {deleteConfirm === String(inv.id) ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => { onDelete(String(inv.id)); setDeleteConfirm(null); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        ><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer"
                        ><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(String(inv.id))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      ><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
