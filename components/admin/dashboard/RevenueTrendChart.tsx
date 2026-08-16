'use client';

import { motion } from '@/components/motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueTrend {
  date: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrend[];
  loading: boolean;
}

export default function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="h-4 w-36 bg-white/5 rounded animate-pulse mb-5" />
        <div className="h-[200px] bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  const hasData = data.length > 0;
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Revenue Trend</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Daily paid revenue over selected period</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#10B981]">£{totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Total in period</div>
        </div>
      </div>

      {hasData ? (
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                dx={-8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#E2E8F0',
                }}
                formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-slate-500">No revenue data for this period.</p>
        </div>
      )}
    </motion.div>
  );
}