'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ClipboardCheck,
  Bug,
  WalletCards,
  UserRound,
  HelpCircle,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/uat/dashboard', icon: LayoutDashboard },
  { label: 'Available Jobs', href: '/uat/jobs', icon: Briefcase },
  { label: 'My Applications', href: '/uat/applications', icon: FileText },
  { label: 'My Tests', href: '/uat/my-tests', icon: ClipboardCheck },
  { label: 'My Feedback', href: '/uat/my-feedback', icon: Bug },
  { label: 'Payments', href: '/uat/payments', icon: WalletCards },
  { label: 'Profile', href: '/uat/profile', icon: UserRound },
  { label: 'Help', href: '/account/help', icon: HelpCircle },
];

interface UATPortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export default function UATPortalSidebar({ collapsed, onToggle, onNavigate }: UATPortalSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/uat/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={`hidden lg:flex lg:flex-col border-r border-slate-100 bg-white transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        {!collapsed && (
          <Link href="/uat/dashboard" className="flex items-center gap-2 text-sm font-bold text-[#2878d0] whitespace-nowrap">
            DFP <span className="font-normal text-slate-300">/</span> <span className="font-medium text-[#17325c]">Tester Portal</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#17325c] transition cursor-pointer ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active ? 'bg-[#edf5ff] text-[#2878d0]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#17325c]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-5 border-t border-slate-100">
          <div className="rounded-2xl bg-gradient-to-br from-[#edf5ff] to-[#eef4e9] p-5 text-center">
            <p className="font-serif text-sm font-semibold text-[#17325c]">Real products start with real testers.</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Every test helps build better digital experiences.</p>
          </div>
        </div>
      )}
    </aside>
  );
}