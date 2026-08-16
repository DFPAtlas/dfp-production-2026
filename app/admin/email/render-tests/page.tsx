'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Monitor, CheckCircle2, AlertTriangle, XCircle, Clock,
  Play, Eye, Plus, Search, ArrowRight,
  Sparkles, Image, ShieldCheck,
} from 'lucide-react';

const PRESET_LABELS: Record<string, string> = {
  quick: 'Quick Check',
  core: 'Core Clients',
  full: 'Full Compatibility',
  mobile: 'Mobile Only',
  outlook: 'Outlook Focus',
  dark_mode: 'Dark Mode',
  images_blocked: 'Images Blocked',
  custom: 'Custom Matrix',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  waiting: { label: 'Waiting', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Clock },
  running: { label: 'Running', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: Play },
  needs_review: { label: 'Needs Review', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
  passed: { label: 'Passed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  passed_warnings: { label: 'Passed (Warnings)', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertTriangle },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  accepted_exception: { label: 'Accepted Exception', color: 'text-violet-400', bg: 'bg-violet-400/10', icon: ShieldCheck },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: XCircle },
  expired: { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Clock },
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  template: 'Template',
  campaign: 'Campaign',
  automation: 'Automation',
  transactional: 'Transactional',
  brand: 'Brand Kit',
  plain_text: 'Plain Text',
};

interface RenderTest {
  id: string;
  name: string;
  source_type: string;
  source_name: string;
  status: string;
  preset: string;
  client_count: number;
  passed_count: number;
  failed_count: number;
  warning_count: number;
  created_at: string | null;
  language: string;
}

function summaryCount(v: unknown, key: string): number {
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj[key] === 'number') return obj[key] as number;
  }
  return 0;
}

export default function RenderTestsDashboard() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [tests, setTests] = useState<RenderTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('email_render_tests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      const rows = ((data || []) as Record<string, unknown>[]).map((t) => ({
        id: t.id as string,
        name: (t.name as string) || 'Untitled test',
        source_type: (t.source_type as string) || 'template',
        source_name: (t.source_id as string) || '—',
        status: (t.status as string) || 'waiting',
        preset: (t.preset as string) || 'core',
        client_count: typeof t.client_count === 'number' ? (t.client_count as number) : 0,
        passed_count: summaryCount(t.results_summary, 'passed'),
        failed_count: summaryCount(t.results_summary, 'failed'),
        warning_count: summaryCount(t.results_summary, 'warning'),
        created_at: (t.created_at as string) || null,
        language: (t.language as string) || 'en',
      }));
      setTests(rows);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = tests.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && t.source_type !== sourceFilter) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const waiting = tests.filter((t) => t.status === 'waiting').length;
  const running = tests.filter((t) => t.status === 'running').length;
  const passed = tests.filter((t) => t.status === 'passed' || t.status === 'accepted_exception').length;
  const warnings = tests.filter((t) => t.status === 'passed_warnings').length;
  const failed = tests.filter((t) => t.status === 'failed').length;
  const regressions = tests.filter((t) => t.failed_count > 0 || t.status === 'failed').length;

  const statCards = [
    { key: 'waiting', label: 'Waiting', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-400/10', count: waiting },
    { key: 'running', label: 'Running', icon: Play, color: 'text-sky-400', bg: 'bg-sky-400/10', count: running },
    { key: 'passed', label: 'Passed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', count: passed },
    { key: 'warnings', label: 'With Warnings', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', count: warnings },
    { key: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', count: failed },
    { key: 'regressions', label: 'Regressions', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10', count: regressions },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-[#121215] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-[#121215] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Render Tests</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Email-client previews, visual regression, compatibility diagnostics and rendering health.
          </p>
        </div>
        <Link
          href="/admin/email/render-tests/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Render Test
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.count}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search render tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer pr-8"
        >
          <option value="all">All Statuses</option>
          <option value="waiting">Waiting</option>
          <option value="running">Running</option>
          <option value="needs_review">Needs Review</option>
          <option value="passed">Passed</option>
          <option value="passed_warnings">Passed (Warnings)</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer pr-8"
        >
          <option value="all">All Sources</option>
          <option value="template">Templates</option>
          <option value="campaign">Campaigns</option>
          <option value="automation">Automations</option>
          <option value="transactional">Transactional</option>
        </select>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Monitor className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{tests.length === 0 ? 'No render tests recorded yet' : 'No render tests match your filters'}</p>
            {tests.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">Create your first render test to check email-client compatibility</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Test</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Preset</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Clients</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Language</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((test) => {
                  const st = STATUS_CONFIG[test.status] || STATUS_CONFIG.waiting;
                  const StatusIcon = st.icon;
                  return (
                    <tr key={test.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/email/render-tests/${test.id}`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors cursor-pointer">
                          {test.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400">{SOURCE_TYPE_LABELS[test.source_type] || test.source_type}</span>
                        <span className="text-xs text-slate-500 ml-1">— {test.source_name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400">{PRESET_LABELS[test.preset] || test.preset}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{test.passed_count}/{test.client_count}</span>
                          {test.failed_count > 0 && <span className="text-xs text-red-400">{test.failed_count} failed</span>}
                          {test.warning_count > 0 && <span className="text-xs text-amber-400">{test.warning_count} warn</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 uppercase">{test.language || 'en'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold ${st.color} ${st.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400">
                          {test.created_at ? new Date(test.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/email/render-tests/${test.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                            title="View Results"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/admin/email/compatibility" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-violet-400/30 transition-all cursor-pointer group">
          <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Compatibility Diagnostics</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/visual-regression" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-violet-400/30 transition-all cursor-pointer group">
          <Image className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Visual Regression</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/rendering" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-violet-400/30 transition-all cursor-pointer group">
          <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Rendering Settings</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 ml-auto transition-colors" />
        </Link>
      </div>
    </div>
  );
}