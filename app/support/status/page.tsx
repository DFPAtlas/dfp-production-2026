'use client';

import Link from 'next/link';

const SERVICES = [
  { name: 'DFP Website', status: 'operational', lastChecked: 'Just now' },
  { name: 'Client Portal', status: 'operational', lastChecked: 'Just now' },
  { name: 'Staff Gateway', status: 'operational', lastChecked: 'Just now' },
  { name: 'Cloud PBX', status: 'operational', lastChecked: 'Just now' },
  { name: 'UAT TestLab', status: 'operational', lastChecked: 'Just now' },
  { name: 'GuardianHub', status: 'operational', lastChecked: 'Just now' },
  { name: 'QuickGuard', status: 'operational', lastChecked: 'Just now' },
  { name: 'LetHub', status: 'operational', lastChecked: 'Just now' },
  { name: 'Synqoro', status: 'operational', lastChecked: 'Just now' },
  { name: 'Email Studio', status: 'operational', lastChecked: 'Just now' },
  { name: 'Demo Centre', status: 'operational', lastChecked: 'Just now' },
  { name: 'Help Centre', status: 'operational', lastChecked: 'Just now' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  operational: { label: 'Operational', color: '#10B981', bg: 'bg-emerald-500/10', icon: 'ri-check-line' },
  degraded: { label: 'Degraded', color: '#F59E0B', bg: 'bg-amber-500/10', icon: 'ri-error-warning-line' },
  outage: { label: 'Outage', color: '#EF4444', bg: 'bg-red-500/10', icon: 'ri-close-circle-line' },
  maintenance: { label: 'Maintenance', color: '#3B82F6', bg: 'bg-blue-500/10', icon: 'ri-tools-line' },
};

export default function StatusPage() {
  const allOperational = SERVICES.every(s => s.status === 'operational');

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 flex items-center justify-center mx-auto mb-5">
            <i className="ri-signal-wifi-line w-7 h-7 text-[#06B6D4] flex items-center justify-center" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Service Status</h1>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Current operational status of Digital Footprint services and products.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Overall status */}
        <div className={`rounded-2xl p-6 mb-6 flex items-center gap-4 ${
          allOperational ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            allOperational ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            <i className={`${allOperational ? 'ri-check-line text-emerald-600' : 'ri-error-warning-line text-amber-600'} w-6 h-6 flex items-center justify-center`} />
          </div>
          <div>
            <p className={`font-bold text-lg ${allOperational ? 'text-emerald-800' : 'text-amber-800'}`}>
              {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
            </p>
            <p className={`text-sm ${allOperational ? 'text-emerald-600' : 'text-amber-600'}`}>
              Last updated: just now
            </p>
          </div>
        </div>

        {/* Service list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">Services</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {SERVICES.map(service => {
              const sc = statusConfig[service.status];
              return (
                <div key={service.name} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                    <span className="text-sm font-medium text-slate-700">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{service.lastChecked}</span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: sc.bg, color: sc.color }}
                    >
                      <i className={`${sc.icon} w-3 h-3 flex items-center justify-center`} />
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-start gap-3">
            <i className="ri-information-line w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5 flex items-center justify-center" />
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">About This Page</p>
              <p className="text-xs text-slate-400">
                This page shows the current operational status of Digital Footprint services. Status information is updated regularly. If you are experiencing issues that are not reflected here, please{' '}
                <Link href="/support/request" className="text-[#06B6D4] underline cursor-pointer">submit a support request</Link>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/help" className="px-5 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap">
            Browse Help
          </Link>
          <Link href="/support" className="px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
            Get Support
          </Link>
        </div>
      </div>
    </main>
  );
}