'use client';

import { useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  CirclePoundSterling,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface CashBar {
  month: string;
  income: number;
  cost: number;
}

interface Milestone {
  date: string;
  label: string;
  amount: string;
}

interface FinanceViewProps {
  onActivity: (message: string) => void;
  cashBars: CashBar[];
  milestones: Milestone[];
}

const financeCards = [
  { label: 'Revenue this month', value: '£84,200', change: '+12.4%', icon: TrendingUp },
  { label: 'Outstanding', value: '£21,650', change: '4 invoices', icon: FileText },
  { label: 'Committed value', value: '£146,900', change: 'Next 90 days', icon: BriefcaseBusiness },
];

export default function FinanceView({
  onActivity,
  cashBars,
  milestones,
}: FinanceViewProps) {
  const [invoiceOpened, setInvoiceOpened] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Financial Position</h2>
        <p className="mt-1 text-sm text-slate-400">Revenue, outstanding, committed and upcoming</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {financeCards.map(({ label, value, change, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onActivity(`Inspected ${label.toLowerCase()}`)}
            className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4 text-left transition hover:border-cyan-500/15"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{label}</span>
              <Icon className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-[11px] text-emerald-400">{change}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly cash movement</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Simulated income against delivery costs</p>
            </div>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>

          <div className="flex h-44 items-end gap-2">
            {cashBars.map((bar) => (
              <button
                key={bar.month}
                type="button"
                onClick={() => onActivity(`Reviewed ${bar.month} cash movement`)}
                onMouseEnter={() => setHoveredBar(bar.month)}
                onMouseLeave={() => setHoveredBar(null)}
                className="group flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex h-36 w-full items-end justify-center gap-1 rounded-lg bg-white/[0.03] px-2 pb-2">
                  <span
                    className={`w-2.5 rounded-t transition-all ${hoveredBar === bar.month ? 'bg-cyan-400' : 'bg-cyan-500/70'}`}
                    style={{ height: `${bar.income * 1.2}%` }}
                  />
                  <span
                    className={`w-2.5 rounded-t transition-all ${hoveredBar === bar.month ? 'bg-slate-500' : 'bg-slate-600/70'}`}
                    style={{ height: `${bar.cost * 1.2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-600">{bar.month}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              Delivery costs
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setInvoiceOpened(!invoiceOpened);
              onActivity('Opened outstanding invoice summary');
            }}
            className={`w-full rounded-xl border p-4 text-left transition ${invoiceOpened ? 'border-cyan-500/20 bg-cyan-500/[0.06]' : 'border-white/[0.06] bg-[#0d111c] hover:border-cyan-500/15'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500">Outstanding invoice</p>
                <p className="mt-2 text-2xl font-semibold text-white">£6,800</p>
                <p className="mt-1 text-[11px] text-slate-500">Aster & Co. · Due 14 Aug 2026</p>
              </div>
              <CirclePoundSterling className="h-5 w-5 text-cyan-400" />
            </div>

            {invoiceOpened && (
              <div className="mt-4 rounded-lg border border-cyan-500/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Milestone 3</p>
                <p className="mt-1 text-xs text-slate-300">Approved UX and client portal build commencement</p>
                <p className="mt-2 text-[11px] text-cyan-400">£6,800 due within 7 days</p>
              </div>
            )}
          </button>

          <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
            <h3 className="text-sm font-semibold text-white">Next 30 days</h3>
            <div className="mt-3 space-y-2">
              {milestones.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onActivity(`Reviewed milestone: ${item.label}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-white/10"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-300">{item.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{item.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-white">{item.amount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}