'use client';

interface PBXUsageMeterProps {
  label: string;
  used: number;
  total: number;
  unit?: string;
  color?: string;
  warningThreshold?: number;
}

export default function PBXUsageMeter({ label, used, total, unit = '', color = '#06B6D4', warningThreshold = 80 }: PBXUsageMeterProps) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isWarning = percentage >= warningThreshold;
  const barColor = isWarning ? '#F97316' : percentage >= 95 ? '#EF4444' : color;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-medium text-white">
          {used}{unit} <span className="text-slate-500">/ {total}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}