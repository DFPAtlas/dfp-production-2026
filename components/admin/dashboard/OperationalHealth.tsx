'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import type { HealthItem } from '@/hooks/useDashboardData';

interface OperationalHealthProps {
  items: HealthItem[];
  loading: boolean;
}

const STATUS_CONFIG = {
  operational: { color: '#10B981', label: 'Operational' },
  warning: { color: '#F59E0B', label: 'Warning' },
  critical: { color: '#EF4444', label: 'Critical' },
  unknown: { color: '#64748B', label: 'No Data' },
  not_configured: { color: '#64748B', label: 'Not Configured' },
};

export default function OperationalHealth({ items, loading }: OperationalHealthProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white">Operational Health</h3>
        <Link href="/admin/command-centre" className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
          Command Centre
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const config = STATUS_CONFIG[item.status];
            return (
              <Link
                key={item.label}
                href={item.linkHref}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{item.detail}</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}