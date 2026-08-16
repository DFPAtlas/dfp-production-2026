'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { Shield, Search, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const PAGE_SIZE = 25;

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  module: string | null;
  target_record_type: string | null;
  target_record_id: string | null;
  target_user_id: string | null;
  target_email: string | null;
  result: string;
  reason: string | null;
  success: boolean;
  correlation_id: string | null;
  source: string;
  ip_address: string | null;
  created_at: string;
  before_summary: unknown;
  after_summary: unknown;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('admin_security_audit_log')
      .select('*', { count: 'exact' });

    if (filterAction) query = query.eq('action', filterAction);
    if (filterModule) query = query.eq('module', filterModule);
    if (filterResult) query = query.eq('result', filterResult);
    if (searchTerm) query = query.or(`action.ilike.%${searchTerm}%,module.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`);

    const { data, error: queryErr, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (queryErr) { setError(queryErr.message); setLoading(false); return; }

    setLogs((data || []) as AuditRow[]);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, filterAction, filterModule, filterResult, searchTerm]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const uniqueActions = [...new Set(logs.map((l) => l.action))].slice(0, 20);
  const uniqueModules = [...new Set(logs.filter((l) => l.module).map((l) => l.module as string))].slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">{totalCount} audit records — read-only</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] text-red-400 font-medium uppercase">Restricted Access</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            placeholder="Search audit log..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40"
          />
        </div>

        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(0); }} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none appearance-none pr-8">
          <option value="">All actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={filterModule} onChange={(e) => { setFilterModule(e.target.value); setPage(0); }} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none appearance-none pr-8">
          <option value="">All modules</option>
          {uniqueModules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterResult} onChange={(e) => { setFilterResult(e.target.value); setPage(0); }} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none appearance-none pr-8">
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="denied">Denied</option>
          <option value="failed">Failed</option>
          <option value="partial">Partial</option>
        </select>

        {(filterAction || filterModule || filterResult || searchTerm) && (
          <button onClick={() => { setFilterAction(''); setFilterModule(''); setFilterResult(''); setSearchTerm(''); setPage(0); }} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer whitespace-nowrap flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[52px] bg-white/[0.02] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-400">Failed to load audit log</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <button onClick={load} className="mt-3 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer">Retry</button>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No audit records found</p>
          <p className="text-xs text-slate-600 mt-1">Audit events appear here when sensitive actions are performed</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Module</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                    <th className="text-right p-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-medium text-white">{log.action}</span>
                        {log.reason && <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">{log.reason}</p>}
                      </td>
                      <td className="p-3 text-xs text-slate-400">{log.module || '—'}</td>
                      <td className="p-3">
                        {log.target_record_type ? (
                          <span className="text-xs text-slate-300">{log.target_record_type}</span>
                        ) : log.target_email ? (
                          <span className="text-xs text-slate-400 truncate max-w-[120px] block">{log.target_email}</span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.result === 'success' ? 'bg-green-500/10 text-green-400' : log.result === 'denied' ? 'bg-red-500/10 text-red-400' : log.result === 'failed' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">{log.source || 'system'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedDetail(log)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-slate-500 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all ${i === page ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDetail(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Audit Entry Detail</h3>
                <button onClick={() => setSelectedDetail(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">ID</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Correlation ID</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedDetail.correlation_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Action</span>
                  <span className="text-xs text-white font-medium">{selectedDetail.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Module</span>
                  <span className="text-xs text-slate-300">{selectedDetail.module || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Result</span>
                  <span className={`text-xs font-medium ${selectedDetail.result === 'success' ? 'text-green-400' : selectedDetail.result === 'denied' ? 'text-red-400' : 'text-yellow-400'}`}>{selectedDetail.result}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Reason</span>
                  <span className="text-xs text-slate-300">{selectedDetail.reason || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Source</span>
                  <span className="text-xs text-slate-300">{selectedDetail.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">IP Address</span>
                  <span className="text-xs text-slate-300 font-mono">{selectedDetail.ip_address || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Time</span>
                  <span className="text-xs text-slate-300">{new Date(selectedDetail.created_at).toLocaleString('en-GB')}</span>
                </div>

                {selectedDetail.before_summary != null && (
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <span className="text-xs text-slate-500 block mb-1">Before (redacted)</span>
                    <pre className="text-xs text-slate-400 bg-black/20 rounded-lg p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(selectedDetail.before_summary, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                )}
                {selectedDetail.after_summary != null && (
                  <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <span className="text-xs text-slate-500 block mb-1">After (redacted)</span>
                    <pre className="text-xs text-slate-400 bg-black/20 rounded-lg p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(selectedDetail.after_summary, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
