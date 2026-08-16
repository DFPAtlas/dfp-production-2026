'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Search, Plus, Filter, ChevronDown, ArrowRight, BeakerIcon,
  BarChart3, Clock, AlertTriangle, CheckCircle2, XCircle, Play, Pause, Trophy, Trash2,
} from 'lucide-react';

type ExperimentStatus = 'draft'|'ready_for_review'|'approved'|'scheduled'|'running'|'paused'|'awaiting_decision'|'winner_selected'|'rolling_out'|'completed'|'cancelled'|'failed'|'inconclusive'|'archived';

interface ExperimentRow {
  id: string;
  name: string;
  source_type: string;
  campaign_name?: string;
  automation_name?: string;
  brand_kit_name?: string;
  experiment_type: string;
  variants: { label: string }[];
  audience_config: { eligible?: number };
  metrics_config: { primary?: { name?: string } };
  status: ExperimentStatus;
  schedule_config: { start_at?: string; end_at?: string };
  results: { leader_variant?: string };
  owner_name?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  scheduled: { label: 'Scheduled', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  running: { label: 'Running', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  paused: { label: 'Paused', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  awaiting_decision: { label: 'Awaiting Decision', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  winner_selected: { label: 'Winner Selected', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rolling_out: { label: 'Rolling Out', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  inconclusive: { label: 'Inconclusive', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  archived: { label: 'Archived', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
};

const TYPE_LABELS: Record<string, string> = {
  subject_line: 'Subject Line',
  preview_text: 'Preview Text',
  sender_name: 'Sender Name',
  send_time: 'Send Time',
  heading: 'Heading',
  introduction: 'Introduction',
  cta_wording: 'CTA Wording',
  button_style: 'Button Style',
  content_section: 'Content Section',
  full_content: 'Full Content',
  language_variant: 'Language Variant',
  layout_variant: 'Layout Variant',
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at'|'name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_experiments').select('*').order('created_at', { ascending: false });
    if (data) setExperiments(data as ExperimentRow[]);
    setLoading(false);
  };

  const filtered = experiments.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    return sortDir === 'asc'
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totals = { total: experiments.length, running: experiments.filter(e => e.status === 'running').length, completed: experiments.filter(e => ['completed','winner_selected'].includes(e.status)).length, drafts: experiments.filter(e => e.status === 'draft').length };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-20 bg-[#121215] rounded-2xl" />)}</div>
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <BeakerIcon className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Experiments</h1>
          </div>
          <p className="text-sm text-slate-400 ml-11">A/B testing and controlled experiments for campaigns and automations.</p>
        </div>
        <Link href="/admin/email/experiments/new" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" /> New Experiment
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{label:'Total',value:totals.total,color:'text-slate-300'},{label:'Running',value:totals.running,color:'text-cyan-400'},{label:'Completed',value:totals.completed,color:'text-emerald-400'},{label:'Drafts',value:totals.drafts,color:'text-slate-400'}].map(s=>(
          <div key={s.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search experiments..." className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
          </div>
          <button onClick={()=>setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <Filter className="w-4 h-4" /> Filters {showFilters?<ChevronDown className="w-3 h-3 rotate-180" />:<ChevronDown className="w-3 h-3" />}
          </button>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'created_at'|'name')} className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white cursor-pointer appearance-none pr-8">
            <option value="created_at">Date Created</option>
            <option value="name">Name</option>
          </select>
          <button onClick={()=>setSortDir(d=>d==='asc'?'desc':'asc')} className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            {sortDir==='desc'?'↓ Newest':'↑ Oldest'}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap gap-2">
            {[{value:'all',label:'All'},{value:'draft',label:'Draft'},{value:'running',label:'Running'},{value:'awaiting_decision',label:'Awaiting Decision'},{value:'completed',label:'Completed'},{value:'inconclusive',label:'Inconclusive'},{value:'cancelled',label:'Cancelled'}].map(f=>(
              <button key={f.value} onClick={()=>setStatusFilter(f.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${statusFilter===f.value?'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30':'bg-white/[0.03] text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white'}`}>{f.label}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BeakerIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-3">No experiments found</p>
            <Link href="/admin/email/experiments/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-4 h-4" /> Create First Experiment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Experiment</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Metric</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Leader</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const s = STATUS_CONFIG[e.status] || STATUS_CONFIG.draft;
                  return (
                    <tr key={e.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/email/experiments/${e.id}`} className="cursor-pointer">
                          <p className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors">{e.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{e.variants?.length||0} variants · {e.audience_config?.eligible||'—'} recipients</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-300 capitalize">{e.source_type}</p>
                        <p className="text-[10px] text-slate-500">{e.campaign_name||e.automation_name||'—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-300">{TYPE_LABELS[e.experiment_type]||e.experiment_type}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-400">{e.metrics_config?.primary?.name||'—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${s.color}`}>
                          {e.status==='running'&&<Play className="w-2.5 h-2.5" />}
                          {e.status==='completed'&&<CheckCircle2 className="w-2.5 h-2.5" />}
                          {e.status==='paused'&&<Pause className="w-2.5 h-2.5" />}
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {e.results?.leader_variant ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400"><Trophy className="w-3 h-3" /> {e.results.leader_variant}</span>
                        ) : <span className="text-xs text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/email/experiments/${e.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-500 hover:text-white transition-all cursor-pointer">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}