'use client';

import AdminShell from '@/components/admin/AdminShell';
import { usePBXWebhookEvents, usePBXSyncLogs, usePBXTenants } from '@/hooks/usePBXData';
import { RefreshCw } from 'lucide-react';

export default function AdminSystemStatusPage() {
  const { events } = usePBXWebhookEvents();
  const { logs } = usePBXSyncLogs();
  const { tenants } = usePBXTenants();

  const healthyTenants = tenants.filter(t => t.health_status === 'healthy').length;
  const degradedTenants = tenants.filter(t => t.health_status === 'degraded').length;
  const failingTenants = tenants.filter(t => t.health_status === 'failing').length;
  const authFailed = tenants.filter(t => t.connection_status === 'authentication_failed').length;

  const recentIssues = [
    ...events.filter(e => e.status !== 'processed').slice(0, 3).map(e => ({ time: e.created_at, type: `webhook_${e.event_type}`, detail: e.processing_notes || 'Processing issue', severity: 'warning' })),
    ...logs.filter(l => l.status === 'failed').slice(0, 3).map(l => ({ time: l.started_at, type: 'sync_failure', detail: l.safe_error || 'Sync failed', severity: 'error' })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">System Status</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor overall PBX system health and issues</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Healthy Tenants', value: String(healthyTenants), color: '#10B981' },
            { label: 'Degraded', value: String(degradedTenants), color: '#F59E0B' },
            { label: 'Failing', value: String(failingTenants), color: '#EF4444' },
            { label: 'Auth Failures', value: String(authFailed), color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Supabase Database', status: 'unknown' },
            { name: 'Supabase Auth', status: 'unknown' },
            { name: 'Edge Functions', status: 'unknown' },
            { name: 'Storage', status: 'unknown' },
            { name: 'Twilio Voice', configured: false },
            { name: 'Twilio SMS', configured: false },
            { name: 'Webhook Endpoint', configured: false },
            { name: 'n8n Integration', configured: false },
            { name: 'Stripe (Edge Function)', status: 'unknown' },
          ].map(s => (
            <div key={s.name} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{s.name}</span>
                {'configured' in s ? (
                  <span className={`text-xs ${s.configured ? 'text-[#10B981]' : 'text-slate-500'}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.configured ? 'bg-[#10B981]' : 'bg-slate-600'}`} />
                    {s.configured ? 'Online' : 'Not Configured'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500"><span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600 mr-1.5" />Not Verified</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {recentIssues.length > 0 && (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-semibold text-white">Recent Issues</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-2.5 font-medium">Time</th>
                    <th className="px-5 py-2.5 font-medium">Type</th>
                    <th className="px-5 py-2.5 font-medium">Detail</th>
                    <th className="px-5 py-2.5 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.map((iss, i) => (
                    <tr key={i} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="px-5 py-2.5 text-slate-400 font-mono text-xs">{new Date(iss.time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{iss.type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs max-w-[350px] truncate">{iss.detail}</td>
                      <td className="px-5 py-2.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${iss.severity === 'error' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                          {iss.severity === 'error' ? 'Error' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Provider credentials (Twilio, n8n) must be configured in Supabase Edge Function secrets for full system operation.</p>
        </div>
      </div>
    </AdminShell>
  );
}