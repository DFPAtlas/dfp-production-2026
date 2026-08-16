'use client';

import { motion } from '@/components/motion';
import { AlertTriangle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { AttentionItem } from '@/hooks/useDashboardData';
import Link from 'next/link';

interface AttentionStripProps {
  items: AttentionItem[];
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  high: { icon: AlertCircle, color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  medium: { icon: AlertCircle, color: '#06B6D4', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' },
};

export default function AttentionStrip({ items }: AttentionStripProps) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#10B981]/5 border border-[#10B981]/10 rounded-2xl p-4 mb-6 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
        </div>
        <p className="text-sm text-slate-400">No urgent issues found from connected sources.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const config = severityConfig[item.severity];
          const Icon = config.icon;
          return (
            <Link
              key={`${item.title}-${i}`}
              href={item.linkHref}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.border} ${config.bg} hover:opacity-90 transition-all cursor-pointer group`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0`} style={{ backgroundColor: config.color + '20' }}>
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: config.color, backgroundColor: config.color + '15' }}>
                    {item.severity}
                  </span>
                  <span className="text-sm font-medium text-white truncate">{item.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.reason}{item.age ? ` — ${item.age}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: config.color }}>
                <span className="hidden sm:inline">{item.linkLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}