'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';

interface TaskOverviewData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  highPriority: number;
}

interface TaskOverviewCardProps {
  data: TaskOverviewData;
  loading: boolean;
}

export default function TaskOverviewCard({ data, loading }: TaskOverviewCardProps) {
  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  const rows = [
    { label: 'Completed', value: data.completed, color: '#10B981', icon: 'ri-check-double-line' },
    { label: 'In Progress', value: data.inProgress, color: '#06B6D4', icon: 'ri-loader-4-line' },
    { label: 'Pending', value: data.pending, color: '#64748B', icon: 'ri-time-line' },
    { label: 'Overdue', value: data.overdue, color: '#EF4444', icon: 'ri-alert-line' },
    { label: 'High Priority', value: data.highPriority, color: '#F97316', icon: 'ri-flag-line' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Task Overview</h3>
        <Link href="/admin/tasks" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all tasks
        </Link>
      </div>

      {data.total === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No tasks tracked yet.</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Completion rate</span>
              <span className="text-xs font-semibold text-white">{completionRate}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: row.color + '15' }}>
                    <i className={`${row.icon} text-xs`} style={{ color: row.color }} />
                  </div>
                  <span className="text-sm text-slate-300">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Tasks</span>
            <span className="text-lg font-bold text-white">{data.total}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}