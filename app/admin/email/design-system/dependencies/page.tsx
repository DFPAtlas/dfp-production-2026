'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  GitBranch, Search, ArrowRight, AlertTriangle, CheckCircle2,
  Package, Archive, Eye, ShieldCheck, Palette, Component, Layers,
  Unlink, RefreshCw,
} from 'lucide-react';

interface Dependency {
  id: string;
  source_id: string;
  source_type: string;
  source_version: number;
  dependent_id: string;
  dependent_type: string;
  dependent_version: number;
  link_mode: string;
  update_state: string;
  update_policy: string;
  pinned_version: number | null;
}

const UPDATE_STATE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  current: { label: 'Current', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
  update_available: { label: 'Update Available', icon: RefreshCw, color: 'text-sky-400 bg-sky-400/10' },
  review_required: { label: 'Review Required', icon: Eye, color: 'text-amber-400 bg-amber-400/10' },
  compatible_update: { label: 'Compatible Update', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
  breaking_update: { label: 'Breaking Update', icon: AlertTriangle, color: 'text-rose-400 bg-rose-400/10' },
  deprecated: { label: 'Deprecated', icon: Archive, color: 'text-amber-400 bg-amber-400/10' },
  missing_dependency: { label: 'Missing Dependency', icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  detached: { label: 'Detached', icon: Unlink, color: 'text-slate-400 bg-slate-500/10' },
  update_blocked: { label: 'Update Blocked', icon: ShieldCheck, color: 'text-orange-400 bg-orange-400/10' },
};

const POLICY_LABELS: Record<string, string> = {
  never: 'Never Update',
  notify_only: 'Notify Only',
  auto_update_drafts_non_breaking: 'Auto-Update Drafts',
  require_review: 'Require Review',
  block_on_retired: 'Block on Retired',
};

export default function DesignSystemDependencies() {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_design_dependencies')
        .select('id, source_id, source_type, source_version, dependent_id, dependent_type, dependent_version, link_mode, update_state, update_policy, pinned_version')
        .order('updated_at', { ascending: false })
        .limit(300);
      if (data) setDependencies(data as Dependency[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = dependencies.filter((d) => {
    if (search && !d.source_id.toLowerCase().includes(search.toLowerCase()) && !d.dependent_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (stateFilter !== 'all' && d.update_state !== stateFilter) return false;
    return true;
  });

  const counts = {
    current: dependencies.filter((d) => d.update_state === 'current').length,
    outdated: dependencies.filter((d) => ['compatible_update', 'breaking_update', 'review_required'].includes(d.update_state)).length,
    deprecated: dependencies.filter((d) => d.update_state === 'deprecated').length,
    detached: dependencies.filter((d) => d.update_state === 'detached').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dependency Tracking</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Track relationships between tokens, components, patterns, brand kits, templates, campaigns and automations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Current</span><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /></div>
          <p className="text-2xl font-bold text-white mt-2">{counts.current}</p>
          <p className="text-[11px] text-slate-500">Up to date</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Outdated</span><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /></div>
          <p className="text-2xl font-bold text-white mt-2">{counts.outdated}</p>
          <p className="text-[11px] text-slate-500">Need attention</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Deprecated</span><Archive className="w-3.5 h-3.5 text-rose-400" /></div>
          <p className="text-2xl font-bold text-white mt-2">{counts.deprecated}</p>
          <p className="text-[11px] text-slate-500">Replacement needed</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Detached</span><Unlink className="w-3.5 h-3.5 text-slate-400" /></div>
          <p className="text-2xl font-bold text-white mt-2">{counts.detached}</p>
          <p className="text-[11px] text-slate-500">Independent copies</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by source or dependent..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer pr-8">
          <option value="all">All States</option>
          {Object.entries(UPDATE_STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{dependencies.length === 0 ? 'No dependencies tracked yet' : 'No dependencies match your filters'}</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Dependent</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Link Mode</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Version</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">State</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map((d) => {
                  const stateInfo = UPDATE_STATE_LABELS[d.update_state] || UPDATE_STATE_LABELS.current;
                  const StateIcon = stateInfo.icon;
                  const isProblem = ['breaking_update', 'deprecated', 'missing_dependency', 'review_required'].includes(d.update_state);

                  return (
                    <tr key={d.id} className={`hover:bg-white/[0.02] transition-colors ${isProblem ? 'bg-red-500/[0.02]' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
                            {d.source_type === 'token' ? <Palette className="w-3.5 h-3.5 text-[#06B6D4]" /> : d.source_type === 'component' ? <Component className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5 text-violet-400" />}
                          </div>
                          <div className="min-w-0">
                            <code className="text-xs text-[#06B6D4] font-mono">{d.source_id}</code>
                            <p className="text-[10px] text-slate-500">{d.source_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0"><GitBranch className="w-3.5 h-3.5 text-slate-400" /></div>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate max-w-[180px]">{d.dependent_id}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{d.dependent_type.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${d.link_mode === 'linked' ? 'bg-sky-400/10 text-sky-400' : 'bg-slate-500/10 text-slate-400'}`}>{d.link_mode}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-300">v{d.source_version}</span>
                          {d.pinned_version != null && <span className="text-[9px] text-amber-400 font-mono ml-1">pinned@v{d.pinned_version}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${stateInfo.color}`}><StateIcon className="w-3 h-3" /></div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${stateInfo.color.split(' ')[0]}`}>{stateInfo.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-[10px] text-slate-400">{POLICY_LABELS[d.update_policy] || d.update_policy}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/email/design-system/tokens" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Palette className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Tokens</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/components" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Component className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Components</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/patterns" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Layers className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Patterns</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/releases" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Package className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Releases</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
      </div>
    </div>
  );
}