'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UATPortalBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function UATPortalBreadcrumbs({ items }: UATPortalBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link href="/uat/dashboard" className="text-slate-400 hover:text-[#2878d0] transition font-medium whitespace-nowrap">
        Dashboard
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-slate-300">/</span>
          {item.href ? (
            <Link href={item.href} className="text-slate-400 hover:text-[#2878d0] transition font-medium whitespace-nowrap">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[#17325c]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}