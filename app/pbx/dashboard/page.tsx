'use client';

import { useState } from 'react';
import PBXShell from '@/components/pbx/PBXShell';
import PBXStatCard from '@/components/pbx/PBXStatCard';
import PBXStatusBadge from '@/components/pbx/PBXStatusBadge';
import PBXComingSoonBanner from '@/components/pbx/PBXComingSoonBanner';
import PBXEarlyAccessModal from '@/components/pbx/PBXEarlyAccessModal';
import { usePBXMetrics, usePBXCallLogs } from '@/hooks/usePBXData';
import Link from 'next/link';
import { Phone, PhoneCall, PhoneMissed, Voicemail, MessageSquare, Layers, Wifi, AlertTriangle, ArrowUpRight, Activity } from 'lucide-react';

const quickActions = [
  { label: 'Phone Numbers', href: '/pbx/numbers', icon: Phone, color: '#06B6D4' },
  { label: 'Users & Extensions', href: '/pbx/users', icon: PhoneCall, color: '#10B981' },
  { label: 'Call Routing', href: '/pbx/call-routing', icon: Activity, color: '#8B5CF6' },
  { label: 'Opening Hours', href: '/pbx/opening-hours', icon: Voicemail, color: '#F59E0B' },
  { label: 'Voicemail', href: '/pbx/voicemail', icon: Voicemail, color: '#F97316' },
  { label: 'Call Logs', href: '/pbx/call-logs', icon: PhoneCall, color: '#EC4899' },
];

export default function PBXDashboardPage() {
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const { metrics, loading } = usePBXMetrics();
  const { calls } = usePBXCallLogs();

  const recentCalls = calls.slice(0, 7);

  const integrationStatus = [
    { label: 'Twilio Voice', ready: false },
    { label: 'Twilio SMS', ready: false },
    { label: 'Webhook Endpoint', ready: false },
    { label: 'n8n Workflows', ready: false },
    { label: 'Storage', ready: true },
  ];

  return (
    <PBXShell hideComingSoonBar>
      <div className="space-y-6">
        <PBXComingSoonBanner onRequestAccess={() => setEarlyAccessOpen(true)} />

        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back — here is your PBX overview</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <PBXStatCard title="Active Numbers" value={loading ? '—' : String(metrics.totalNumbers)} icon={<Phone className="w-5 h-5" />} color="#06B6D4" />
          <PBXStatCard title="Calls Today" value={loading ? '—' : metrics.callsToday.toLocaleString()} icon={<PhoneCall className="w-5 h-5" />} color="#10B981" />
          <PBXStatCard title="Missed Calls" value={loading ? '—' : String(metrics.missedCalls)} icon={<PhoneMissed className="w-5 h-5" />} color="#EF4444" />
          <PBXStatCard title="Voicemails Today" value={loading ? '—' : String(metrics.voicemailsToday)} icon={<Voicemail className="w-5 h-5" />} color="#F59E0B" />
          <PBXStatCard title="SMS Today" value={loading ? '—' : metrics.messagesToday.toLocaleString()} icon={<MessageSquare className="w-5 h-5" />} color="#8B5CF6" />
          <PBXStatCard title="Active Queues" value={loading ? '—' : String(metrics.activeQueues)} icon={<Layers className="w-5 h-5" />} color="#EC4899" />
          <PBXStatCard title="Webhook Issues" value={loading ? '—' : String(metrics.webhookFailures)} icon={<Wifi className="w-5 h-5" />} color={metrics.webhookFailures > 0 ? '#EF4444' : '#22D3EE'} />
          <PBXStatCard title="Auth Failures" value={loading ? '—' : String(metrics.connectionFailures)} icon={<AlertTriangle className="w-5 h-5" />} color={metrics.connectionFailures > 0 ? '#EF4444' : '#22D3EE'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Call Activity</h3>
                <Link href="/pbx/call-logs" className="text-xs text-[#06B6D4] hover:underline flex items-center gap-1 cursor-pointer">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {recentCalls.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">No call activity yet. Call logs appear once your provider connection is live.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.04)]">
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Direction</th>
                        <th className="pb-2 font-medium">From</th>
                        <th className="pb-2 font-medium">To</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCalls.map((call) => (
                        <tr key={call.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-white/[0.02]">
                          <td className="py-2.5 text-slate-300 font-mono text-xs">{call.start_time ? new Date(call.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td className="py-2.5">
                            <span className={`text-xs ${call.direction === 'inbound' ? 'text-[#10B981]' : 'text-[#8B5CF6]'}`}>
                              {call.direction === 'inbound' ? '↓ In' : '↑ Out'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-300 font-mono text-xs">{call.from_number}</td>
                          <td className="py-2.5 text-slate-300 font-mono text-xs">{call.to_number}</td>
                          <td className="py-2.5"><PBXStatusBadge status={call.status} /></td>
                          <td className="py-2.5 text-slate-400 font-mono text-xs">
                            {call.duration_seconds != null ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}
                    className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: action.color + '18' }}>
                      <action.icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 h-fit">
            <h3 className="text-sm font-semibold text-white mb-4">Integration Status</h3>
            <div className="space-y-2.5">
              {integrationStatus.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                  <span className="text-sm text-slate-300">{s.label}</span>
                  <span className={`text-xs ${s.ready ? 'text-[#10B981]' : 'text-slate-500'}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.ready ? 'bg-[#10B981]' : 'bg-slate-600'}`} />
                    {s.ready ? 'Ready' : 'Not Configured'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              Provider credentials (Twilio, n8n) are configured by Digital-Footprint in Supabase Edge Function secrets. Until they are set, calls, SMS and recordings remain inactive.
            </p>
          </div>
        </div>
      </div>

      <PBXEarlyAccessModal open={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </PBXShell>
  );
}