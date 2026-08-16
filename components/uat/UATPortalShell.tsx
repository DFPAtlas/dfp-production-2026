'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bug,
  ChevronDown,
  FileCheck2,
  LayoutDashboard,
  MessageCircle,
  MonitorSmartphone,
  UserRound,
  WalletCards,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/uat-testing/portal', icon: LayoutDashboard },
  { label: 'Test Assignments', href: '/uat-testing/portal/assignments', icon: FileCheck2 },
  { label: 'Bug Reports', href: '/uat-testing/portal/reports', icon: Bug },
  { label: 'Payments', href: '/uat-testing/portal/payments', icon: WalletCards },
  { label: 'Messages', href: '/uat-testing/portal/messages', icon: MessageCircle, badge: '2' },
  { label: 'Resources', href: '/uat-testing/portal/resources', icon: BookOpen },
  { label: 'Profile', href: '/uat-testing/portal/profile', icon: UserRound },
];

export default function UATPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#17325c]">
      <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">
        <strong>Portal preview:</strong> all accounts, assignments, reports, messages and balances on these screens are sample data.
      </div>

      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur lg:px-8">
        <div className="flex items-center gap-5">
          <Link href="/uat-testing" className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#2878d0]">
            <ArrowLeft className="h-4 w-4" /> UAT Network
          </Link>
          <Link href="/" className="hidden items-center gap-2 text-xl font-bold text-[#2878d0] sm:flex">
            DFP <span className="font-normal text-slate-300">/</span> <span className="text-sm font-medium text-[#17325c]">Digital Footprint</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/uat-testing/portal/messages" aria-label="Preview notifications" className="relative rounded-full p-2 text-[#17325c] hover:bg-slate-100">
            <Bell className="h-5 w-5" /><span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#2878d0] text-[10px] font-bold text-white">2</span>
          </Link>
          <Link href="/uat-testing/portal/profile" className="flex items-center gap-3 rounded-full bg-white py-1 pl-1 pr-3 hover:bg-slate-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0e1] font-bold text-[#617a50]">ST</span>
            <span className="hidden text-left sm:block"><span className="block text-sm font-semibold">Sample Tester</span><span className="block text-xs text-[#6f8d5c]">Preview account</span></span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-100 bg-white p-5 lg:flex lg:flex-col">
          <nav className="space-y-2">
            {navigation.map(({ label, href, icon: Icon, badge }) => {
              const active = href === '/uat-testing/portal' ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active ? 'bg-[#edf5ff] text-[#2878d0]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#17325c]'}`}>
                  <Icon className="h-5 w-5" /><span className="flex-1">{label}</span>{badge && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2878d0] text-[10px] text-white">{badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-8">
            <div className="rounded-2xl bg-gradient-to-br from-[#edf5ff] to-[#eef4e9] p-5 text-center">
              <MonitorSmartphone className="mx-auto h-12 w-12 text-[#2878d0]" />
              <p className="mt-3 font-serif text-xl font-semibold">Better products start with real people.</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">This complete demo can be connected to live services later.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-7 lg:p-9">
          <div className="mx-auto max-w-[1500px]">
            <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {navigation.map(({ label, href, icon: Icon }) => {
                const active = href === '/uat-testing/portal' ? pathname === href : pathname.startsWith(href);
                return <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${active ? 'bg-[#2878d0] text-white' : 'bg-white text-slate-600'}`}><Icon className="h-4 w-4" />{label}</Link>;
              })}
            </nav>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
