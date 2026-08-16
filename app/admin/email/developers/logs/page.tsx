'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowRight, FileText, Search, Clock, CheckCircle2, XCircle, AlertTriangle, Activity, Filter, Shield } from 'lucide-react';

interface ApiLog {
  id: string;
  appName: string;
  keyPrefix: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  rateLimitResult: string;
  errorCode: string | null;
  idempotencyState: string | null;
  created: string;
}

export default function DeveloperLogs() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: rawLogs } = await supabase
        .from('email_api_logs')
        .select('id, application_id, key_prefix, endpoint, method, status_code, duration_ms, rate_limit_result, error_code, idempotency_state, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      let nameMap: Record<string, string> = {};
      if (rawLogs && rawLogs.length > 0) {
        const appIds = [...new Set(rawLogs.map((l: { application_id: string | null }) => l.application_id).filter(Boolean))] as string[];
        if (appIds.length > 0) {
          const { data: apps } = await supabase.from('email_developer_apps').select('id, name').in('id', appIds);
          (apps || []).forEach((a: { id: string; name: string }) => { nameMap[a.id] = a.name; });
        }
      }

      if (rawLogs) {
        setLogs(rawLogs.map((l: Record<string, unknown>) => ({
          id: l.id as string,
          appName: (l.application_id ? nameMap[l.application_id as string] : null) || '—',
          keyPrefix: (l.key_prefix as string) || '',
          endpoint: (l.endpoint as string) || '',
          method: (l.method as string) || '',
          statusCode: (l.status_code as number) || 0,
          durationMs: (l.duration_ms as number) || 0,
          rateLimitResult: (l.rate_limit_result as string) || '',
          errorCode: (l.error_code as string) || null,
          idempotencyState: (l.idempotency_state as string) || null,
          created: (l.created_at as string) || '',
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = logs.filter((l) => {
    if (search && !l.appName.toLowerCase().includes(search.toLowerCase()) && !l.endpoint.toLowerCase().includes(search.toLowerCase()) && !l.keyPrefix.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === '2xx' && (l.statusCode < 200 || l.statusCode >= 300)) return false;
    if (statusFilter === '4xx' && (l.statusCode < 400 || l.statusCode >= 500)) return false;
    if (statusFilter === '5xx' && (l.statusCode < 500 || l.statusCode >= 600)) return false;
    if (statusFilter === 'rate_limit' && l.errorCode !== 'rate_limit_exceeded') return false;
    return true;
  });

  const avgDuration = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / logs.length) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-12 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">API Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time API request logs — never includes secrets, auth headers, or restricted payloads.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/developers" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Logs', value: logs.length, color: 'text-[#06B6D4]' },
          { label: '2xx', value: logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length, color: 'text-emerald-400' },
          { label: '4xx', value: logs.filter((l) => l.statusCode >= 400 && l.statusCode < 500).length, color: 'text-amber-400' },
          { label: 'Rate Limited', value: logs.filter((l) => l.errorCode === 'rate_limit_exceeded').length, color: 'text-orange-400' },
          { label: 'Avg Duration', value: logs.length > 0 ? `${avgDuration}ms` : '—', color: 'text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by app, endpoint or key prefix..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 pr-8 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          <option value="all" className="bg-[#1a1a1e] text-white">All Requests</option>
          <option value="2xx" className="bg-[#1a1a1e] text-white">2xx Success</option>
          <option value="4xx" className="bg-[#1a1a1e] text-white">4xx Client Error</option>
          <option value="5xx" className="bg-[#1a1a1e] text-white">5xx Server Error</option>
          <option value="rate_limit" className="bg-[#1a1a1e] text-white">Rate Limited</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{logs.length === 0 ? 'No API requests logged yet' : 'No requests match your filters'}</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Application</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Endpoint</th>
                  <th className="text-center px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="text-center px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Rate Limit</th>
                  <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Error / Idempotency</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const isError = log.statusCode >= 400;
                  const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
                  const isSlow = log.durationMs > 200;
                  return (
                    <tr key={log.id} className={`border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors ${isError ? 'bg-red-400/[0.02]' : ''}`}>
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                        {log.created ? new Date(log.created).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-xs text-white truncate max-w-[120px]">{log.appName}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{log.keyPrefix}••••</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          log.method === 'GET' ? 'text-sky-400 bg-sky-400/10' :
                          log.method === 'POST' ? 'text-emerald-400 bg-emerald-400/10' :
                          log.method === 'PUT' ? 'text-amber-400 bg-amber-400/10' :
                          'text-slate-400 bg-slate-400/10'
                        }`}>{log.method}</span>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-[11px] text-slate-400 font-mono truncate max-w-[220px] block">{log.endpoint}</code>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isSuccess ? 'text-emerald-400 bg-emerald-400/10' :
                          isError ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-400/10'
                        }`}>
                          {isSuccess ? <CheckCircle2 className="w-2.5 h-2.5" /> : isError ? <XCircle className="w-2.5 h-2.5" /> : null}
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs ${isSlow ? 'text-amber-400' : 'text-slate-400'}`}>{log.durationMs}ms</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          log.rateLimitResult === 'exceeded' ? 'text-red-400 bg-red-400/10' :
                          log.rateLimitResult === 'passed' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10'
                        }`}>{log.rateLimitResult}</span>
                      </td>
                      <td className="px-5 py-3">
                        {log.errorCode ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-mono">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {log.errorCode}
                          </span>
                        ) : log.idempotencyState ? (
                          <span className={`text-[10px] font-mono ${log.idempotencyState === 'new' ? 'text-[#06B6D4]' : log.idempotencyState === 'conflict' ? 'text-amber-400' : 'text-slate-400'}`}>
                            idem: {log.idempotencyState}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}