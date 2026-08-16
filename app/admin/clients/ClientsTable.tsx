'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { MoreHorizontal, Edit2, Trash2, Mail, Phone, Building2, Calendar, X } from 'lucide-react';

interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
}

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function ClientsTable({ clients, onEdit, onDelete, onStatusChange }: ClientsTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'inactive': return 'bg-gray-50 text-gray-500 border-gray-100';
      case 'prospect': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Added</th>
            <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                    {client.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">{client.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-400">{client.email || 'No email'}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-3.5 h-3.5" />
                  {client.company_name || '-'}
                </div>
              </td>
              <td className="py-4 px-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone || '-'}
                </div>
              </td>
              <td className="py-4 px-5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(client.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: client.status === 'active' ? '#10B981' : client.status === 'inactive' ? '#9CA3AF' : client.status === 'prospect' ? '#F59E0B' : '#3B82F6' }} />
                  {client.status || 'active'}
                </span>
              </td>
              <td className="py-4 px-5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(client.created_at)}
                </div>
              </td>
              <td className="py-4 px-5">
                <div className="flex items-center justify-end gap-1 relative">
                  <button onClick={() => onEdit(client)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0066FF] transition-colors cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {openMenu === client.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden"
                      >
                        <div className="p-1">
                          {['active', 'inactive', 'prospect'].map(s => (
                            <button key={s} onClick={() => { onStatusChange(client.id, s); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors cursor-pointer capitalize"
                            >
                              Set {s}
                            </button>
                          ))}
                          <div className="my-1 border-t border-gray-50" />
                          <button onClick={() => { onDelete(client.id); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Delete Client
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}