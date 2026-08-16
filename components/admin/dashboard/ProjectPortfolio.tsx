'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { ProjectPortfolio } from '@/hooks/useDashboardData';

interface ProjectPortfolioProps {
  data: ProjectPortfolio;
  loading: boolean;
}

export default function ProjectPortfolio({ data, loading }: ProjectPortfolioProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Project Portfolio</h3>
        <Link href="/admin/projects" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          View all projects
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#06B6D4]">{data.active}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#EF4444]">{data.atRisk}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">At Risk</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#10B981]">{data.completed}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="text-slate-400">{data.overdueMilestones} overdue milestones</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
              <span className="text-slate-400">{data.upcomingMilestones} due in 7 days</span>
            </div>
          </div>

          {data.recentlyUpdated.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recently Updated</p>
              <div className="space-y-1.5">
                {data.recentlyUpdated.map((p) => (
                  <Link
                    key={p.id}
                    href="/admin/projects"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-slate-300 truncate">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2 ${
                      p.status === 'active' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                      p.status === 'at_risk' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {data.total === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No projects yet.</p>
          )}
        </>
      )}
    </motion.div>
  );
}