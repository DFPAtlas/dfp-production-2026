'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { ActivityItem } from '@/hooks/useDashboardData';

interface RecentActivityProps {
  items: ActivityItem[];
  loading: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  lead_created: 'ri-user-add-line',
  client_created: 'ri-building-line',
  project_updated: 'ri-edit-line',
  task_completed: 'ri-check-line',
  milestone_completed: 'ri-flag-line',
  invoice_issued: 'ri-bill-line',
  payment_recorded: 'ri-money-pound-circle-line',
  feedback_submitted: 'ri-bug-line',
  alert_created: 'ri-alert-line',
  deployment_completed: 'ri-rocket-line',
};

const TYPE_COLORS: Record<string, string> = {
  lead_created: '#8B5CF6',
  client_created: '#06B6D4',
  project_updated: '#F59E0B',
  task_completed: '#10B981',
  milestone_completed: '#06B6D4',
  invoice_issued: '#F97316',
  payment_recorded: '#10B981',
  feedback_submitted: '#EF4444',
  alert_created: '#EF4444',
  deployment_completed: '#8B5CF6',
};

export default function RecentActivity({ items, loading }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <h3 className="text-base font-bold text-white mb-5">Recent Activity</h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item, i) => {
            const icon = TYPE_ICONS[item.type] || 'ri-record-circle-line';
            const color = TYPE_COLORS[item.type] || '#64748B';
            return (
              <Link
                key={i}
                href={item.linkHref}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                  <i className={`${icon} text-sm`} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.actor && `${item.actor} · `}{item.module}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {item.time ? formatRelativeTime(item.time) : ''}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-6">No recent activity. Activity tracking will appear here as your team works.</p>
      )}
    </motion.div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB');
}