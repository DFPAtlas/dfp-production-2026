'use client';

import { motion } from '@/components/motion';
import { Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Milestone {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  target_date: string | null;
  order_index: number | null;
  amount: number | null;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string | null;
  project_name?: string;
}

interface MilestonesTableProps {
  milestones: Milestone[];
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function MilestonesTable({ milestones, onEdit, onDelete, onStatusChange }: MilestonesTableProps) {
  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'blocked': return 'bg-red-50 text-red-500 border-red-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getPaymentStyle = (paymentStatus: string | null, amount: number | null) => {
    if (!amount) return 'text-gray-300 text-xs';
    switch (paymentStatus) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Milestone</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
            <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Date</th>
            <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone, index) => (
            <motion.tr key={milestone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-4 px-5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {milestone.order_index || index + 1}
                </div>
              </td>
              <td className="py-4 px-5">
                <p className="text-sm font-semibold text-[#1E293B]">{milestone.title}</p>
                {milestone.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{milestone.description}</p>}
              </td>
              <td className="py-4 px-5 text-sm text-gray-500">{milestone.project_name || 'Unassigned'}</td>
              <td className="py-4 px-5">
                <div className="relative group">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${getStatusStyle(milestone.status)}`}>
                    {milestone.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : milestone.status === 'blocked' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {(milestone.status || 'pending').replace('_', ' ')}
                  </span>
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {['pending', 'in_progress', 'completed', 'blocked'].map(s => (
                      <button key={s} onClick={() => onStatusChange(milestone.id, s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer capitalize"
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </td>
              <td className="py-4 px-5">
                <span className="text-sm font-semibold text-[#1E293B]">{milestone.amount ? `£${milestone.amount.toLocaleString()}` : '—'}</span>
              </td>
              <td className="py-4 px-5">
                {milestone.amount ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getPaymentStyle(milestone.payment_status, milestone.amount)}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: milestone.payment_status === 'paid' ? '#10B981' : milestone.payment_status === 'pending' ? '#F59E0B' : '#9CA3AF' }} />
                    {milestone.payment_status || 'unpaid'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">No payment</span>
                )}
              </td>
              <td className="py-4 px-5">
                <span className="text-xs text-gray-400">
                  {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </td>
              <td className="py-4 px-5">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(milestone)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0066FF] transition-colors cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(milestone.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}