'use client';

import type { LucideIcon } from 'lucide-react';

interface UATStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  note?: string;
  href?: string;
}

export default function UATStatCard({ label, value, icon: Icon, color = '#2878d0', bg = 'bg-sky-100', note, href }: UATStatCardProps) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-left group">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${bg}`} style={{ color }}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-[#17325c]">{value}</p>
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:border-[#2878d0]/20 hover:shadow-md transition-all cursor-pointer">
        {content}
      </a>
    );
  }

  return content;
}