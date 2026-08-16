'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Palette, Search, Plus, ArrowRight, CheckCircle2,
  Edit3, Archive, ShieldCheck, Eye, Layers, GitBranch, Package, XCircle,
} from 'lucide-react';

interface DesignToken {
  id: string;
  key: string;
  name: string;
  token_type: string;
  value: string;
  fallback_value: string | null;
  scope: string;
  brand_id: string | null;
  status: string;
  version: number;
  description: string | null;
  owner: string | null;
  usage_count: number;
  inherits_from: string | null;
  is_locked: boolean;
  review_date: string | null;
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

const SCOPE_LABELS: Record<string, string> = {
  organisation: 'Organisation',
  dfp_default: 'DFP Default',
  brand: 'Brand',
  product: 'Product',
  template_override: 'Template Override',
};

export default function DesignSystemTokens() {
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<DesignToken | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_design_tokens')
        .select('id, key, name, token_type, value, fallback_value, scope, brand_id, status, version, description, owner, usage_count, inherits_from, is_locked, review_date, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (data) setTokens(data as DesignToken[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = tokens.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const publishedCount = tokens.filter((t) => t.status === 'published').length;
  const draftCount = tokens.filter((t) => t.status === 'draft' || t.status === 'ready_for_review').length;
  const deprecatedCount = tokens.filter((t) => t.status === 'deprecated').length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Design Tokens</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Governed email-safe tokens for colours, typography, spacing, buttons, links and accessibility.
          </p>
        </div>
        <Link href="/admin/email/design-system/tokens" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" />
          New Token
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{publishedCount}</p>
          <p className="text-[11px] text-slate-500">Active tokens in use</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Drafts</span>
            <Edit3 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{draftCount}</p>
          <p className="text-[11px] text-slate-500">Pending review or approval</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Deprecated</span>
            <Archive className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{deprecatedCount}</p>
          <p className="text-[11px] text-slate-500">Scheduled for retirement</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search tokens by name or key..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer pr-8">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Palette className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{tokens.length === 0 ? 'No design tokens yet' : 'No tokens match your filters'}</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Key</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Value</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Scope</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Version</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {filtered.map((token) => {
                  const statusInfo = STATUS_LABELS[token.status] || STATUS_LABELS.draft;
                  return (
                    <tr key={token.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelected(token)}>
                      <td className="px-5 py-3.5"><code className="text-xs text-[#06B6D4] font-mono bg-[#06B6D4]/5 px-1.5 py-0.5 rounded">{token.key}</code></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{token.name}</span>
                          {token.is_locked && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {token.token_type === 'colour' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.1)]" style={{ backgroundColor: token.value }} />
                            <code className="text-xs text-slate-300 font-mono">{token.value}</code>
                          </div>
                        ) : (
                          <code className="text-xs text-slate-300 font-mono">{token.value}</code>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><span className="text-xs text-slate-400">{SCOPE_LABELS[token.scope] || token.scope}</span></td>
                      <td className="px-5 py-3.5"><span className="text-xs text-slate-400">v{token.version}</span></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right"><span className="text-xs text-slate-400">{token.usage_count || 0}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Scope</p><p className="text-sm text-white">{SCOPE_LABELS[selected.scope] || selected.scope}</p></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p><span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${(STATUS_LABELS[selected.status] || STATUS_LABELS.draft).color}`}>{(STATUS_LABELS[selected.status] || STATUS_LABELS.draft).label}</span></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Value</p><code className="text-sm text-white font-mono">{selected.value}</code></div>
                <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Fallback</p><code className="text-sm text-slate-400 font-mono">{selected.fallback_value || '—'}</code></div>
              </div>
              {selected.description && <p className="text-sm text-slate-300">{selected.description}</p>}
              {selected.is_locked && (
                <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300">This token is locked and cannot be structurally changed or removed by ordinary editors.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/email/design-system/components" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Layers className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Components</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/patterns" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Layers className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Patterns</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/releases" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><Package className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Releases</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
        <Link href="/admin/email/design-system/dependencies" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group"><GitBranch className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" /><span className="text-sm text-slate-300 group-hover:text-white">Dependencies</span><ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" /></Link>
      </div>
    </div>
  );
}