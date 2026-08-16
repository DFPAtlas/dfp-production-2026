'use client';

import PBXShell from '@/components/pbx/PBXShell';
import PBXEmptyState from '@/components/pbx/PBXEmptyState';
import { usePBXTenants } from '@/hooks/usePBXData';
import { Settings, Shield, Globe, RefreshCw } from 'lucide-react';

const integrationStatus = [
  { label: 'Twilio Voice', ready: false },
  { label: 'Twilio SMS', ready: false },
  { label: 'Webhook Endpoint', ready: false },
  { label: 'n8n Workflows', ready: false },
  { label: 'AI Receptionist', ready: false },
  { label: 'Supabase Database', ready: true },
  { label: 'Storage', ready: true },
];

export default function PBXSettingsPage() {
  const { tenants, loading, refetch } = usePBXTenants();
  const tenant = tenants[0];

  return (
    <PBXShell>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your PBX configuration</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : !tenant ? (
          <PBXEmptyState icon={<Settings className="w-7 h-7 text-slate-500" />} title="No tenant configured" description="Your PBX tenant is provisioned by Digital-Footprint. Configuration appears here once it is active." />
        ) : (
          <>
            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-[#06B6D4]" /> Company Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Company Name', value: tenant.name },
                  { label: 'Country', value: tenant.country || '—' },
                  { label: 'Timezone', value: tenant.timezone || '—' },
                  { label: 'Default Caller ID', value: tenant.default_caller_id || '—' },
                  { label: 'Recording Policy', value: tenant.recording_policy || '—' },
                  { label: 'Retention (days)', value: tenant.retention_days ?? '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                    <div className="px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#10B981]" /> Integration Status</h3>
              <div className="space-y-3">
                {integrationStatus.map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                    <span className="text-sm text-slate-300">{s.label}</span>
                    <span className={`text-xs ${s.ready ? 'text-[#10B981]' : 'text-slate-500'}`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${s.ready ? 'bg-[#10B981]' : 'bg-slate-600'}`} />
                      {s.ready ? 'Ready' : 'Not Configured'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                Provider credentials are stored server-side in Supabase Edge Function secrets and never exposed to your browser.
              </p>
            </div>
          </>
        )}
      </div>
    </PBXShell>
  );
}