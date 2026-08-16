'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Package, Search, Plus, ArrowRight, AlertTriangle,
  Archive, RotateCcw, Eye, Palette, Component, Layers,
  GitBranch, XCircle,
} from 'lucide-react';

interface DesignRelease {
  id: string;
  name: string;
  version: string;
  change_summary: string | null;
  breaking_changes: string[];
  deprecations: string[];
  affected_brands: string[];
  token_count: number;
  component_count: number;
  pattern_count: number;
  status: string;
  owner: string | null;
  published_at: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-sky-400/10 text-sky-400 border-sky-400/20' },
  approved: { label: 'Approved', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  published: { label: 'Published', color: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20' },
  partially_rolled_out: { label: 'Partially Rolled Out', color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  rolled_back: { label: 'Rolled Back', color: 'bg-rose-400/10 text-rose-400 border-rose-400/20' },
  superseded: { label: 'Superseded', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  archived: { label: 'Archived', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

function countKeys(v: unknown): number {
  if (!v || typeof v !== 'object') return 0;
  return Object.keys(v as Record<string, unknown>).length;
}

export default function DesignSystemReleases() {
  const [releases, setReleases] = useState<DesignRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<DesignRelease | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_design_releases')
        .select('id, name, version, change_summary, breaking_changes, deprecations, affected_brands, token_versions, component_versions, pattern_versions, status, owner, published_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        setReleases((data as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          name: (r.name as string) || 'Unnamed release',
          version: (r.version as string) || '',
          change_summary: (r.change_summary as string) || null,
          breaking_changes: (r.breaking_changes as string[]) || [],
          deprecations: (r.deprecations as string[]) || [],
          affected_brands: (r.affected_brands as string[]) || [],
          token_count: countKeys(r.token_versions),
          component_count: countKeys(r.component_versions),
          pattern_count: countKeys(r.pattern_versions),
          status: (r.status as string) || 'draft',
          owner: (r.owner as string) || null,
          published_at: (r.published_at as string) || null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = releases.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Design System Releases</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Versioned releases containing token, component and pattern changes with migration steps and approval evidence.
          </p>
        </div>
        <Link href="/admin/email/design-system/releases" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Create Release
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search releases..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer pr-8">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{releases.length === 0 ? 'No releases yet' : 'No releases match your filters'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const statusInfo = STATUS_LABELS[r.status] || STATUS_LABELS.draft;
            return (
              <div key={r.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-[#06B6D4]" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{r.name}</h3>
                          <span className="text-sm text-[#06B6D4] font-mono font-bold">{r.version}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{r.owner || '—'}{r.published_at ? ` · Published ${new Date(r.published_at).toLocaleDateString()}` : ''}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mt-3">{r.change_summary || 'No summary'}</p>
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[#06B6D4]/10 text-[#06B6D4]">{r.token_count} tokens</span>
                      <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-emerald-400/10 text-emerald-400">{r.component_count} components</span>
                      <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-violet-400/10 text-violet-400">{r.pattern_count} patterns</span>
                      <span className="text-[11px] text-slate-500">{r.affected_brands.length} brands affected</span>
                    </div>
                    {r.breaking_changes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.breaking_changes.map((bc, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-400/10 text-rose-400"><AlertTriangle className="w-2.5 h-2.5" /> {bc}</span>
                        ))}
                      </div>
                    )}
                    {r.deprecations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.deprecations.map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-400/10 text-amber-400"><Archive className="w-2.5 h-2.5" /> {d}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {r.affected_brands.map((b) => <span key={b} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400">{b}</span>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button onClick={() => setSelected(r)} className="px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> View</button>
                    {r.status === 'rolled_back' && (
                      <button className="px-4 py-2 bg-rose-400/10 border border-rose-400/20 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-400/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Rollback</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h3 className="text-base font-bold text-white">{selected.name}</h3>
                <p className="text-xs text-slate-500">{selected.version}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p><span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${(STATUS_LABELS[selected.status] || STATUS_LABELS.draft).color}`}>{(STATUS_LABELS[selected.status] || STATUS_LABELS.draft).label}</span></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner</p><p className="text-sm text-white">{selected.owner || '—'}</p></div>
              </div>
              <p className="text-sm text-slate-300">{selected.change_summary || 'No summary'}</p>
              {selected.breaking_changes.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Breaking Changes</p>
                  <ul className="space-y-1">{selected.breaking_changes.map((bc, i) => <li key={i} className="text-xs text-rose-300 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />{bc}</li>)}</ul>
                </div>
              )}
              {selected.deprecations.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Archive className="w-3 h-3" /> Deprecations</p>
                  <div className="flex flex-wrap gap-1.5">{selected.deprecations.map((d, i) => <code key={i} className="text-[10px] text-amber-400 font-mono bg-amber-400/5 px-2 py-0.5 rounded">{d}</code>)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/email/design-system/tokens" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Palette className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Tokens</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/components" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Component className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Components</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/patterns" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Layers className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Patterns</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/dependencies" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><GitBranch className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Dependencies</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
      </div>
    </div>
  );
}