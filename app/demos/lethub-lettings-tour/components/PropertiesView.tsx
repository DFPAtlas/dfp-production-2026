'use client';

import { useState } from 'react';
import type { Property, Tenancy, MaintenanceIssue, ComplianceItem, Document } from '../lib/types';

interface Props {
  properties: Property[];
  tenancies: Tenancy[];
  maintenance: MaintenanceIssue[];
  compliance: ComplianceItem[];
  documents: Document[];
  onSelectProperty: (id: string) => void;
}

export default function PropertiesView({ properties, tenancies, maintenance, compliance, documents, onSelectProperty }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');

  const selected = properties.find((p) => p.id === selectedId);
  const tenancy = selected ? tenancies.find((t) => t.propertyId === selected.id) : null;
  const propMaintenance = selected ? maintenance.filter((m) => m.propertyId === selected.id) : [];
  const propCompliance = selected ? compliance.filter((c) => c.propertyId === selected.id) : [];
  const propDocs = selected ? documents.filter((d) => d.propertyId === selected.id) : [];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0">
      <div className="w-full lg:w-72 shrink-0 border-r border-[#e8e5df] bg-[#faf9f7] max-h-[40vh] lg:max-h-none overflow-y-auto">
        <div className="border-b border-[#e8e5df] px-4 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1a2332]">Portfolio</h3>
          <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{properties.length} properties</p>
        </div>
        <div className="space-y-0.5 p-2">
          {properties.map((prop) => {
            const isActive = selectedId === prop.id;
            return (
              <button
                key={prop.id}
                onClick={() => {
                  setSelectedId(prop.id);
                  onSelectProperty(prop.id);
                  setTab('overview');
                }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition cursor-pointer ${
                  isActive ? 'bg-white border border-[#0d9488]/20 shadow-sm' : 'hover:bg-white/60'
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0eeea]">
                  <i className={`${prop.status === 'Occupied' ? 'ri-home-smile-line text-[#0d9488]' : 'ri-home-line text-[#8a8a8a]'} text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1a2332] truncate">{prop.address}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{prop.city}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[9px] font-medium ${prop.status === 'Occupied' ? 'text-emerald-600' : 'text-[#8a8a8a]'}`}>
                      {prop.status}
                    </span>
                    {prop.openRepairs > 0 && (
                      <span className="text-[9px] text-red-500">{prop.openRepairs} repair{prop.openRepairs > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-5">
        {selected ? (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#1a2332]">{selected.address}</h2>
              <p className="text-sm text-[#8a8a8a]">{selected.city}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selected.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {selected.status}
                </span>
                {selected.complianceStatus !== 'Current' && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-600">
                    {selected.complianceStatus}
                  </span>
                )}
                <span className="text-[10px] text-[#8a8a8a]">Health: {selected.healthScore}/100</span>
              </div>
            </div>

            <div className="mb-4 flex gap-1 border-b border-[#e8e5df]">
              {['overview', 'tenancy', 'maintenance', 'compliance', 'documents'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-[11px] font-medium transition border-b-2 cursor-pointer whitespace-nowrap ${
                    tab === t
                      ? 'border-[#0d9488] text-[#0d9488]'
                      : 'border-transparent text-[#8a8a8a] hover:text-[#1a2332]'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tenancy && (
                  <>
                    <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                      <p className="text-[10px] text-[#8a8a8a]">Tenant</p>
                      <p className="mt-1 text-sm font-medium text-[#1a2332]">{tenancy.tenantName}</p>
                    </div>
                    <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                      <p className="text-[10px] text-[#8a8a8a]">Tenancy</p>
                      <p className="mt-1 text-sm font-medium text-[#1a2332]">Active</p>
                      <p className="text-[10px] text-[#8a8a8a]">Since {tenancy.startDate}</p>
                    </div>
                    <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                      <p className="text-[10px] text-[#8a8a8a]">Rent</p>
                      <p className="mt-1 text-sm font-medium text-[#1a2332]">£{selected.rentAmount} pcm</p>
                    </div>
                  </>
                )}
                <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                  <p className="text-[10px] text-[#8a8a8a]">Next Payment</p>
                  <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.nextPaymentDate}</p>
                </div>
                <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                  <p className="text-[10px] text-[#8a8a8a]">Compliance</p>
                  <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.complianceStatus}</p>
                </div>
                <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                  <p className="text-[10px] text-[#8a8a8a]">Open Maintenance</p>
                  <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.openRepairs} issue{selected.openRepairs !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {tab === 'tenancy' && tenancy && (
              <div className="space-y-3">
                <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4">
                  <h4 className="text-sm font-semibold text-[#1a2332]">{tenancy.tenantName}</h4>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                    <div><span className="text-[#8a8a8a]">Started:</span> <span className="text-[#1a2332]">{tenancy.startDate}</span></div>
                    <div><span className="text-[#8a8a8a]">Ends:</span> <span className="text-[#1a2332]">{tenancy.endDate}</span></div>
                    <div><span className="text-[#8a8a8a]">Rent:</span> <span className="text-[#1a2332]">£{tenancy.rentAmount} pcm</span></div>
                    <div><span className="text-[#8a8a8a]">Deposit:</span> <span className="text-[#1a2332]">{tenancy.depositStatus}</span></div>
                    <div><span className="text-[#8a8a8a]">Next review:</span> <span className="text-[#1a2332]">{tenancy.nextReviewDate}</span></div>
                    <div><span className="text-[#8a8a8a]">Email:</span> <span className="text-[#1a2332]">{tenancy.tenantEmail}</span></div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'maintenance' && (
              <div className="space-y-2">
                {propMaintenance.length === 0 ? (
                  <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-6 text-center">
                    <i className="ri-check-line text-lg text-emerald-500 mb-1 block" />
                    <p className="text-xs text-[#8a8a8a]">No open maintenance issues</p>
                  </div>
                ) : (
                  propMaintenance.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${m.priority === 'High' ? 'bg-red-50 text-red-600' : m.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {m.priority}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${m.status === 'New' ? 'bg-slate-100 text-slate-500' : m.status === 'Assigned' ? 'bg-blue-50 text-blue-600' : m.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1a2332]">{m.title}</p>
                      <p className="mt-1 text-[11px] text-[#8a8a8a]">{m.description}</p>
                      <p className="mt-1 text-[10px] text-[#8a8a8a]">Reported by {m.reportedBy} · {m.reportedAt}</p>
                      {m.contractor && (
                        <div className="mt-2 rounded border border-[#e8e5df] bg-white p-2 text-[11px]">
                          <span className="text-[#8a8a8a]">Contractor:</span> <span className="text-[#1a2332] font-medium">{m.contractor}</span>
                          {m.appointmentDate && <span className="ml-2 text-[#0d9488]">{m.appointmentDate} · {m.appointmentTime}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'compliance' && (
              <div className="space-y-2">
                {propCompliance.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-shield-check-line text-sm text-[#8a8a8a]" />
                      <span className="text-xs text-[#1a2332]">{c.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#8a8a8a]">Expires {c.expiryDate}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${c.status === 'Current' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'documents' && (
              <div className="space-y-2">
                {propDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-file-text-line text-sm text-[#8a8a8a]" />
                      <div>
                        <p className="text-xs text-[#1a2332]">{d.title}</p>
                        <p className="text-[10px] text-[#8a8a8a]">{d.category} · {d.date}</p>
                      </div>
                    </div>
                    <button className="rounded border border-[#e8e5df] bg-white px-2.5 py-1 text-[10px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap">
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <i className="ri-home-4-line text-2xl text-[#c4c0b8] mb-2 block" />
              <p className="text-sm text-[#8a8a8a]">Select a property to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}