'use client';

import type { Property, MaintenanceIssue, RentRecord } from '../lib/types';

interface Props {
  properties: Property[];
  maintenance: MaintenanceIssue[];
  rentRecords: RentRecord[];
  onSwitchBack: () => void;
}

export default function TenantPerspective({ properties, maintenance, rentRecords, onSwitchBack }: Props) {
  const prop = properties.find((p) => p.id === 'prop-1');
  const myRepairs = maintenance.filter((m) => m.propertyId === 'prop-1');
  const myRent = rentRecords.find((r) => r.propertyId === 'prop-1');

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e8e5df] bg-[#faf9f7] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[#8a8a8a]">View as:</span>
            <span className="rounded-full bg-[#0d9488]/10 px-2.5 py-1 text-[10px] font-semibold text-[#0d9488]">Tenant</span>
          </div>
          <button
            onClick={onSwitchBack}
            className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-s-line mr-1" />
            Back to Manager
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl font-semibold text-[#1a2332]">Welcome, Emma.</h2>
          <p className="mt-1 text-sm text-[#8a8a8a]">{prop?.address}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#e8e5df] bg-[#faf9f7] p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-wallet-line text-sm text-[#0d9488]" />
                <span className="text-[10px] font-medium text-[#8a8a8a]">Rent</span>
              </div>
              <p className="text-sm font-semibold text-[#1a2332]">{myRent?.status || 'N/A'}</p>
              <p className="text-[10px] text-[#8a8a8a]">£{prop?.rentAmount} pcm</p>
            </div>
            <div className="rounded-xl border border-[#e8e5df] bg-[#faf9f7] p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-tools-line text-sm text-[#8a8a8a]" />
                <span className="text-[10px] font-medium text-[#8a8a8a]">Maintenance</span>
              </div>
              <p className="text-sm font-semibold text-[#1a2332]">{myRepairs.filter((r) => r.status !== 'Complete').length} open</p>
              <p className="text-[10px] text-[#8a8a8a]">{myRepairs.filter((r) => r.status === 'Complete').length} resolved</p>
            </div>
          </div>

          {myRepairs.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-[#1a2332]">Current Maintenance</h3>
              <div className="space-y-3">
                {myRepairs.map((r) => (
                  <div key={r.id} className="rounded-xl border border-[#e8e5df] bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${r.status === 'New' ? 'bg-slate-100 text-slate-500' : r.status === 'Assigned' || r.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {r.status}
                      </span>
                      {r.contractor && (
                        <span className="text-[10px] text-[#0d9488]">{r.contractor}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1a2332]">{r.title}</p>
                    <p className="mt-1 text-[11px] text-[#8a8a8a]">{r.description}</p>
                    {r.appointmentDate && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#0d9488]/15 bg-[#0d9488]/[0.04] p-2">
                        <i className="ri-calendar-check-line text-sm text-[#0d9488]" />
                        <span className="text-[11px] text-[#1a2332]">{r.appointmentDate} · {r.appointmentTime}</span>
                      </div>
                    )}
                    {r.status === 'Complete' && (
                      <div className="mt-2 flex items-center gap-2 text-emerald-600">
                        <i className="ri-check-line text-sm" />
                        <span className="text-[11px] font-medium">Repair Complete</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}