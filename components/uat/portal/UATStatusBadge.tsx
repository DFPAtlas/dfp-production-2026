'use client';

interface UATStatusBadgeProps {
  status: string;
  colorMap: Record<string, string>;
  className?: string;
}

export default function UATStatusBadge({ status, colorMap, className = '' }: UATStatusBadgeProps) {
  const defaultColor = 'bg-slate-100 text-slate-600';
  const color = colorMap[status] || defaultColor;

  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${color} ${className}`}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}