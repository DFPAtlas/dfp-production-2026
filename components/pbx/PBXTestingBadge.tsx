'use client';

interface PBXTestingBadgeProps {
  variant?: 'coming-soon' | 'in-testing';
  size?: 'sm' | 'md';
  className?: string;
}

export default function PBXTestingBadge({ variant = 'coming-soon', size = 'sm', className = '' }: PBXTestingBadgeProps) {
  const isComingSoon = variant === 'coming-soon';

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-[11px] gap-1.5'
    : 'px-2 py-0.5 text-[10px] gap-1';

  const colorClasses = isComingSoon
    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]'
    : 'bg-[#3B82F6]/10 border-[#3B82F6]/15 text-[#3B82F6]';

  return (
    <span className={`inline-flex items-center font-medium border rounded-full whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}>
      {isComingSoon ? (
        <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      )}
      {isComingSoon ? 'Coming Soon' : 'In Testing'}
    </span>
  );
}