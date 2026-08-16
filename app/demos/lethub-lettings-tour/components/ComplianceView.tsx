'use client';

import type { ComplianceItem, Property } from '../lib/types';

interface Props {
  items: ComplianceItem[];
  properties: Property[];
  onRenew: (itemId: string) => void;
}

export default function ComplianceView({ items, properties, onRenew }: Props) {
  const current = items.filter((i) => i.status === 'Current').length;
  const expiring = items.filter((i) => i.status === 'Expiring Soon').length;
  const action = items.filter((i) => i.status === 'Action Required').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Property Compliance</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-600">{current}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#8a8a8a]">Current</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-amber-500">{expiring}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#8a8a8a]">Expiring Soon</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-red-500">{action}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#8a8a8a]">Action Required</p>
        </div>
      </div>

      <p className="text-[10px] text-[#8a8a8a]">
        Demo compliance tracking only. Property obligations depend on property type, location and circumstances.
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const prop = properties.find((p) => p.id === item.propertyId);
          return (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#e8e5df] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0eeea]">
                  <i className="ri-shield-check-line text-sm text-[#8a8a8a]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a2332]">{item.type}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{prop?.address} · Expires {item.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.status === 'Current' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {item.status}
                </span>
                {item.status === 'Expiring Soon' && (
                  <button
                    onClick={() => onRenew(item.id)}
                    className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[10px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
                  >
                    Mark Demo Renewal
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}