'use client';

import { RefreshCw, AlertTriangle, ChevronDown, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DateRangePreset } from '@/lib/dashboard-definitions';

interface DashboardHeaderProps {
  dateRangeLabel: string;
  lastRefreshed: string | null;
  partialFailures: string[];
  onRefresh: () => void;
  onDateRangeChange: (preset: DateRangePreset) => void;
  loading: boolean;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'prevMonth', label: 'Previous Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'thisYear', label: 'This Year' },
];

export default function DashboardHeader({
  dateRangeLabel, lastRefreshed, partialFailures, onRefresh, onDateRangeChange, loading,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Business Overview</h1>
        <p className="text-slate-400 text-sm">
          Executive summary of daily operations, finance, and project health.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {partialFailures.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400" title={partialFailures.join(', ')}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Partial data
          </div>
        )}

        {formattedTime && (
          <span className="text-xs text-slate-500">
            Updated {formattedTime}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[#06B6D4]/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-sm text-slate-300 hover:border-[#06B6D4]/30 hover:text-white transition-all cursor-pointer bg-white/5"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            {dateRangeLabel}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-48 bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden z-50">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { onDateRangeChange(p.value); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}