'use client';

import { motion } from '@/components/motion';
import { useTasksOverview } from '@/hooks/useTasksData';
import Link from 'next/link';
import { ListTodo, Clock, AlertTriangle, UserX, Zap, Eye, CheckCircle, BarChart3 } from 'lucide-react';

export default function TasksOverview() {
  const { stats, loading } = useTasksOverview();

  const metrics = [
    { key: 'open', label: 'Open Tasks', icon: ListTodo, color: '#06B6D4', filter: '' },
    { key: 'dueToday', label: 'Due Today', icon: Clock, color: '#F59E0B', filter: '?status=all&due=today' },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: '#EF4444', filter: '?status=all&due=overdue' },
    { key: 'blocked', label: 'Blocked', icon: AlertTriangle, color: '#DC2626', filter: '?status=blocked' },
    { key: 'unassigned', label: 'Unassigned', icon: UserX, color: '#94A3B8', filter: '?assigned=unassigned' },
    { key: 'highPriority', label: 'High Priority', icon: Zap, color: '#F97316', filter: '?priority=high' },
    { key: 'awaitingReview', label: 'Awaiting Review', icon: Eye, color: '#8B5CF6', filter: '?status=awaiting_review' },
    { key: 'recentlyCompleted', label: 'Completed (7d)', icon: CheckCircle, color: '#10B981', filter: '?status=complete' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <Link href={`/admin/tasks${m.filter}`} className="block bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#06B6D4]/20 border-t-[#06B6D4] rounded-full animate-spin" />
              ) : null}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{loading ? '—' : (stats[m.key] ?? 0)}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">{m.label}</div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}