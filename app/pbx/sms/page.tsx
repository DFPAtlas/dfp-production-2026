'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXMessages } from '@/hooks/usePBXData';
import { MessageSquare, RefreshCw } from 'lucide-react';

export default function PBXSMSPage() {
  const { messages, loading, refetch } = usePBXMessages();

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">SMS</h1>
            <p className="text-sm text-slate-400 mt-0.5">SMS messages for your tenant</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <PBXEmptyState icon={<MessageSquare className="w-7 h-7 text-slate-500" />} title="No SMS messages" description="SMS messages appear here once your Twilio SMS connection is live." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-4 py-2.5 font-medium">Time</th>
                    <th className="px-4 py-2.5 font-medium">Direction</th>
                    <th className="px-4 py-2.5 font-medium">From</th>
                    <th className="px-4 py-2.5 font-medium">To</th>
                    <th className="px-4 py-2.5 font-medium">Message</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{m.created_at ? new Date(m.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs ${m.direction === 'inbound' ? 'text-[#10B981]' : 'text-[#8B5CF6]'}`}>{m.direction === 'inbound' ? '↓ In' : '↑ Out'}</span></td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{m.from_number}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{m.to_number}</td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs max-w-[240px] truncate">{m.body_preview || '—'}</td>
                      <td className="px-4 py-2.5"><PBXStatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">SMS sending and templates require a configured Twilio connection and approved destinations.</p>
        </div>
      </div>
    </PBXShell>
  );
}