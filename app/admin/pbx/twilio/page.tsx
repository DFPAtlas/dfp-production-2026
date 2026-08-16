'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { usePBXWebhookEvents, usePBXSyncLogs } from '@/hooks/usePBXData';
import { RefreshCw, Wifi } from 'lucide-react';

export default function AdminTwilioPage() {
  const { events, loading: eventsLoading, refetch: refetchEvents } = usePBXWebhookEvents();
  const { logs, loading: logsLoading, refetch: refetchLogs } = usePBXSyncLogs();

  const handleRefresh = () => { refetchEvents(); refetchLogs(); };

  const verifiedCount = events.filter(e => e.signature_verified).length;
  const failedCount = events.filter(e => e.status !== 'processed' && e.status !== 'received').length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Webhooks & Provider</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor Twilio integrations, webhooks, and sync status</p>
          </div>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Event Summary</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-white/[0.02] rounded-lg">
                <p className="text-2xl font-bold text-white">{events.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Total Events</p>
              </div>
              <div className="text-center p-3 bg-white/[0.02] rounded-lg">
                <p className="text-2xl font-bold text-[#10B981]">{verifiedCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Verified</p>
              </div>
              <div className="text-center p-3 bg-white/[0.02] rounded-lg">
                <p className="text-2xl font-bold text-[#EF4444]">{failedCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Issues</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Provider Status</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-300">Twilio Credentials</span>
                <span className="text-xs text-slate-500">Not Configured</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-300">Webhook Endpoint</span>
                <span className="text-xs text-slate-500">Not Configured</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-300">Signature Verification</span>
                <span className="text-xs text-slate-500">Pending</span>
              </div>
            </div>
          </div>
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-12 text-center">
            <Wifi className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No webhook events received</p>
            <p className="text-xs text-slate-600 mt-1">Events appear when Twilio webhooks are configured and sending data</p>
          </div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-semibold text-white">Recent Events</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-2.5 font-medium">Time</th>
                    <th className="px-5 py-2.5 font-medium">Event Type</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Verified</th>
                    <th className="px-5 py-2.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{new Date(e.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{e.event_type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-2.5"><PBXStatusBadge status={e.status === 'processed' ? 'active' : e.status === 'failed' ? 'failed' : 'pending'} /></td>
                      <td className="px-5 py-2.5">{e.signature_verified ? <span className="text-[#10B981] text-xs">Yes</span> : <span className="text-slate-500 text-xs">No</span>}</td>
                      <td className="px-5 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{e.processing_notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <p className="text-xs text-slate-400">Twilio credentials are stored securely in Supabase Edge Function secrets and never exposed to the frontend. Webhook signature verification is enforced server-side.</p>
        </div>
      </div>
    </AdminShell>
  );
}