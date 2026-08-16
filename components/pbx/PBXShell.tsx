'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import {
  LayoutDashboard,
  Phone,
  Users,
  GitBranch,
  Clock,
  Bot,
  PhoneCall,
  Voicemail,
  MessageSquare,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Building2,
  LogOut,
  Megaphone,
  Home,
} from 'lucide-react';
import PBXTestingBadge from '@/components/pbx/PBXTestingBadge';
import PBXEarlyAccessModal from '@/components/pbx/PBXEarlyAccessModal';

const navItems = [
  { href: '/pbx/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pbx/numbers', icon: Phone, label: 'Numbers' },
  { href: '/pbx/users', icon: Users, label: 'Users & Extensions' },
  { href: '/pbx/call-routing', icon: GitBranch, label: 'Call Routing' },
  { href: '/pbx/opening-hours', icon: Clock, label: 'Opening Hours' },
  { href: '/pbx/ai-receptionist', icon: Bot, label: 'AI Receptionist' },
  { href: '/pbx/call-logs', icon: PhoneCall, label: 'Call Logs' },
  { href: '/pbx/voicemail', icon: Voicemail, label: 'Voicemail' },
  { href: '/pbx/sms', icon: MessageSquare, label: 'SMS' },
  { href: '/pbx/billing', icon: CreditCard, label: 'Billing' },
  { href: '/pbx/settings', icon: Settings, label: 'Settings' },
];

export default function PBXShell({ children, hideComingSoonBar }: { children: React.ReactNode; hideComingSoonBar?: boolean }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-panel')) setNotificationOpen(false);
      if (!target.closest('.profile-panel')) setProfileOpen(false);
      if (!target.closest('.tenant-panel')) setTenantOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    supabase.from('pbx_tenants').select('id, name').eq('commercial_status', 'active').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setTenants(data);
        setSelectedTenant(data[0]);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-[#0F172A] border-r border-[rgba(255,255,255,0.06)]">
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
          <Link href="/pbx/dashboard" className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs text-white leading-tight">Cloud PBX</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Digital-Footprint</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
          >
            <Home className="w-[18px] h-[18px]" />
            <span>Back to Home</span>
          </Link>
          <div className="h-px bg-[rgba(255,255,255,0.06)] my-1" />
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div layoutId="pbx-sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
          <Link href="/admin/pbx" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-[#06B6D4] hover:bg-white/[0.03] transition-all cursor-pointer">
            <Shield className="w-[18px] h-[18px]" />
            <span>Super Admin</span>
          </Link>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F172A] border-r border-[rgba(255,255,255,0.06)] z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <Link href="/pbx/dashboard" className="flex items-center gap-3 cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white leading-tight">Cloud PBX</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Digital-Footprint</div>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
                >
                  <Home className="w-[18px] h-[18px]" />
                  <span>Back to Home</span>
                </Link>
                <div className="h-px bg-[rgba(255,255,255,0.06)] my-1" />
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${isActive ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'}`}
                    >
                      <item.icon className="w-[18px] h-[18px]" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 min-h-screen">
        <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] shadow-sm' : 'bg-transparent'}`}>
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative tenant-panel">
                <button onClick={(e) => { e.stopPropagation(); setTenantOpen(!tenantOpen); }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[#06B6D4]/30 transition-all cursor-pointer text-sm"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">{selectedTenant?.name || 'No Tenant'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
                <AnimatePresence>
                  {tenantOpen && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.12 }}
                      className="absolute left-0 top-10 w-56 bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden"
                    >
                      <div className="p-1.5">
                        {tenants.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-slate-500">No active tenants</p>
                        ) : (
                          tenants.map((t) => (
                            <button key={t.id} onClick={() => { setSelectedTenant(t); setTenantOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                {t.name}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PBXTestingBadge variant="coming-soon" className="hidden md:inline-flex" />
              <PBXTestingBadge variant="in-testing" className="hidden sm:inline-flex" />
              <button
                onClick={() => setEarlyAccessOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F59E0B] border border-[#F59E0B]/25 hover:bg-[#F59E0B]/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                Request Early Access
              </button>

              <button onClick={() => {}} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-all cursor-pointer">
                <Search className="w-4 h-4" />
              </button>

              <div className="relative notification-panel">
                <button onClick={(e) => { e.stopPropagation(); setNotificationOpen(!notificationOpen); setProfileOpen(false); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
                </button>
                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 bg-[#1E293B] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">Notifications</span>
                        <span className="text-xs text-[#06B6D4] cursor-pointer hover:underline">Mark all read</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {[
                          { title: '3 missed calls', desc: 'From +44 20 7946 0958', time: '5 min ago', color: '#EF4444' },
                          { title: 'New voicemail', desc: 'From Sarah Johnson — 0:45', time: '22 min ago', color: '#F59E0B' },
                          { title: 'AI summary ready', desc: 'Call with TechCorp — 12 min', time: '1 hour ago', color: '#06B6D4' },
                        ].map((n, i) => (
                          <div key={i} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0">
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{n.title}</p>
                              <p className="text-xs text-slate-400 truncate">{n.desc}</p>
                              <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative profile-panel">
                <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); setNotificationOpen(false); }}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[#06B6D4]/30 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center text-white text-xs font-bold">JD</div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-52 bg-[#1E293B] rounded-xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
                        <p className="font-semibold text-sm text-white">John Doe</p>
                        <p className="text-xs text-slate-400">Admin - Acme Corp</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/pbx/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {!hideComingSoonBar && (
            <div className="mb-4 lg:mb-5 px-4 py-2.5 bg-[#06B6D4]/[0.04] border border-[#06B6D4]/10 rounded-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Megaphone className="w-4 h-4 text-[#06B6D4] shrink-0" />
                <p className="text-xs text-slate-400 truncate">
                  <span className="text-[#06B6D4] font-medium">Live Infrastructure</span> — Database tables are active. Provider connection (Twilio) requires API key configuration in Supabase Edge Function secrets.
                </p>
              </div>
              <button
                onClick={() => setEarlyAccessOpen(true)}
                className="text-xs font-medium text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Request Access
              </button>
            </div>
          )}
          {children}
        </div>
      </div>

      <PBXEarlyAccessModal open={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}