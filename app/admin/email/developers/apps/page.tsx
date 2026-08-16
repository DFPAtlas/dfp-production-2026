'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Plus, Search, AppWindow, Globe, Server, Users, Workflow, Wrench, Clock, CheckCircle2, XCircle, AlertTriangle, Pause, Ban, Archive, Filter, Eye } from 'lucide-react';

interface DevApp {
  id: string;
  name: string;
  description: string;
  app_type: string;
  environment: string;
  status: string;
  required_scopes: string[];
  technical_owner: string;
  created_at: string;
}

const APP_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  dfp_product: { label: 'DFP Product', icon: Globe, color: 'text-[#06B6D4]' },
  internal_service: { label: 'Internal Service', icon: Server, color: 'text-violet-400' },
  external_partner: { label: 'External Partner', icon: Users, color: 'text-emerald-400' },
  client_system: { label: 'Client System', icon: Globe, color: 'text-sky-400' },
  n8n_integration: { label: 'n8n Integration', icon: Workflow, color: 'text-amber-400' },
  dev_qa_tool: { label: 'Dev / QA Tool', icon: Wrench, color: 'text-rose-400' },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: CheckCircle2, draft: Clock, pending_review: Eye,
  suspended: Pause, revoked: Ban, archived: Archive,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  draft: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  pending_review: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  suspended: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  revoked: 'text-red-400 bg-red-400/10 border-red-400/20',
  archived: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export default function DeveloperApps() {
  const [apps, setApps] = useState<DevApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_developer_apps')
        .select('id, name, description, app_type, environment, status, required_scopes, technical_owner, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setApps(data as DevApp[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = apps.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && a.app_type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const types = ['all', ...new Set(apps.map((a) => a.app_type))];
  const statuses = ['all', ...new Set(apps.map((a) => a.status))];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Applications</h1>
          <p className="text-sm text-slate-400 mt-1">Manage registered developer applications across DFP products and partner systems.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/developers" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
          <Link href="/admin/email/developers/apps" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" /> Register App
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search applications..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 pr-8 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          {types.map((t) => {
            const meta = APP_TYPE_META[t];
            return <option key={t} value={t} className="bg-[#1a1a1e] text-white">{t === 'all' ? 'All Types' : meta?.label || t}</option>;
          })}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 pr-8 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          {statuses.map((s) => <option key={s} value={s} className="bg-[#1a1a1e] text-white">{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((app) => {
          const typeMeta = APP_TYPE_META[app.app_type] || { label: app.app_type, icon: Globe, color: 'text-slate-400' };
          const TypeIcon = typeMeta.icon;
          const StatusIcon = STATUS_ICONS[app.status] || Clock;
          const statusColor = STATUS_COLORS[app.status] || 'text-slate-400 bg-slate-400/10 border-slate-400/20';

          return (
            <Link key={app.id} href={`/admin/email/developers/apps/${app.id}`} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-[#06B6D4]/20 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                    <TypeIcon className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors truncate">{app.name}</h3>
                    <p className="text-[10px] text-slate-500">{typeMeta.label}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${statusColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{app.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(app.required_scopes || []).slice(0, 3).map((scope) => (
                  <span key={scope} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-500 font-mono">{scope}</span>
                ))}
                {(app.required_scopes || []).length > 3 && <span className="px-2 py-0.5 text-[10px] text-slate-600">+{app.required_scopes.length - 3}</span>}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {app.environment}
                </span>
                <span>{app.technical_owner}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <AppWindow className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{apps.length === 0 ? 'No applications registered yet' : 'No applications match your filters'}</p>
        </div>
      )}
    </div>
  );
}