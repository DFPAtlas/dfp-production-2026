'use client';

import { useState, useMemo } from 'react';
import { motion } from '@/components/motion';
import Link from 'next/link';
import { ArrowLeft, PoundSterling, Flag, Clock, ChevronDown } from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';
import { useCrmData } from '@/hooks/useCrmData';
import type { CrmLead } from '@/hooks/useCrmData';
import { PIPELINE_STAGES, STAGE_LABELS, STAGE_DOT_COLORS, PRIORITY_LABELS } from '@/lib/crm-definitions';
import type { LeadStage } from '@/lib/crm-definitions';

function formatCurrency(val: number | null): string {
  if (val == null) return '';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
}

export default function PipelinePage() {
  const { leads, loading, error, updateLead } = useCrmData();

  const leadsByStage = useMemo(() => {
    const map: Record<string, CrmLead[]> = {};
    for (const stage of PIPELINE_STAGES) map[stage] = [];
    for (const lead of leads) {
      if (map[lead.stage]) map[lead.stage].push(lead);
    }
    return map;
  }, [leads]);

  const stageTotals = useMemo(() => {
    const totals: Record<string, { count: number; value: number }> = {};
    for (const stage of PIPELINE_STAGES) {
      const stageLeads = leadsByStage[stage] || [];
      totals[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
      };
    }
    return totals;
  }, [leadsByStage]);

  const totalPipeline = Object.values(stageTotals).reduce((s, t) => s + t.value, 0);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStage: LeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;
    await updateLead(leadId, { stage: newStage, stage_changed_at: new Date().toISOString() });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-full mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/leads" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Pipeline</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Total pipeline value: <span className="text-[#06B6D4] font-semibold">{formatCurrency(totalPipeline)}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage] || [];
            const totals = stageTotals[stage];
            return (
              <div key={stage}
                className="flex-shrink-0 w-[280px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_DOT_COLORS[stage] }} />
                    <h3 className="text-sm font-semibold text-white">{STAGE_LABELS[stage]}</h3>
                    <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{totals.count}</span>
                  </div>
                  {totals.value > 0 && (
                    <span className="text-xs text-slate-400">{formatCurrency(totals.value)}</span>
                  )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {stageLeads.map((lead) => {
                    const initials = (lead.contact_name || lead.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const overdue = lead.next_action_due && new Date(lead.next_action_due) < new Date();
                    return (
                      <motion.div key={lead.id} layout
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, lead.id)}
                        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-[rgba(255,255,255,0.15)] transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Link href={`/admin/leads/${lead.id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors truncate max-w-[180px]">
                            {lead.company_name || lead.name}
                          </Link>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {PRIORITY_LABELS[lead.priority]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {lead.estimated_value != null && lead.estimated_value > 0 && (
                            <span className="flex items-center gap-1">
                              <PoundSterling className="w-3 h-3" /> {formatCurrency(lead.estimated_value)}
                            </span>
                          )}
                          {lead.next_action_due && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                              <Clock className="w-3 h-3" />
                              {new Date(lead.next_action_due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {lead.lead_reference && (
                          <p className="text-xs text-slate-500 mt-1.5 font-mono">{lead.lead_reference}</p>
                        )}
                      </motion.div>
                    );
                  })}
                  {stageLeads.length === 0 && (
                    <div className="border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl p-8 text-center">
                      <p className="text-xs text-slate-600">Drop leads here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

