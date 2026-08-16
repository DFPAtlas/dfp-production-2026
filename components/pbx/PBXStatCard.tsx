'use client';

import { motion } from '@/components/motion';

interface PBXStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: string;
  onClick?: () => void;
}

export default function PBXStatCard({ title, value, subtitle, icon, trend, color = '#06B6D4', onClick }: PBXStatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 ${onClick ? 'cursor-pointer hover:border-[rgba(255,255,255,0.12)]' : ''} transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.positive ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}