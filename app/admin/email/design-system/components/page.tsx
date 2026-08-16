'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Component, Search, Plus, ArrowRight, ShieldCheck,
  XCircle, Palette, Package, GitBranch, Layers,
} from 'lucide-react';

interface DesignComponent {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string | null;
  scope: string;
  brand_id: string | null;
  status: string;
  version: number;
  owner: string | null;
  usage_count: number;
  is_locked: boolean;
  variant_of: string | null;
  variant_type: string | null;
  token_dependencies: string[];
  compatibility_level: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-sky-400/10 text-sky-400 border-sky-400/20' },
  approved: { label: 'Approved', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  published: { label: 'Published', color: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20' },
  deprecated: { label: 'Deprecated', color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  retired: { label: 'Retired', color: 'bg-rose-400/10 text-rose-400 border-rose-400/20' },
  blocked: { label: 'Blocked', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function DesignSystemComponents() {
  const [components, setComponents] = useState<DesignComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<DesignComponent | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_design_components')
        .select('id, key, name, category, description, scope, brand_id, status, version, owner, usage_count, is_locked, variant_of, variant_type, token_dependencies, compatibility_level, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (data) setComponents(data as DesignComponent[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = components.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Component Library</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Governed email-safe components with contracts, variants, token dependencies and compatibility evidence.
          </p>
        </div>
        <Link href="/admin/email/design-system/components" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" />
          New Component
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search components..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer pr-8">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Component className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{components.length === 0 ? 'No components in the library yet' : 'No components match your filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
            return (
              <div key={c.id} onClick={() => setSelected(c)} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                      <Component className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        {c.is_locked && <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <code className="text-[10px] text-[#06B6D4] font-mono">{c.key}</code>
                    </div>
                  </div>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border shrink-0 ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description || 'No description'}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-400">{c.category}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-400/10 text-violet-400">v{c.version}</span>
                  {c.variant_of && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-400/10 text-sky-400">{c.variant_type || 'variant'}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <span className="text-[10px] text-slate-600">{(c.token_dependencies || []).length} token deps</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600">{c.compatibility_level || 'unknown'} compat</span>
                    <span className="text-[10px] text-slate-600">{c.usage_count || 0} uses</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-base font-bold text-white">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"><XCircle className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Key</p><code className="text-sm text-[#06B6D4] font-mono">{selected.key}</code></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Version</p><p className="text-sm text-white">v{selected.version}</p></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</p><p className="text-sm text-white">{selected.category}</p></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Compatibility</p><p className="text-sm text-white capitalize">{selected.compatibility_level || 'unknown'}</p></div>
              </div>
              <p className="text-sm text-slate-300">{selected.description || 'No description'}</p>
              {(selected.token_dependencies || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Token Dependencies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.token_dependencies.map((t) => <code key={t} className="text-[10px] text-[#06B6D4] font-mono bg-[#06B6D4]/5 px-2 py-0.5 rounded">{t}</code>)}
                  </div>
                </div>
              )}
              {selected.is_locked && (
                <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300">This component is locked and cannot be structurally changed or removed by ordinary editors.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/email/design-system/tokens" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Palette className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Tokens</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/patterns" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Layers className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Patterns</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/releases" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Package className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Releases</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/dependencies" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><GitBranch className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Dependencies</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
      </div>
    </div>
  );
}