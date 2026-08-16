'use client';

import { useState } from 'react';
import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXCallLogs } from '@/hooks/usePBXData';
import { PhoneCall, Search, RefreshCw } from 'lucide-react';

export default function PBXCallLogsPage() {
  const { calls, loading, totalCount, refetch } = usePBXCallLogs();
  const [search, setSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = calls.filter((c) => {
    if (search && !c.from_number.includes(search) && !c.to_number.includes(search)) return false;
    if (filterDirection !== 'all' && c.direction !== filterDirection) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Call Logs</h1>
            <p className="text-sm text-slate-400 mt-0.5">{totalCount.toLocaleString()} total calls recorded</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
          </div>
          <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="px-3 py-2.5 pr-8 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none">
            <option value="all">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 pr-8 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <PBXEmptyState icon={<PhoneCall className="w-7 h-7 text-slate-500" />} title="No call logs" description="Call records appear here once your provider webhooks are configured and receiving events." />
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Date/Time</th>
                    <th className="px-5 py-3 font-medium">Direction</th>
                    <th className="px-5 py-3 font-medium">From</th>
                    <th className="px-5 py-3 font-medium">To</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                    <th className="px-5 py-3 font-medium">Recording</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((call) => (
                    <tr key={call.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-slate-300 text-xs font-mono">{call.start_time ? new Date(call.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-5 py-3"><span className={`text-xs font-medium ${call.direction === 'inbound' ? 'text-[#10B981]' : 'text-[#8B5CF6]'}`}>{call.direction === 'inbound' ? '↓ In' : '↑ Out'}</span></td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{call.from_number}</td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{call.to_number}</td>
                      <td className="px-5 py-3"><PBXStatusBadge status={call.status} /></td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{call.duration_seconds != null ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}` : '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{call.provider_cost != null ? `£${Number(call.provider_cost).toFixed(2)}` : '—'}</td>
                      <td className="px-5 py-3">{call.has_recording ? <span className="text-[#F59E0B] text-xs">●</span> : <span className="text-slate-600 text-xs">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Call records are populated from verified provider webhook events.</p>
        </div>
      </div>
    </PBXShell>
  );
}