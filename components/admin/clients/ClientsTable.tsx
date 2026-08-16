'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/components/motion';
import { MoreHorizontal, Edit2, Trash2, Mail, Building2, Calendar, Phone, ChevronDown, ArrowUpRight } from 'lucide-react';
import { CLIENT_STATUS_STYLES, HEALTH_STATUS_STYLES } from '@/lib/client-definitions';

interface ClientRow {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  client_reference: string | null;
  account_manager: string | null;
  health_status: string | null;
  onboarding_state: string | null;
  portal_access_state: string | null;
  last_activity_at: string | null;
  created_at: string | null;
}

interface ClientsTableProps {
  clients: ClientRow[];
  onEdit: (client: ClientRow) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function ClientsTable({ clients, onEdit, onDelete, onStatusChange }: ClientsTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusStyle = (status: string) => CLIENT_STATUS_STYLES[status] || CLIENT_STATUS_STYLES['Active'];
  const healthStyle = (health: string | null) => HEALTH_STATUS_STYLES[health || 'Not Enough Data'] || HEALTH_STATUS_STYLES['Not Enough Data'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Health</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Activity</th>
            <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const ss = statusStyle(client.status);
            const hs = healthStyle(client.health_status);
            return (
              <tr key={client.id} className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-5">
                  <Link href={`/admin/clients/${client.id}`} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                      {(client.company_name || client.contact_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors">{client.company_name || 'Unnamed Company'}</p>
                      <p className="text-xs text-slate-400">{client.contact_name || 'No contact'}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-5">
                  <span className="text-xs font-mono text-slate-400">{client.client_reference || '-'}</span>
                </td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${ss.bg} ${ss.text} ${ss.border}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />
                    {client.status}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${hs.bg} ${hs.text} ${hs.border}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hs.dot }} />
                    {client.health_status || 'Not Enough Data'}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {client.email || '-'}
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(client.last_activity_at || client.created_at)}
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center justify-end gap-1 relative">
                    <Link href={`/admin/clients/${client.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <button onClick={() => onEdit(client)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openMenu === client.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[180px] overflow-hidden"
                        >
                          <div className="p-1">
                            {['Active', 'At Risk', 'Paused', 'Offboarding', 'Former Client', 'Archived'].map(s => (
                              <button key={s} onClick={() => { onStatusChange(client.id, s); setOpenMenu(null); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              >
                                Set {s}
                              </button>
                            ))}
                            <div className="my-1 border-t border-[rgba(255,255,255,0.06)]" />
                            <button onClick={() => { onDelete(client.id); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              Archive Client
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}