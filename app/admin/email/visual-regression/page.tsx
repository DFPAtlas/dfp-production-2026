'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Image, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Eye, Columns2, Search, Clock, ShieldCheck, ThumbsUp,
  Calendar, Monitor, User,
} from 'lucide-react';

const REGRESSIONS = [
  {
    id: '1', name: 'Newsletter Header - Gmail Dark', source: 'Monthly Newsletter v4.2',
    client: 'Gmail Web', mode: 'dark', severity: 'warning', diff: 4.2,
    issues: ['Logo contrast reduced', 'Button hover state lost'],
    baseline: 'v2', baselineDate: '2026-06-15', detectedDate: '2026-07-18',
  },
  {
    id: '2', name: 'CTA Section - Outlook Windows', source: 'Welcome Email v3',
    client: 'Outlook Windows', mode: 'light', severity: 'failed', diff: 18.7,
    issues: ['Major layout shift in CTA', 'Button collapsed to text link', 'Spacing collapse after heading', 'Footer misaligned', 'Image width incorrect'],
    baseline: 'v1', baselineDate: '2026-05-20', detectedDate: '2026-07-17',
  },
  {
    id: '3', name: 'Brand Footer - Apple Mail Dark', source: 'Brand Footer v1.1',
    client: 'Apple Mail', mode: 'dark', severity: 'warning', diff: 3.5,
    issues: ['Footer border invisible', 'Social icon colors inverted'],
    baseline: 'v3', baselineDate: '2026-07-01', detectedDate: '2026-07-16',
  },
  {
    id: '4', name: 'Arabic RTL - Gmail Android', source: 'Welcome AR v2',
    client: 'Gmail Android', mode: 'light', severity: 'failed', diff: 14.3,
    issues: ['RTL text alignment breaks on narrow view', 'Number formatting reversed', 'Logo position off', 'Horizontal scrollbar appearing'],
    baseline: 'v1', baselineDate: '2026-06-30', detectedDate: '2026-07-15',
  },
  {
    id: '5', name: 'Invoice Table - Thunderbird', source: 'Invoice Reminder v1',
    client: 'Thunderbird', mode: 'light', severity: 'warning', diff: 2.8,
    issues: ['Table border missing', 'Currency column narrow'],
    baseline: 'v1', baselineDate: '2026-07-05', detectedDate: '2026-07-14',
  },
];

const BASELINES = [
  { id: '1', name: 'Welcome Email - Core Matrix', source_type: 'template', source_name: 'Welcome Email v3', client_count: 8, approved_by: 'Alex Morgan', approved_date: '2026-06-15', status: 'active' },
  { id: '2', name: 'Newsletter - Quick Check', source_type: 'template', source_name: 'Newsletter Base v2', client_count: 4, approved_by: 'Sarah Chen', approved_date: '2026-06-20', status: 'active' },
  { id: '3', name: 'Invoice - Core Clients', source_type: 'transactional', source_name: 'Invoice Due Reminder', client_count: 8, approved_by: 'Alex Morgan', approved_date: '2026-07-05', status: 'active' },
  { id: '4', name: 'Brand Footer - Dark Mode', source_type: 'brand', source_name: 'Brand Footer v1.1', client_count: 2, approved_by: 'Sarah Chen', approved_date: '2026-07-01', status: 'active' },
  { id: '5', name: 'Campaign Base - Full', source_type: 'campaign', source_name: 'Campaign Base v1', client_count: 16, approved_by: 'Alex Morgan', approved_date: '2026-07-10', status: 'outdated' },
];

export default function VisualRegressionPage() {
  const [tab, setTab] = useState<'regressions' | 'baselines'>('regressions');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredRegressions = REGRESSIONS.filter((r) => {
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredBaselines = BASELINES.filter((b) => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/render-tests" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
              <Image className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Visual Regression</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Compare render results with approved baselines, detect regressions, manage baselines.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('regressions')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === 'regressions' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
        >
          Detected Regressions ({REGRESSIONS.length})
        </button>
        <button
          onClick={() => setTab('baselines')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === 'baselines' ? 'bg-violet-400/10 text-violet-400' : 'text-slate-400 hover:text-white'}`}
        >
          Approved Baselines ({BASELINES.length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={tab === 'regressions' ? 'Search regressions...' : 'Search baselines...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        {tab === 'regressions' && (
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer pr-8"
          >
            <option value="all">All Severities</option>
            <option value="warning">Warning</option>
            <option value="failed">Failed</option>
          </select>
        )}
      </div>

      {tab === 'regressions' && (
        <div className="space-y-4">
          {filteredRegressions.map((r) => (
            <div key={r.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.severity === 'failed' ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                        {r.severity === 'failed' ? <XCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {r.source} · {r.client} · {r.mode === 'dark' ? 'Dark' : 'Light'} mode · {r.diff}% difference
                    </p>
                  </div>
                  <Link
                    href={`/admin/email/render-tests/${r.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-400/10 border border-violet-400/20 text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-400/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Baseline ({r.baseline})</p>
                    <div className="aspect-[4/3] bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-lg flex items-center justify-center">
                      <span className="text-xs text-slate-600">Baseline screenshot</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Current</p>
                    <div className="aspect-[4/3] bg-white/[0.02] border border-red-400/10 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-red-400/50">Regression detected</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Difference</p>
                    <div className="aspect-[4/3] bg-red-400/[0.03] border border-red-400/10 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-red-400/50">{r.diff}% different</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-slate-400">Issues Detected:</p>
                  {r.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {r.severity === 'failed' ? (
                        <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      <span className="text-slate-300">{issue}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Baseline: {r.baselineDate}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Detected: {r.detectedDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredRegressions.length === 0 && (
            <div className="text-center py-12 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">No regressions detected</p>
              <p className="text-xs text-slate-500 mt-1">All current renders match approved baselines</p>
            </div>
          )}
        </div>
      )}

      {tab === 'baselines' && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Baseline</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Clients</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Approved By</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBaselines.map((b) => (
                  <tr key={b.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{b.name}</p>
                      <p className="text-[10px] text-slate-600">{b.source_type}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-400">{b.source_name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-400">{b.client_count} clients</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> {b.approved_by}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-400">{b.approved_date}</span>
                    </td>
                    <td className="px-5 py-4">
                      {b.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded text-[10px] font-semibold">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded text-[10px] font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Outdated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}