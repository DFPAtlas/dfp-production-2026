'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Filter, Download, Eye, Calendar, User, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, RefreshCw,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  success: boolean;
  result: string;
  module: string | null;
  target_record_type: string | null;
  reason: string | null;
  correlation_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

const MODULE_OPTIONS = [
  'templates', 'brands', 'campaigns', 'automations', 'transactional', 'contacts',
  'imports', 'consent', 'preferences', 'suppressions', 'providers', 'domains',
  'senders', 'webhooks', 'settings', 'permissions', 'retention', 'exports',
];

const ACTION_OPTIONS = [
  'create', 'update', 'delete', 'approve', 'reject', 'activate', 'archive',
  'restore', 'send', 'schedule', 'cancel', 'import', 'export', 'merge',
  'suppress', 'configure', 'rotate', 'test',
];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadAudit();
  }, [filterModule, filterAction, filterResult, page]);

  const loadAudit = async () => {
    setLoading(true);
    let query = supabase
      .from('admin_security_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filterModule !== 'all') query = query.eq('module', filterModule);
    if (filterAction !== 'all') query = query.eq('action', filterAction);
    if (filterResult !== 'all') query = query.eq('result', filterResult);

    const { data } = await query;
    setEntries((data || []) as AuditEntry[]);
    setLoading(false);
  };

  const filteredEntries = searchQuery
    ? entries.filter(
        (e) =>
          (e.action && e.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.module && e.module.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.target_record_type && e.target_record_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.reason && e.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.correlation_id && e.correlation_id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : entries;

  const handleExport = () => {
    const headers = ['Date', 'Action', 'Module', 'Record Type', 'Result', 'Reason', 'Correlation ID'];
    const rows = filteredEntries.map((e) => [
      new Date(e.created_at).toISOString(),
      e.action,
      e.module || '',
      e.target_record_type || '',
      e.result,
      e.reason || '',
      e.correlation_id || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Audit Log</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Track all Email Studio actions across templates, campaigns, contacts, settings and more.
        </p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
            />
          </div>
          <select
            value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
          >
            <option value="all">All Modules</option>
            {MODULE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
          >
            <option value="all">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterResult}
            onChange={(e) => { setFilterResult(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={loadAudit}
            className="flex items-center gap-1.5 px-2 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Record</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs text-slate-300">{new Date(entry.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-600">{new Date(entry.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-white capitalize">{entry.action}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 capitalize">{entry.module || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{entry.target_record_type || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      entry.result === 'success' ? 'text-emerald-400' :
                      entry.result === 'failure' ? 'text-red-400' :
                      entry.result === 'warning' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {entry.result === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                       entry.result === 'failure' ? <XCircle className="w-3 h-3" /> :
                       entry.result === 'warning' ? <AlertTriangle className="w-3 h-3" /> : null}
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <span className="text-xs text-slate-500">{entry.reason || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-500 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No audit entries found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing page {page + 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer whitespace-nowrap"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={filteredEntries.length < pageSize}
              className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer whitespace-nowrap"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Audit Entry Detail</h2>
              <button onClick={() => setSelectedEntry(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Action</p>
                  <p className="text-sm text-white capitalize">{selectedEntry.action}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Result</p>
                  <span className={`text-sm font-medium ${
                    selectedEntry.result === 'success' ? 'text-emerald-400' :
                    selectedEntry.result === 'failure' ? 'text-red-400' : 'text-amber-400'
                  }`}>{selectedEntry.result}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Module</p>
                  <p className="text-sm text-white capitalize">{selectedEntry.module || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Record Type</p>
                  <p className="text-sm text-white">{selectedEntry.target_record_type || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm text-white">{new Date(selectedEntry.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Correlation ID</p>
                  <p className="text-xs text-slate-400 font-mono">{selectedEntry.correlation_id || '-'}</p>
                </div>
              </div>
              {selectedEntry.reason && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-sm text-white">{selectedEntry.reason}</p>
                </div>
              )}
              {selectedEntry.details && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Details</p>
                  <pre className="p-3 bg-white/[0.04] rounded-xl text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}