'use client';

import AdminShell from '@/components/admin/AdminShell';
import PBXStatCard from '@/components/pbx/PBXStatCard';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import { usePBXMetrics, usePBXTenants, usePBXWebhookEvents, usePBXSyncLogs } from '@/hooks/usePBXData';
import Link from 'next/link';
import { Building2, Phone, PhoneCall, PhoneMissed, Voicemail, MessageSquare, Activity, AlertTriangle, Wifi, Layers, RefreshCw } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function AdminPBXPage() {
  const { metrics, loading: metricsLoading, refetch: refetchMetrics } = usePBXMetrics();
  const { tenants, loading: tenantsLoading } = usePBXTenants();
  const { events } = usePBXWebhookEvents();
  const { logs } = usePBXSyncLogs();
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = useCallback(() => {
    refetchMetrics();
  }, [refetchMetrics]);

  const recentTenants = tenants.slice(0, 5);
  const recentEvents = events.slice(0, 8);
  const recentSyncs = logs.slice(0, 5);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">PBX Overview</h1>
            <p className="text-sm text-slate-400 mt-0.5">Super admin view of all PBX tenants and system health</p>
          </div>
          <button onClick={handleRefresh} disabled={syncing} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>

        {metricsLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <PBXStatCard title="Total Tenants" value={String(metrics.totalTenants)} icon={<Building2 className="w-5 h-5" />} color="#06B6D4" />
            <PBXStatCard title="Active Tenants" value={String(metrics.activeTenants)} icon={<Building2 className="w-5 h-5" />} color="#10B981" />
            <PBXStatCard title="Active Numbers" value={String(metrics.totalNumbers)} icon={<Phone className="w-5 h-5" />} color="#8B5CF6" subtitle={`${metrics.assignedNumbers} assigned`} />
            <PBXStatCard title="Calls Today" value={metrics.callsToday.toLocaleString()} icon={<PhoneCall className="w-5 h-5" />} color="#06B6D4" />
            <PBXStatCard title="Missed Calls" value={String(metrics.missedCalls)} icon={<PhoneMissed className="w-5 h-5" />} color="#F97316" />
            <PBXStatCard title="Voicemails Today" value={String(metrics.voicemailsToday)} icon={<Voicemail className="w-5 h-5" />} color="#F59E0B" />
            <PBXStatCard title="Messages Today" value={metrics.messagesToday.toLocaleString()} icon={<MessageSquare className="w-5 h-5" />} color="#8B5CF6" />
            <PBXStatCard title="Active Queues" value={String(metrics.activeQueues)} icon={<Layers className="w-5 h-5" />} color="#EC4899" />
            <PBXStatCard title="Webhook Issues" value={String(metrics.webhookFailures)} icon={<Wifi className="w-5 h-5" />} color={metrics.webhookFailures > 0 ? '#EF4444' : '#10B981'} />
            <PBXStatCard title="Auth Failures" value={String(metrics.connectionFailures)} icon={<AlertTriangle className="w-5 h-5" />} color={metrics.connectionFailures > 0 ? '#EF4444' : '#10B981'} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Tenants</h3>
                <Link href="/admin/pbx/tenants" className="text-xs text-[#06B6D4] hover:underline cursor-pointer">View All</Link>
              </div>
              {tenantsLoading ? (
                <div className="flex items-center justify-center h-24"><div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
              ) : recentTenants.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No tenants configured yet</p>
              ) : (
                <div className="space-y-1">
                  {recentTenants.map(t => (
                    <Link key={t.id} href={`/admin/pbx/tenants`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-white">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <PBXStatusBadge status={t.commercial_status} />
                        <span className="text-xs text-slate-500">{t.reference}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Recent Sync Activity</h3>
              {recentSyncs.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No sync runs recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]"><th className="py-2 font-medium">Tenant</th><th className="py-2 font-medium">Type</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Records</th><th className="py-2 font-medium">Time</th></tr></thead>
                    <tbody>
                      {recentSyncs.map(s => (
                        <tr key={s.id} className="border-b border-[rgba(255,255,255,0.03)]">
                          <td className="py-2 text-slate-300 text-xs">{s.pbx_tenants?.name || '—'}</td>
                          <td className="py-2 text-slate-400 text-xs">{s.sync_type}</td>
                          <td className="py-2"><PBXStatusBadge status={s.status === 'completed' ? 'active' : s.status === 'failed' ? 'failed' : 'pending'} /></td>
                          <td className="py-2 text-slate-400 text-xs">+{s.records_created || 0} / ~{s.records_updated || 0}</td>
                          <td className="py-2 text-slate-500 text-xs">{s.started_at ? new Date(s.started_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Provider Status</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Twilio Voice', configured: false },
                  { label: 'Twilio SMS', configured: false },
                  { label: 'Webhook Endpoint', configured: false },
                  { label: 'n8n Workflows', configured: false },
                  { label: 'Storage', configured: true },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-300">{s.label}</span>
                    <span className={`flex items-center gap-1.5 text-xs ${s.configured ? 'text-[#10B981]' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.configured ? 'bg-[#10B981]' : 'bg-slate-600'}`} />
                      {s.configured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Webhook Events</h3>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No webhook events received</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {recentEvents.map(e => (
                    <div key={e.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.signature_verified ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      <span className="text-slate-400">{e.event_type}</span>
                      <span className="text-slate-500 ml-auto">{new Date(e.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: '/admin/pbx/tenants', label: 'Manage Tenants' },
                  { href: '/admin/pbx/numbers', label: 'Number Inventory' },
                  { href: '/admin/pbx/calls', label: 'Call Logs' },
                  { href: '/admin/pbx/twilio', label: 'Webhooks & Provider' },
                  { href: '/admin/pbx/billing', label: 'Usage & Costs' },
                  { href: '/admin/pbx/system-status', label: 'System Status' },
                  { href: '/admin/pbx/n8n', label: 'n8n Workflows' },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="w-1 h-1 rounded-full bg-[#06B6D4]" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">Twilio credentials are stored server-side in Supabase Edge Function secrets. Provider connection requires verified API keys and webhook configuration.</p>
        </div>
      </div>
    </AdminShell>
  );
}