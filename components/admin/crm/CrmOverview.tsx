'use client';

import { motion } from '@/components/motion';
import {
  Users, TrendingUp, UserPlus, Clock, AlertTriangle, PoundSterling, Target, BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import type { CrmMetrics, CrmLead } from '@/hooks/useCrmData';
import { STAGE_LABELS, STAGE_COLORS, STAGE_DOT_COLORS, SOURCE_LABELS, PRIORITY_LABELS } from '@/lib/crm-definitions';
import type { LeadStage } from '@/lib/crm-definitions';

interface CrmOverviewProps {
  metrics: CrmMetrics;
  leads: CrmLead[];
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
}

export default function CrmOverview({ metrics, leads }: CrmOverviewProps) {
  const stageEntries = Object.entries(metrics.byStage).sort((a, b) => b[1] - a[1]);
  const sourceEntries = Object.entries(metrics.bySource).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Leads', value: metrics.total, icon: Users, color: '#06B6D4', href: '/admin/leads' },
          { label: 'New This Week', value: metrics.newThisWeek, icon: TrendingUp, color: '#8B5CF6', href: '/admin/leads?stage=new' },
          { label: 'Unassigned', value: metrics.unassigned, icon: UserPlus, color: '#F59E0B', href: '/admin/leads?unassigned=true' },
          { label: 'Overdue Follow-up', value: metrics.overdueFollowUp, icon: AlertTriangle, color: '#EF4444', href: '/admin/leads?overdue=true' },
          { label: 'Pipeline Value', value: formatCurrency(metrics.pipelineValue), icon: PoundSterling, color: '#10B981', href: '/admin/leads/pipeline' },
          { label: 'Won Value', value: formatCurrency(metrics.wonValue), icon: Target, color: '#F472B6', href: '/admin/leads?stage=won' },
        ].map((card, i) => (
          <Link href={card.href} key={card.label}>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 hover:border-white/15 transition-all duration-300 cursor-pointer group h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{card.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white group-hover:text-[#06B6D4] transition-colors">{card.value}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-[#06B6D4]" />
            <h3 className="font-semibold text-white text-sm">Leads by Stage</h3>
          </div>
          <div className="space-y-3">
            {stageEntries.slice(0, 8).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_DOT_COLORS[stage as LeadStage] || '#9CA3AF' }} />
                  <span className="text-sm text-slate-300">{STAGE_LABELS[stage as LeadStage] || stage}</span>
                </div>
                <span className="text-sm font-semibold text-white">{count}</span>
              </div>
            ))}
            {stageEntries.length === 0 && <p className="text-sm text-slate-500">No leads recorded</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="font-semibold text-white text-sm">Leads by Source</h3>
          </div>
          <div className="space-y-3">
            {sourceEntries.slice(0, 8).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] || source}</span>
                <span className="text-sm font-semibold text-white">{count}</span>
              </div>
            ))}
            {sourceEntries.length === 0 && <p className="text-sm text-slate-500">No source data</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="font-semibold text-white text-sm">Recently Updated</h3>
          </div>
          <div className="space-y-3">
            {metrics.recentlyUpdated.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="flex items-center justify-between group/item hover:bg-white/[0.03] rounded-lg p-2 -mx-2 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white group-hover/item:text-[#06B6D4] transition-colors">{lead.company_name || lead.name}</p>
                  <p className="text-xs text-slate-500">{lead.lead_reference || 'No ref'} · {STAGE_LABELS[lead.stage]}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </Link>
            ))}
            {metrics.recentlyUpdated.length === 0 && <p className="text-sm text-slate-500">No leads yet</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}