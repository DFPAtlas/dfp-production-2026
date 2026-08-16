'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { motion, AnimatePresence } from '@/components/motion';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, Users, FolderKanban, Target, FileText,
  LogOut, Menu, X, Bell, Search, ChevronDown, ChevronRight,
  Shield, ClipboardCheck, Server, Briefcase, Bug, DollarSign,
  Star, Award, TrendingUp, Phone, Building2, Workflow, Bot,
  Activity, Database, UserCircle, Sparkles, ChevronUp, Mail, Image,
  Stethoscope, Command, ListTodo, Palette, BarChart3, Headphones,
} from 'lucide-react';
import CommandPaletteWrapper from './CommandPaletteWrapper';
import SessionExpiryBanner from './SessionExpiryBanner';

const navGroups = [
  {
    role: 'Administrator',
    label: 'Administration',
    items: [
      { href: '/admin/staff', icon: Shield, label: 'Staff Administration' },
    ],
  },
  {
    label: 'Main',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/search', icon: Search, label: 'Search' },
      { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { href: '/admin/activity', icon: Activity, label: 'Activity' },
      { href: '/admin/audit-log', icon: Shield, label: 'Audit Log' },
      { href: '/admin/command-centre', icon: Shield, label: 'Command Centre' },
      { href: '/admin/cms', icon: Palette, label: 'CMS' },
      { href: '/admin/about-content', icon: FileText, label: 'About Content' },
      { href: '/admin/diagnostics', icon: Stethoscope, label: 'Diagnostics' },
      { href: '/admin/analytics/public', icon: BarChart3, label: 'Public Analytics' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/admin/leads', icon: UserCircle, label: 'Leads' },
      { href: '/admin/leads/pipeline', icon: TrendingUp, label: 'Pipeline' },
      { href: '/admin/clients', icon: Users, label: 'Clients' },
    ],
  },
  {
    label: 'Projects & Finance',
    items: [
      { href: '/admin/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/admin/milestones', icon: Target, label: 'Milestones' },
      { href: '/admin/tasks', icon: ListTodo, label: 'Tasks' },
      { href: '/admin/invoices', icon: FileText, label: 'Invoices' },
      { href: '/admin/automation', icon: Workflow, label: 'Automation' },
    ],
  },
  {
    label: 'Submissions',
    items: [
      { href: '/admin/submissions', icon: Sparkles, label: 'Submissions' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/admin/email', icon: Mail, label: 'Email Studio' },
      { href: '/admin/email/templates', icon: FileText, label: 'Email Templates' },
      { href: '/admin/email-templates/images', icon: Image, label: 'Email Images' },
      { href: '/admin/support', icon: Headphones, label: 'Support Queue' },
    ],
  },
  {
    label: 'UAT Testing',
    defaultOpen: false,
    items: [
      { href: '/admin/uat', icon: Bug, label: 'UAT Control Room' },
      { href: '/admin/uat/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/admin/uat/jobs', icon: Briefcase, label: 'Jobs' },
      { href: '/admin/uat/applications', icon: FileText, label: 'Job Applications' },
      { href: '/admin/uat/tester-applications', icon: Users, label: 'Tester Applications' },
      { href: '/admin/uat/assignments', icon: ClipboardCheck, label: 'Assignments' },
      { href: '/admin/uat/feedback', icon: Bug, label: 'Feedback & Triage' },
      { href: '/admin/uat/environments', icon: Server, label: 'Environments' },
      { href: '/admin/uat/testers', icon: ClipboardCheck, label: 'Testers' },
      { href: '/admin/uat/payments', icon: DollarSign, label: 'Payments' },
      { href: '/admin/uat/reports', icon: TrendingUp, label: 'Reports' },
    ],
  },
  {
    label: 'PBX System',
    defaultOpen: false,
    items: [
      { href: '/admin/pbx', icon: Phone, label: 'Overview' },
      { href: '/admin/pbx/tenants', icon: Building2, label: 'Tenants' },
      { href: '/admin/pbx/numbers', icon: Phone, label: 'Numbers' },
      { href: '/admin/pbx/calls', icon: TrendingUp, label: 'Calls' },
      { href: '/admin/pbx/twilio', icon: Activity, label: 'Twilio' },
      { href: '/admin/pbx/n8n', icon: Workflow, label: 'n8n' },
      { href: '/admin/pbx/ai-tokens', icon: Bot, label: 'AI Tokens' },
      { href: '/admin/pbx/billing', icon: DollarSign, label: 'Billing' },
      { href: '/admin/pbx/system-status', icon: Server, label: 'System' },
    ],
  },
];

function isGroupActive(items: { href: string }[], pathname: string) {
  return items.some((item) => {
    if (pathname === item.href) return true;
    if (item.href !== '/admin' && pathname.startsWith(item.href + '/')) return true;
    return false;
  });
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { profile, sessionUser, loading: profileLoading } = useAdminProfile();
  const [loggingOut, setLoggingOut] = useState(false);

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : sessionUser?.email
      ? sessionUser.email.slice(0, 2).toUpperCase()
      : '??';

  const userDisplayName = profile?.full_name || sessionUser?.email || 'Admin User';
  const userRole = profile?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      navGroups.forEach((g) => {
        if (g.defaultOpen !== undefined && prev[g.label] === undefined) {
          next[g.label] = g.defaultOpen;
        }
        if (isGroupActive(g.items, pathname || '')) {
          next[g.label] = true;
        }
      });
      return next;
    });
  }, [pathname]);

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
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItems = (items: { href: string; icon: React.ElementType; label: string }[]) => {
    return items.map((item) => {
      const isActive = pathname === item.href || (item.href !== '/admin' && (pathname || '').startsWith(item.href + '/'));
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <item.icon className="w-[16px] h-[16px] shrink-0" />
          <span className="truncate">{item.label}</span>
          {isActive && (
            <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06B6D4] shrink-0" />
          )}
        </Link>
      );
    });
  };

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
        <Link href="/admin" className="flex items-center gap-3 cursor-pointer" onClick={() => setSidebarOpen(false)}>
          <img
            src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
            alt="Logo"
            width={34}
            height={34}
            className="object-contain rounded-lg"
          />
          <div>
            <div className="font-bold text-sm text-white">Digital-Footprint</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Admin Panel</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center gap-2 px-3 py-1.5 w-full text-left cursor-pointer group"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{group.label}</span>
              {group.items.length > 3 && (
                <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                  {expandedGroups[group.label] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              )}
            </button>
            <div className="space-y-0.5">
              {expandedGroups[group.label] !== false && renderNavItems(group.items)}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-all duration-200 cursor-pointer"
          >
            <Database className="w-[16px] h-[16px] shrink-0" />
            <span className="truncate">Supabase</span>
            <span className="ml-auto text-[10px] text-slate-600 shrink-0">Ext</span>
          </a>
        </div>
      </nav>

      <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer w-full disabled:opacity-50"
        >
          <LogOut className="w-[16px] h-[16px] shrink-0" />
          <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-[#0F172A] border-r border-[rgba(255,255,255,0.08)]">
        {sidebarContent}
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
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F172A] border-r border-[rgba(255,255,255,0.08)] z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-3 cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <img src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp" alt="Logo" width={34} height={34} className="object-contain rounded-lg" />
                  <div>
                    <div className="font-bold text-sm text-white">Digital-Footprint</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Admin</div>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 min-h-screen">
        <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)]' : 'bg-transparent'}`}>
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="hidden md:flex items-center gap-2 pl-3 pr-2 py-2 w-64 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer group"
                aria-label="Open search (Cmd+K)"
              >
                <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                <span className="flex-1 text-left">Search anything...</span>
                <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-[rgba(255,255,255,0.08)] text-[10px] text-slate-500 font-mono">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell
                userId={sessionUser?.id || null}
                open={notificationOpen}
                onToggle={() => { setNotificationOpen(!notificationOpen); setProfileOpen(false); }}
              />
              <div className="relative profile-panel">
                <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); setNotificationOpen(false); }}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[#06B6D4]/30 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center text-white text-xs font-bold">{userInitials}</div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 bg-[#1E293B] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                        <p className="font-semibold text-sm text-white">{userDisplayName}</p>
                        <p className="text-xs text-slate-400">{userRole}</p>
                      </div>
                      <div className="p-2">
                        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                          View Website
                        </Link>
                        <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer w-full disabled:opacity-50">
                          <LogOut className="w-4 h-4" /> {loggingOut ? 'Signing out...' : 'Logout'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <SessionExpiryBanner loginPath="/admin/login" portalName="admin portal" />

        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>

      <CommandPaletteWrapper />
    </div>
  );
}