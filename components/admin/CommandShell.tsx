'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, FolderKanban, Heart, Activity, DollarSign,
  LifeBuoy, Bell, ListTodo, Rocket, Database, Shield,
  FileText, LogOut, Menu, X, ChevronDown, Search,
  Cpu
} from 'lucide-react';

const navItems = [
  { href: '/admin/command-centre', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/command-centre/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/admin/command-centre/health', icon: Heart, label: 'Health' },
  { href: '/admin/command-centre/n8n', icon: Cpu, label: 'n8n Agents' },
  { href: '/admin/command-centre/finance', icon: DollarSign, label: 'Finance' },
  { href: '/admin/command-centre/support', icon: LifeBuoy, label: 'Support' },
  { href: '/admin/command-centre/alerts', icon: Bell, label: 'Alerts' },
  { href: '/admin/command-centre/tasks', icon: ListTodo, label: 'Tasks' },
  { href: '/admin/command-centre/deployments', icon: Rocket, label: 'Deployments' },
  { href: '/admin/command-centre/backups', icon: Database, label: 'Backups' },
  { href: '/admin/command-centre/readiness', icon: Shield, label: 'Readiness' },
  { href: '/admin/command-centre/reports', icon: FileText, label: 'Reports' },
];

export default function CommandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-[#0D1525] border-r border-[rgba(255,255,255,0.06)]">
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
          <Link href="/admin/command-centre" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs text-white leading-tight">Command</div>
              <div className="font-bold text-xs text-[#06B6D4] leading-tight">Centre</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <item.icon className="w-[17px] h-[17px]" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div layoutId="cmd-active" className="ml-auto w-1 h-4 rounded-full bg-[#06B6D4]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
          >
            <LayoutDashboard className="w-[17px] h-[17px]" />
            <span>Admin Panel</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer w-full disabled:opacity-50"
          >
            <LogOut className="w-[17px] h-[17px]" />
            <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D1525] border-r border-[rgba(255,255,255,0.06)] z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <Link href="/admin/command-centre" className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white leading-tight">Command</div>
                    <div className="font-bold text-xs text-[#06B6D4] leading-tight">Centre</div>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'}`}
                    >
                      <item.icon className="w-[17px] h-[17px]" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer w-full disabled:opacity-50">
                  <LogOut className="w-[17px] h-[17px]" /><span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 min-h-screen">
        <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/85 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]' : 'bg-transparent'}`}>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Super Admin</span>
                <span className="w-1 h-1 rounded-full bg-[#06B6D4]" />
                <span className="text-xs text-slate-400">Command Centre</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}