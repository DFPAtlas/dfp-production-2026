'use client';

import { useState } from 'react';
import type { MaintenanceIssue, Property } from '../lib/types';
import { demoContractors } from '../lib/data';

interface Props {
  issues: MaintenanceIssue[];
  properties: Property[];
  onAssignContractor: (issueId: string, contractor: string, type: string) => void;
  onCompleteRepair: (issueId: string) => void;
}

export default function MaintenanceView({ issues, properties, onAssignContractor, onCompleteRepair }: Props) {
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [contractorReport, setContractorReport] = useState<string | null>(null);

  const openIssues = issues.filter((i) => i.status !== 'Complete');
  const completedIssues = issues.filter((i) => i.status === 'Complete');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Maintenance</h2>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-[#8a8a8a]">Open: <span className="font-medium text-[#1a2332]">{openIssues.length}</span></span>
          <span className="text-[#8a8a8a]">Complete: <span className="font-medium text-[#1a2332]">{completedIssues.length}</span></span>
        </div>
      </div>

      <div className="space-y-3">
        {openIssues.map((issue) => {
          const prop = properties.find((p) => p.id === issue.propertyId);
          return (
            <div key={issue.id} className="rounded-xl border border-[#e8e5df] bg-white p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${issue.priority === 'High' ? 'bg-red-50 text-red-600' : issue.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {issue.priority}
                </span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${issue.status === 'New' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                  {issue.status}
                </span>
                <span className="text-[10px] text-[#8a8a8a]">{prop?.address}</span>
              </div>

              <h3 className="text-base font-semibold text-[#1a2332]">{issue.title}</h3>
              <p className="mt-1 text-sm text-[#8a8a8a]">{issue.description}</p>
              <p className="mt-1 text-[11px] text-[#8a8a8a]">Reported by {issue.reportedBy} · {issue.reportedAt}</p>

              {issue.contractor && (
                <div className="mt-3 rounded-lg border border-[#0d9488]/20 bg-[#0d9488]/[0.04] p-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-tools-line text-sm text-[#0d9488]" />
                    <span className="text-sm font-medium text-[#1a2332]">{issue.contractor}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8a8a8a]">{issue.contractorType} · {issue.appointmentDate} · {issue.appointmentTime}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {issue.status === 'New' && (
                  <>
                    <button
                      onClick={() => setAssigningId(assigningId === issue.id ? null : issue.id)}
                      className="rounded-lg bg-[#1a2332] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#2a3342] cursor-pointer whitespace-nowrap"
                    >
                      Assign Contractor
                    </button>
                    <button className="rounded-lg border border-[#e8e5df] bg-white px-4 py-2 text-[11px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap">
                      Message Tenant
                    </button>
                  </>
                )}

                {issue.status === 'Assigned' && (
                  <>
                    <button
                      onClick={() => {
                        setCompletingId(issue.id);
                        setContractorReport('Boiler repressurised and expansion vessel checked. Recommendation: Monitor pressure for 7 days.');
                      }}
                      className="rounded-lg bg-[#0d9488] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0f766e] cursor-pointer whitespace-nowrap"
                    >
                      Simulate Contractor Visit
                    </button>
                  </>
                )}

                {issue.status === 'In Progress' && (
                  <button
                    onClick={() => onCompleteRepair(issue.id)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
                  >
                    Mark Repair Complete
                  </button>
                )}
              </div>

              {assigningId === issue.id && (
                <div className="mt-4 rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4">
                  <p className="text-xs font-medium text-[#1a2332] mb-3">Choose a contractor</p>
                  <div className="space-y-2">
                    {demoContractors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          onAssignContractor(issue.id, c.name, c.type);
                          setAssigningId(null);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-[#e8e5df] bg-white p-3 text-left transition hover:border-[#0d9488]/30 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-medium text-[#1a2332]">{c.name}</p>
                          <p className="text-[10px] text-[#8a8a8a]">{c.type}</p>
                        </div>
                        <span className="text-[10px] font-medium text-[#0d9488]">{c.availability}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {completingId === issue.id && contractorReport && (
                <div className="mt-4 rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-4">
                  <p className="text-xs font-medium text-[#1a2332] mb-2">Contractor Report</p>
                  <p className="text-sm text-[#8a8a8a]">{contractorReport}</p>
                  <button
                    onClick={() => {
                      onCompleteRepair(issue.id);
                      setCompletingId(null);
                      setContractorReport(null);
                    }}
                    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
                  >
                    Mark Repair Complete
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {openIssues.length === 0 && (
          <div className="rounded-xl border border-[#e8e5df] bg-white p-8 text-center">
            <i className="ri-check-double-line text-2xl text-emerald-500 mb-2 block" />
            <p className="text-sm text-[#8a8a8a]">All maintenance issues resolved</p>
          </div>
        )}
      </div>

      {completedIssues.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-[#8a8a8a]">Completed</h3>
          <div className="space-y-2">
            {completedIssues.map((issue) => {
              const prop = properties.find((p) => p.id === issue.propertyId);
              return (
                <div key={issue.id} className="flex items-center justify-between rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-check-line text-sm text-emerald-500" />
                    <span className="text-xs text-[#1a2332]">{issue.title}</span>
                    <span className="text-[10px] text-[#8a8a8a]">{prop?.address}</span>
                  </div>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">Complete</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}