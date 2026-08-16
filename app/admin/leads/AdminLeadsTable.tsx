'use client';

import { useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { Eye, Trash2, X, Clock, Mail, CheckCircle, XCircle } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  project_type: string | null;
  budget_range: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
}

interface AdminLeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export default function AdminLeadsTable({ leads, onStatusChange, onDelete }: AdminLeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'qualified': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'closed': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Type</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <motion.tr key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF]/10 to-[#00F0FF]/10 flex items-center justify-center text-xs font-bold text-[#0066FF]">
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <p className="text-sm font-semibold text-[#1E293B]">{lead.name}</p>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <a href={`mailto:${lead.email}`} className="text-sm text-[#0066FF] hover:underline">{lead.email}</a>
                </td>
                <td className="py-4 px-5 text-sm text-gray-500">{lead.project_type || '-'}</td>
                <td className="py-4 px-5 text-sm text-gray-500">{lead.budget_range || '-'}</td>
                <td className="py-4 px-5">
                  <select value={lead.status || 'new'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(lead.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${getStatusStyle(lead.status)} bg-transparent appearance-none`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="py-4 px-5 text-xs text-gray-400">{formatDate(lead.created_at)}</td>
                <td className="py-4 px-5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedLead(lead)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0066FF] transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(lead.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-lg w-full p-6"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1E293B]">Lead Details</h3>
                <button onClick={() => setSelectedLead(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0066FF]/10 to-[#00F0FF]/10 flex items-center justify-center text-lg font-bold text-[#0066FF]">
                    {selectedLead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B]">{selectedLead.name}</p>
                    <p className="text-sm text-gray-400">{selectedLead.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Project Type</p><p className="font-medium">{selectedLead.project_type || '-'}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budget</p><p className="font-medium">{selectedLead.budget_range || '-'}</p></div>
                </div>
                <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Message</p><p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">{selectedLead.message || 'No message'}</p></div>
                <div className="flex items-center justify-between pt-2">
                  <select value={selectedLead.status || 'new'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { onStatusChange(selectedLead.id, e.target.value); setSelectedLead({ ...selectedLead, status: e.target.value }); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="text-xs text-gray-400">{new Date(selectedLead.created_at).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#1E293B] mb-2">Delete Lead?</h3>
              <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
