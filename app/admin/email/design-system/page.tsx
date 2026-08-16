'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Palette, Component, Layers, Package, GitBranch, AlertTriangle,
  ArrowRight, ShieldCheck, CheckCircle2, XCircle, Archive, Eye,
} from 'lucide-react';

interface StatCard {
  key: string;
  icon: React.ElementType;
  label: string;
  value: number;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  href: string;
}

interface ReleaseRow {
  id: string;
  name: string;
  version: string;
  status: string;
  published_at: string | null;
  created_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  ready_for_review: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  draft: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  rolled_back: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const QUICK_LINKS = [
  { icon: Palette, label: 'Manage Tokens', href: '/admin/email/design-system/tokens' },
  { icon: Component, label: 'Component Library', href: '/admin/email/design-system/components' },
  { icon: Layers, label: 'Pattern Library', href: '/admin/email/design-system/patterns' },
  { icon: Package, label: 'Releases', href: '/admin/email/design-system/releases' },
  { icon: GitBranch, label: 'Dependencies', href: '/admin/email/design-system/dependencies' },
  { icon: ShieldCheck, label: 'Settings', href: '/admin/email/settings/design-system' },
];

export default function DesignSystemDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [health, setHealth] = useState<{ label: string; status: 'healthy' | 'warning' | 'error'; detail: string }[]>([]);
  const [recentReleases, setRecentReleases] = useState<ReleaseRow[]>([]);
  const [brandUsage, setBrandUsage] = useState<{ name: string; tokens: number; components: number; patterns: number }[]>([]);
  const [warnings, setWarnings] = useState<{ item: string; issue: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [tokensRes, componentsRes, patternsRes, releasesRes, depsRes] = await Promise.all([
        supabase.from('email_design_tokens').select('id, status, brand_id, token_type'),
        supabase.from('email_design_components').select('id, status, brand_id'),
        supabase.from('email_design_patterns').select('id, status, brand_id'),
        supabase.from('email_design_releases').select('id, name, version, status, published_at, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('email_design_dependencies').select('id, update_state, source_id'),
      ]);

      const tokens = (tokensRes.data || []) as { id: string; status: string; brand_id: string | null }[];
      const components = (componentsRes.data || []) as { id: string; status: string; brand_id: string | null }[];
      const patterns = (patternsRes.data || []) as { id: string; status: string; brand_id: string | null }[];
      const releases = (releasesRes.data || []) as ReleaseRow[];
      const deps = (depsRes.data || []) as { id: string; update_state: string; source_id: string }[];

      const allDesign = [...tokens, ...components, ...patterns];
      const publishedTokens = tokens.filter((t) => t.status === 'published').length;
      const draftChanges = allDesign.filter((d) => d.status === 'draft' || d.status === 'ready_for_review').length;
      const deprecated = allDesign.filter((d) => d.status === 'deprecated' || d.status === 'retired').length;
      const pendingReviews = allDesign.filter((d) => d.status === 'ready_for_review').length;
      const outdatedDeps = deps.filter((d) => ['compatible_update', 'breaking_update', 'review_required'].includes(d.update_state)).length;
      const breakingDeps = deps.filter((d) => ['breaking_update', 'missing_dependency'].includes(d.update_state)).length;
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentReleaseCount = releases.filter((r) => r.created_at && new Date(r.created_at).getTime() >= thirtyDaysAgo).length;

      setStats([
        { key: 'published_tokens', icon: Palette, label: 'Published Tokens', value: publishedTokens, subtitle: 'Across all token categories', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20', href: '/admin/email/design-system/tokens' },
        { key: 'draft_changes', icon: Component, label: 'Draft Changes', value: draftChanges, subtitle: 'Awaiting review', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', href: '/admin/email/design-system/tokens' },
        { key: 'components', icon: Component, label: 'Components', value: components.length, subtitle: `${components.filter((c) => c.status === 'published').length} published`, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', href: '/admin/email/design-system/components' },
        { key: 'patterns', icon: Layers, label: 'Patterns', value: patterns.length, subtitle: `${patterns.filter((p) => p.status === 'published').length} published`, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', href: '/admin/email/design-system/patterns' },
        { key: 'outdated_deps', icon: AlertTriangle, label: 'Outdated Dependencies', value: outdatedDeps, subtitle: `${breakingDeps} breaking or missing`, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', href: '/admin/email/design-system/dependencies' },
        { key: 'deprecated', icon: Archive, label: 'Deprecated Items', value: deprecated, subtitle: 'Tokens, components or patterns', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', href: '/admin/email/design-system/components' },
        { key: 'pending_reviews', icon: Eye, label: 'Pending Reviews', value: pendingReviews, subtitle: 'Ready for review', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20', href: '/admin/email/design-system/releases' },
        { key: 'recent_releases', icon: Package, label: 'Recent Releases', value: recentReleaseCount, subtitle: 'in the last 30 days', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20', href: '/admin/email/design-system/releases' },
      ]);

      setHealth([
        { label: 'Published Tokens', status: publishedTokens > 0 ? 'healthy' : 'warning', detail: `${publishedTokens} tokens published` },
        { label: 'Deprecated Items', status: deprecated > 0 ? 'warning' : 'healthy', detail: `${deprecated} items deprecated or retired` },
        { label: 'Outdated Dependencies', status: outdatedDeps > 0 ? 'warning' : 'healthy', detail: `${outdatedDeps} dependencies need attention` },
        { label: 'Breaking Dependencies', status: breakingDeps > 0 ? 'error' : 'healthy', detail: `${breakingDeps} breaking or missing` },
        { label: 'Pending Reviews', status: pendingReviews > 0 ? 'warning' : 'healthy', detail: `${pendingReviews} items ready for review` },
        { label: 'Recent Releases', status: recentReleaseCount > 0 ? 'healthy' : 'warning', detail: `${recentReleaseCount} releases in last 30 days` },
      ]);

      setRecentReleases(releases.slice(0, 6));

      const brandMap = new Map<string, { tokens: number; components: number; patterns: number }>();
      const bump = (brandId: string | null, key: 'tokens' | 'components' | 'patterns') => {
        const name = brandId || 'DFP Default';
        if (!brandMap.has(name)) brandMap.set(name, { tokens: 0, components: 0, patterns: 0 });
        const entry = brandMap.get(name)!;
        entry[key] += 1;
      };
      tokens.forEach((t) => bump(t.brand_id, 'tokens'));
      components.forEach((c) => bump(c.brand_id, 'components'));
      patterns.forEach((p) => bump(p.brand_id, 'patterns'));
      setBrandUsage(Array.from(brandMap.entries()).map(([name, counts]) => ({ name, ...counts })));

      const warningRows: { item: string; issue: string }[] = [];
      deps.filter((d) => d.update_state === 'breaking_update').slice(0, 3).forEach((d) => warningRows.push({ item: d.source_id, issue: 'Breaking update requires review' }));
      deps.filter((d) => d.update_state === 'missing_dependency').slice(0, 3).forEach((d) => warningRows.push({ item: d.source_id, issue: 'Missing dependency detected' }));
      setWarnings(warningRows);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Design System</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Governed email design tokens, shared components and pattern library for consistent, safely maintained content across DFP brands.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/email/design-system/releases" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"><Package className="w-4 h-4" /> Create Release</Link>
          <Link href="/admin/email/design-system/tokens" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"><Palette className="w-4 h-4" /> New Token</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.border} border flex items-center justify-center`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{card.subtitle}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Library Health</h2>
              <span className="text-[10px] text-slate-500">{health.length} checks</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {health.map((item) => {
                  const Icon = item.status === 'healthy' ? CheckCircle2 : item.status === 'error' ? XCircle : AlertTriangle;
                  const color = item.status === 'healthy' ? 'text-emerald-400' : item.status === 'error' ? 'text-rose-400' : 'text-amber-400';
                  return (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl border border-[rgba(255,255,255,0.04)] bg-white/[0.02]">
                      <Icon className={`w-4 h-4 ${color} mt-0.5 shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Recent Releases</h2>
            </div>
            {recentReleases.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">No releases recorded yet</p>
            ) : (
              <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                {recentReleases.map((r) => (
                  <Link key={r.id} href="/admin/email/design-system/releases" className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 text-[#06B6D4]" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.version}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ''}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${STATUS_COLORS[r.status] || STATUS_COLORS.draft}`}>{r.status.replace(/_/g, ' ')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]"><h2 className="text-base font-bold text-white">Quick Links</h2></div>
            <div className="p-3 space-y-1">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer group">
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" />
                    <span>{link.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]"><h2 className="text-base font-bold text-white">Brand Usage</h2></div>
            <div className="p-4 space-y-4">
              {brandUsage.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No brand usage data yet</p>
              ) : (
                brandUsage.map((brand) => (
                  <div key={brand.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{brand.name}</p>
                      <span className="text-[10px] text-slate-500">{brand.tokens + brand.components + brand.patterns} items</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#06B6D4]/10 text-[#06B6D4]">{brand.tokens} tokens</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-400/10 text-emerald-400">{brand.components} components</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-400/10 text-violet-400">{brand.patterns} patterns</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]"><h2 className="text-base font-bold text-white">Dependency Warnings</h2></div>
            <div className="p-4 space-y-3">
              {warnings.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No dependency warnings</p>
              ) : (
                warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/[0.08]">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-white">{w.item}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{w.issue}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
              <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4]" />
              <span className="text-sm text-slate-300 group-hover:text-white">{link.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}