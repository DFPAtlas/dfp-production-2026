'use client';

import { useState } from 'react';
import type { Tenancy, Property } from '../lib/types';

interface Props {
  tenancies: Tenancy[];
  properties: Property[];
}

export default function TenanciesView({ tenancies, properties }: Props) {
  const [selected, setSelected] = useState<Tenancy | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Tenancies</h2>
        <p className="text-sm text-[#8a8a8a]">{tenancies.length} active</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tenancies.map((t) => {
          const prop = properties.find((p) => p.id === t.propertyId);
          return (
            <button
              key={t.id}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}
              className={`rounded-xl border bg-white p-4 text-left transition cursor-pointer ${
                selected?.id === t.id ? 'border-[#0d9488]/30 shadow-sm' : 'border-[#e8e5df] hover:border-[#0d9488]/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0eeea]">
                  <i className="ri-user-line text-sm text-[#0d9488]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">{t.tenantName}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{prop?.address}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-[#8a8a8a]">Rent:</span> <span className="text-[#1a2332] font-medium">£{t.rentAmount}</span></div>
                <div><span className="text-[#8a8a8a]">Deposit:</span> <span className="text-[#1a2332]">{t.depositStatus}</span></div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-xl border border-[#e8e5df] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1a2332]">{selected.tenantName}</h3>
          <p className="text-[11px] text-[#8a8a8a]">{properties.find((p) => p.id === selected.propertyId)?.address}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-3">
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Tenancy Status</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">Active</p>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Started</p>
              <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.startDate}</p>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Rent</p>
              <p className="mt-1 text-sm font-medium text-[#1a2332]">£{selected.rentAmount} pcm</p>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Deposit</p>
              <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.depositStatus}</p>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Next Review</p>
              <p className="mt-1 text-sm font-medium text-[#1a2332]">{selected.nextReviewDate}</p>
            </div>
            <div className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3">
              <p className="text-[10px] text-[#8a8a8a]">Contact</p>
              <p className="mt-1 text-[11px] text-[#1a2332]">{selected.tenantPhone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}