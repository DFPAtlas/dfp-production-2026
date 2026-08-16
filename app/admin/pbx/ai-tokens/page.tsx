'use client';

import AdminShell from '@/components/admin/AdminShell';
import { usePBXTenants } from '@/hooks/usePBXData';
import { RefreshCw, Bot } from 'lucide-react';

export default function AdminAITokensPage() {
  const { tenants, loading } = usePBXTenants();

  return (
    <AdminShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">AI Token Usage</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitor AI token consumption across tenants</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Tenants', value: String(tenants.filter(t => t.commercial_status === 'active').length), color: '#EC4899' },
            { label: 'AI-Ready Tenants', value: String(tenants.length), color: '#8B5CF6' },
            { label: 'Workflows Linked', value: '0', color: '#F59E0B' },
            { label: 'Tokens Used', value: '—', color: '#F97316' },
          ].map(s => (
            <div key={s.label} className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-semibold text-white">Tenant AI Readiness</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Connection</th>
                    <th className="px-5 py-3 font-medium">Health</th>
                    <th className="px-5 py-3 font-medium">AI-Ready</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="px-5 py-2.5 text-white text-sm">{t.name}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{t.commercial_status}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{t.connection_status}</td>
                      <td className="px-5 py-2.5 text-slate-300 text-xs">{t.health_status}</td>
                      <td className="px-5 py-2.5">
                        {t.connection_status === 'connected' ? (
                          <span className="text-[#10B981] text-xs">Yes</span>
                        ) : (
                          <span className="text-slate-500 text-xs">Provider Required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No tenants configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#1E293B]/50 rounded-xl border border-[rgba(255,255,255,0.04)] p-4">
          <p className="text-xs text-slate-500">AI token tracking requires configured n8n workflows and provider connections. Full AI Receptionist features are available in the Automation Control Room.</p>
        </div>
      </div>
    </AdminShell>
  );
}