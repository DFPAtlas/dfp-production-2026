'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusSegment {
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusPieProps {
  active: number;
  atRisk: number;
  completed: number;
  total: number;
  loading: boolean;
}

const COLORS = {
  active: '#06B6D4',
  atRisk: '#EF4444',
  completed: '#10B981',
};

export default function ProjectStatusPie({ active, atRisk, completed, total, loading }: ProjectStatusPieProps) {
  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-5" />
        <div className="h-[200px] bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  const segments: StatusSegment[] = [
    { name: 'Active', value: active, color: COLORS.active },
    { name: 'At Risk', value: atRisk, color: COLORS.atRisk },
    { name: 'Completed', value: completed, color: COLORS.completed },
  ].filter((s) => s.value > 0);

  const otherStatuses = total - active - atRisk - completed;

  if (otherStatuses > 0 && total > 0) {
    segments.push({ name: 'Other', value: otherStatuses, color: '#64748B' });
  }

  if (total === 0 && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
      >
        <h3 className="text-base font-bold text-white mb-5">Project Status</h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-slate-500">No projects yet.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Project Status</h3>
        <Link href="/admin/projects" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {segments.map((segment, i) => (
                  <Cell key={i} fill={segment.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#E2E8F0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {segments.map((segment) => (
            <div key={segment.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
                <span className="text-sm text-slate-300">{segment.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">{segment.value}</span>
            </div>
          ))}

          <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Projects</span>
            <span className="text-sm font-bold text-white">{total}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}