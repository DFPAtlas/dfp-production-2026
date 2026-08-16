'use client';

import { useState } from 'react';
import { Check, CirclePoundSterling, CalendarDays, ShieldCheck } from 'lucide-react';
import { Invoice } from '../lib/types';

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface BillingViewProps {
  invoices: Invoice[];
  onInvoicesChange: (invoices: Invoice[]) => void;
  onActivity: (msg: string) => void;
}

export default function BillingView({
  invoices,
  onInvoicesChange,
  onActivity,
}: BillingViewProps) {
  const [selectedId, setSelectedId] = useState('final');
  const selected = invoices.find((i) => i.id === selectedId) ?? invoices[0];
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);

  const markPaid = () => {
    if (selected.status === 'Paid') {
      onActivity(`${selected.label} is already marked paid.`);
      return;
    }
    onInvoicesChange(
      invoices.map((inv) =>
        inv.id === selected.id
          ? { ...inv, status: 'Paid' as const, due: 'Paid just now' }
          : inv
      )
    );
    onActivity(`Simulated payment recorded for ${selected.label}.`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#1a2332]">Project Payments</h2>
        <p className="mt-1 text-sm text-[#6b7b8e]">
          Know what is paid, outstanding and coming next.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Project Value', value: currency.format(total), note: 'Four payment stages', icon: CirclePoundSterling },
          { label: 'Paid to Date', value: currency.format(paid), note: `${Math.round((paid / total) * 100)}% paid`, icon: Check },
          { label: 'Remaining', value: currency.format(total - paid), note: 'Due by launch', icon: CalendarDays },
        ].map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#e8e5df] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8a8a8a]">{label}</span>
              <Icon className="h-4 w-4 text-[#3b82f6]" />
            </div>
            <p className="mt-4 text-2xl font-bold text-[#1a2332]">{value}</p>
            <p className="mt-1 text-xs text-[#059669]">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1a2332]">Payment Timeline</h3>
          <p className="mt-1 text-xs text-[#6b7b8e]">
            Select an invoice to view its milestone detail.
          </p>
          <div className="mt-5 space-y-3">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => {
                  setSelectedId(invoice.id);
                  onActivity(`Opened invoice: ${invoice.label}.`);
                }}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedId === invoice.id
                    ? 'border-[#3b82f6]/30 bg-[#eff6ff]'
                    : 'border-[#e8e5df] bg-[#fafaf8] hover:border-[#3b82f6]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {invoice.status === 'Paid' ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/10">
                        <Check className="h-4 w-4 text-[#10b981]" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e5df]">
                        <CirclePoundSterling className="h-4 w-4 text-[#8a8a8a]" />
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#1a2332]">{invoice.label}</p>
                      <p className="text-xs text-[#8a8a8a]">{invoice.due}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#1a2332]">
                      {currency.format(invoice.amount)}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      invoice.status === 'Paid'
                        ? 'bg-[#10b981]/10 text-[#059669]'
                        : invoice.status === 'Due'
                          ? 'bg-[#f59e0b]/10 text-[#d97706]'
                          : 'bg-[#e8e5df] text-[#8a8a8a]'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
                Invoice Detail
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a2332]">{selected.label}</h3>
              <p className="mt-1 text-xs text-[#8a8a8a]">{selected.due}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              selected.status === 'Paid'
                ? 'bg-[#10b981]/10 text-[#059669]'
                : selected.status === 'Due'
                  ? 'bg-[#f59e0b]/10 text-[#d97706]'
                  : 'bg-[#e8e5df] text-[#8a8a8a]'
            }`}>
              {selected.status}
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold text-[#1a2332]">
            {currency.format(selected.amount)}
          </p>
          <p className="mt-4 text-xs leading-5 text-[#6b7b8e]">{selected.description}</p>

          <div className="mt-5 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              <p className="text-xs font-semibold text-[#1a2332]">Demonstration only</p>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-[#8a8a8a]">
              No payment provider is contacted and no real transaction is created.
            </p>
          </div>

          <button
            type="button"
            onClick={markPaid}
            disabled={selected.status === 'Paid'}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              selected.status === 'Paid'
                ? 'cursor-not-allowed border border-[#e8e5df] bg-[#fafaf8] text-[#8a8a8a]'
                : 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
            }`}
          >
            <Check className="h-4 w-4" />
            {selected.status === 'Paid' ? 'Payment Recorded' : 'Simulate Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}