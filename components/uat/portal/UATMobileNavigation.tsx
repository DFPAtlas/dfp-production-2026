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
  X,
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

interface UATMobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UATMobileNavigation({ isOpen, onClose }: UATMobileNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/uat/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <Link href="/uat/dashboard" onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-[#2878d0] whitespace-nowrap">
            DFP <span className="font-normal text-slate-300">/</span> <span className="font-medium text-[#17325c]">Tester Portal</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#17325c] transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active ? 'bg-[#edf5ff] text-[#2878d0]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#17325c]'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-5 border-t border-slate-100">
          <div className="rounded-2xl bg-gradient-to-br from-[#edf5ff] to-[#eef4e9] p-5 text-center">
            <p className="font-serif text-sm font-semibold text-[#17325c]">Real products start with real testers.</p>
          </div>
        </div>
      </div>
    </>
  );
}