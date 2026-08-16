'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXVoicemailBoxes, usePBXVoicemailMessages } from '@/hooks/usePBXData';
import { Voicemail, RefreshCw } from 'lucide-react';

export default function PBXVoicemailPage() {
  const { boxes, loading: boxesLoading, refetch: refetchBoxes } = usePBXVoicemailBoxes();
  const { messages, loading: messagesLoading, refetch: refetchMessages } = usePBXVoicemailMessages();

  const refresh = () => { refetchBoxes(); refetchMessages(); };

  return (
    <PBXShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Voicemail</h1>
            <p className="text-sm text-slate-400 mt-0.5">Voicemail boxes and messages</p>
          </div>
          <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white">Voicemail Boxes</h3>
          </div>
          {boxesLoading ? (
            <div className="flex items-center justify-center h-32"><div className="w-7 h-7 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : boxes.length === 0 ? (
            <PBXEmptyState icon={<Voicemail className="w-7 h-7 text-slate-500" />} title="No voicemail boxes" description="Voicemail boxes are created by Digital-Footprint for each extension during provisioning." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-2.5 font-medium">Extension</th>
                    <th className="px-5 py-2.5 font-medium">Owner</th>
                    <th className="px-5 py-2.5 font-medium">Notification</th>
                    <th className="px-5 py-2.5 font-medium">Transcription</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {boxes.map((b) => (
                    <tr key={b.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{b.extension_number || '—'}</td>
                      <td className="px-5 py-2.5 text-white text-sm">{b.pbx_users?.name || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{b.notification_email || '—'}</td>
                      <td className="px-5 py-2.5">{b.transcription_enabled ? <span className="text-[#10B981] text-xs">● On</span> : <span className="text-slate-500 text-xs">—</span>}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-white">Messages</h3>
          </div>
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32"><div className="w-7 h-7 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <PBXEmptyState icon={<Voicemail className="w-7 h-7 text-slate-500" />} title="No voicemail messages" description="Voicemail messages appear here once your provider connection is live and recording calls." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-2.5 font-medium">Received</th>
                    <th className="px-5 py-2.5 font-medium">Caller</th>
                    <th className="px-5 py-2.5 font-medium">Called</th>
                    <th className="px-5 py-2.5 font-medium">Duration</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{m.received_at ? new Date(m.received_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{m.caller_number || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-300 font-mono text-xs">{m.called_number || '—'}</td>
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{m.duration_seconds != null ? `${Math.floor(m.duration_seconds / 60)}:${String(m.duration_seconds % 60).padStart(2, '0')}` : '—'}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={m.is_read ? 'listened' : 'new'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Voicemail recordings are stored in private storage and only accessible to authorised users.</p>
        </div>
      </div>
    </PBXShell>
  );
}