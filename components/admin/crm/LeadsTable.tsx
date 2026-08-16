'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import Link from 'next/link';
import {
  ChevronDown, ChevronUp, ArrowUpRight, Eye, Trash2, MoreHorizontal,
  UserCheck, Clock, AlertCircle, CheckCircle2, XCircle, Ban, Archive, Flag,
} from 'lucide-react';
import type { CrmLead } from '@/hooks/useCrmData';
import { STAGE_LABELS, STAGE_COLORS, STAGE_DOT_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, SOURCE_LABELS, stageRequiresReason } from '@/lib/crm-definitions';
import type { LeadStage, LeadPriority } from '@/lib/crm-definitions';

interface LeadsTableProps {
  leads: CrmLead[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onStageChange: (id: string, stage: LeadStage, reason?: string) => void;
  onPriorityChange: (id: string, priority: LeadPriority) => void;
  onDelete: (id: string) => void;
  onAssign: (ids: string[]) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function formatCurrency(val: number | null, currency: string | null): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LeadsTable({
  leads, selectedIds, onToggleSelect, onToggleAll, onStageChange, onPriorityChange,
  onDelete, onAssign, sortField, sortDir, onSort,
}: LeadsTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [stageModal, setStageModal] = useState<{ id: string; stage: LeadStage } | null>(null);
  const [stageReason, setStageReason] = useState('');

  const handleStageClick = (id: string, stage: LeadStage) => {
    if (stageRequiresReason(stage)) {
      setStageModal({ id, stage });
      setStageReason('');
    } else {
      onStageChange(id, stage);
    }
  };

  const confirmStageChange = () => {
    if (stageModal) {
      onStageChange(stageModal.id, stageModal.stage, stageReason || undefined);
      setStageModal(null);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-600" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#06B6D4]" /> : <ChevronDown className="w-3 h-3 text-[#06B6D4]" />;
  };

  const allSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left py-3 px-3">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('lead_reference')}>
                <span className="flex items-center gap-1">Ref <SortIcon field="lead_reference" /></span>
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('company_name')}>
                <span className="flex items-center gap-1">Company <SortIcon field="company_name" /></span>
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Service</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('stage')}>
                <span className="flex items-center gap-1">Stage <SortIcon field="stage" /></span>
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('priority')}>
                <span className="flex items-center gap-1">Priority <SortIcon field="priority" /></span>
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Value</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('next_action_due')}>
                <span className="flex items-center gap-1">Next Action <SortIcon field="next_action_due" /></span>
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => onSort('created_at')}>
                <span className="flex items-center gap-1">Created <SortIcon field="created_at" /></span>
              </th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isSelected = selectedIds.has(lead.id);
              const initials = (lead.contact_name || lead.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const overdue = lead.next_action_due && new Date(lead.next_action_due) < new Date();
              return (
                <tr key={lead.id} className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-[#06B6D4]/5' : ''}`}>
                  <td className="py-3 px-3">
                    <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(lead.id)} className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-white/5 cursor-pointer" />
                  </td>
                  <td className="py-3 px-3">
                    <Link href={`/admin/leads/${lead.id}`} className="text-sm font-mono text-[#06B6D4] hover:underline whitespace-nowrap">
                      {lead.lead_reference || '-'}
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF]/15 to-[#00F0FF]/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[160px]">{lead.company_name || lead.name}</p>
                        {lead.company_name && <p className="text-xs text-slate-500 truncate max-w-[160px]">{lead.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm">
                      <p className="text-slate-300 truncate max-w-[140px]">{lead.contact_name || lead.name}</p>
                      <a href={`mailto:${lead.email}`} className="text-xs text-[#06B6D4] hover:underline truncate block max-w-[140px]">{lead.email}</a>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-slate-300 truncate block max-w-[120px]">{lead.service_interest || lead.project_type || '-'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap cursor-pointer transition-colors ${STAGE_COLORS[lead.stage] || STAGE_COLORS.new}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STAGE_DOT_COLORS[lead.stage] || STAGE_DOT_COLORS.new }} />
                        {STAGE_LABELS[lead.stage] || lead.stage}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                      <AnimatePresence>
                        {openMenu === lead.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-20 min-w-[190px] overflow-hidden"
                          >
                            <div className="p-1 max-h-[300px] overflow-y-auto">
                              {(['new','review_required','qualified','contact_planned','contacted','discovery','proposal','negotiation','won','lost','disqualified','on_hold','archived'] as LeadStage[]).map(s => (
                                <button key={s} onClick={() => { handleStageClick(lead.id, s); setOpenMenu(null); }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${lead.stage === s ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                >
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_DOT_COLORS[s] }} />
                                  {STAGE_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="relative">
                      <button onClick={() => {
                        const priorities: LeadPriority[] = ['low', 'medium', 'high', 'critical'];
                        const idx = priorities.indexOf(lead.priority);
                        onPriorityChange(lead.id, priorities[(idx + 1) % 4]);
                      }}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer whitespace-nowrap transition-colors ${PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.medium}`}
                      >
                        <Flag className="w-3 h-3" />
                        {PRIORITY_LABELS[lead.priority] || lead.priority}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-slate-300 whitespace-nowrap">
                    {formatCurrency(lead.estimated_value, lead.currency)}
                  </td>
                  <td className="py-3 px-3">
                    {lead.next_action_due ? (
                      <div className="flex items-center gap-1.5">
                        {overdue ? <AlertCircle className="w-3.5 h-3.5 text-red-400" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                          {formatDate(lead.next_action_due)}
                        </span>
                      </div>
                    ) : <span className="text-xs text-slate-600">-</span>}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/leads/${lead.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => onDelete(lead.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {stageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setStageModal(null)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-1">Change Stage to &ldquo;{STAGE_LABELS[stageModal.stage]}&rdquo;</h3>
              <p className="text-sm text-slate-400 mb-4">A reason is required for this stage change.</p>
              <textarea
                value={stageReason}
                onChange={(e) => setStageReason(e.target.value.slice(0, 500))}
                rows={3} maxLength={500}
                placeholder="Enter reason..."
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">{stageReason.length}/500</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStageModal(null)} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 cursor-pointer">Cancel</button>
                <button onClick={confirmStageChange} disabled={!stageReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
