'use client';

import type { RentRecord, Property } from '../lib/types';

interface Props {
  records: RentRecord[];
  properties: Property[];
  onRecordPayment: (rentId: string) => void;
}

export default function RentView({ records, properties, onRecordPayment }: Props) {
  const expected = records.reduce((sum, r) => sum + r.amount, 0);
  const received = records.filter((r) => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);
  const outstanding = records.filter((r) => r.status === 'Outstanding').reduce((sum, r) => sum + r.amount, 0);
  const onTime = Math.round((records.filter((r) => r.status === 'Paid').length / records.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Rent Position</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">Expected This Month</p>
          <p className="mt-1.5 text-2xl font-semibold text-[#1a2332]">£{expected.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">Received</p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-600">£{received.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">Outstanding</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-500">£{outstanding.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">On Time</p>
          <p className="mt-1.5 text-2xl font-semibold text-[#1a2332]">{onTime}%</p>
        </div>
      </div>

      <p className="text-[10px] text-[#8a8a8a]">Demo transaction only — no payment processed.</p>

      <div className="rounded-xl border border-[#e8e5df] bg-white overflow-hidden">
        <div className="hidden sm:grid grid-cols-5 gap-4 border-b border-[#e8e5df] bg-[#faf9f7] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
          <span>Property</span>
          <span>Tenant</span>
          <span>Amount</span>
          <span>Due</span>
          <span>Status</span>
        </div>
        {records.map((r) => {
          const prop = properties.find((p) => p.id === r.propertyId);
          return (
            <div key={r.id} className="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-center border-b border-[#e8e5df] px-4 py-3 last:border-0">
              <span className="text-xs text-[#1a2332] truncate">{prop?.address}</span>
              <span className="text-[11px] text-[#8a8a8a]">{r.tenantName}</span>
              <span className="text-xs font-medium text-[#1a2332]">£{r.amount.toLocaleString()}</span>
              <span className="text-[11px] text-[#8a8a8a]">{r.dueDate}</span>
              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {r.status}
                </span>
                {r.status === 'Outstanding' && (
                  <button
                    onClick={() => onRecordPayment(r.id)}
                    className="rounded border border-[#e8e5df] bg-white px-2 py-1 text-[10px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
                  >
                    Record Demo Payment
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