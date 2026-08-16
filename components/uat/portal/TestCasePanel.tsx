'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUATTester } from '@/components/uat/UATTesterProvider';

interface TestCaseItem {
  id: string;
  test_case_id: string;
  reference: string;
  title: string;
  priority: string;
  status: string;
}

interface TestCasePanelProps {
  cases: TestCaseItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-slate-50 text-slate-400 ring-slate-200',
  in_progress: 'bg-sky-50 text-sky-600 ring-sky-200',
  passed: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  failed: 'bg-red-50 text-red-600 ring-red-200',
  blocked: 'bg-amber-50 text-amber-600 ring-amber-200',
  skipped: 'bg-slate-100 text-slate-500 ring-slate-300',
  needs_retest: 'bg-violet-50 text-violet-600 ring-violet-200',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  passed: 'Passed',
  failed: 'Failed',
  blocked: 'Blocked',
  skipped: 'Skipped',
  needs_retest: 'Needs Retest',
};

const priorityColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-slate-500 bg-slate-100',
};

const filters = ['All', 'Not Started', 'In Progress', 'Passed', 'Failed', 'Blocked', 'Skipped'] as const;
type FilterKey = typeof filters[number];

export default function TestCasePanel({ cases, selectedId, onSelect }: TestCasePanelProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [completedCount, setCompletedCount] = useState(0);
  const [notStartedCount, setNotStartedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCompletedCount(cases.filter((c) => ['passed', 'failed', 'blocked', 'skipped'].includes(c.status)).length);
    setNotStartedCount(cases.filter((c) => c.status === 'not_started').length);
    setFailedCount(cases.filter((c) => c.status === 'failed').length);
  }, [cases]);

  const filtered = cases.filter((c) => {
    if (filter === 'All') return true;
    const key = filter.toLowerCase().replace(' ', '_');
    return c.status === key;
  });

  const countMap: Record<FilterKey, number> = {
    'All': cases.length,
    'Not Started': notStartedCount,
    'In Progress': cases.filter((c) => c.status === 'in_progress').length,
    'Passed': cases.filter((c) => c.status === 'passed').length,
    'Failed': failedCount,
    'Blocked': cases.filter((c) => c.status === 'blocked').length,
    'Skipped': cases.filter((c) => c.status === 'skipped').length,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#17325c]">Test Cases</h3>
          <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}>
            <i className="ri-filter-3-line text-slate-500 w-4 h-4 flex items-center justify-center" />
          </button>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:flex-wrap">
          {filters.map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filter === f
                  ? 'bg-[#2878d0] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f} <span className="opacity-70 ml-0.5">{countMap[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No test cases match this filter.</div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((tc) => (
              <button
                key={tc.id}
                onClick={() => { onSelect(tc.id); setMobileOpen(false); }}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                  selectedId === tc.id
                    ? 'border-[#2878d0]/30 bg-[#edf5ff] shadow-sm'
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ring-1 ${statusColors[tc.status] || 'bg-slate-50 text-slate-400 ring-slate-200'}`}>
                    {statusLabels[tc.status] || tc.status}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${priorityColors[tc.priority] || 'text-slate-500 bg-slate-100'}`}>
                    {tc.priority}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5 leading-tight">{tc.reference}: {tc.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 shrink-0 flex items-center justify-between text-xs text-slate-400">
        <span>{completedCount} of {cases.length} completed</span>
        <span>{cases.length - completedCount} remaining</span>
      </div>
    </div>
  );
}