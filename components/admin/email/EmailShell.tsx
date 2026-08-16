'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Mail, LayoutDashboard, FileText, Megaphone, Workflow, Repeat,
  FileEdit, Send, Users, Palette, BarChart3, Settings,
  Menu, X, Search, ChevronDown, ChevronLeft, ChevronRight,
  LogOut, Plus, Command, Bell, Layers, Ban,
  ShieldCheck, Upload, CheckCircle2, UserPlus, MessageSquare,
  BookOpen, Sparkles, Activity, Globe, Languages, BeakerIcon,
  UserCog, Monitor, Shield, Package, ClipboardCheck, PencilRuler, Code2,
} from 'lucide-react';
import NotificationBell from '@/components/admin/NotificationBell';

const emailNavItems = [
  { href: '/admin/email', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/admin/email/experiments', icon: BeakerIcon, label: 'Experiments' },
  { href: '/admin/email/templates', icon: FileText, label: 'Templates' },
  { href: '/admin/email/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/admin/email/automations', icon: Workflow, label: 'Automations' },
  { href: '/admin/email/transactional', icon: Repeat, label: 'Transactional' },
  { href: '/admin/email/drafts', icon: FileEdit, label: 'Drafts' },
  { href: '/admin/email/sent', icon: Send, label: 'Sent' },
  { href: '/admin/email/contacts', icon: UserPlus, label: 'Contacts' },
  { href: '/admin/email/audiences', icon: Users, label: 'Audiences' },
  { href: '/admin/email/imports', icon: Upload, label: 'Imports' },
  { href: '/admin/email/consent', icon: ShieldCheck, label: 'Consent' },
  { href: '/admin/email/preferences', icon: CheckCircle2, label: 'Preferences' },
  { href: '/admin/email/brand-kits', icon: Palette, label: 'Brand Kits' },
  { href: '/admin/email/sections', icon: Layers, label: 'Sections' },
  { href: '/admin/email/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/email/suppressions', icon: Ban, label: 'Suppressions' },
  { href: '/admin/email/reports', icon: FileText, label: 'Reports' },
  { href: '/admin/email/pilot', icon: ShieldCheck, label: 'Pilot Control' },
  { href: '/admin/email/pilot/feedback', icon: MessageSquare, label: 'Feedback' },
  { href: '/admin/email/operations', icon: BookOpen, label: 'Operations' },
  { href: '/admin/email/localisation', icon: Globe, label: 'Localisation' },
  { href: '/admin/email/personalisation', icon: UserCog, label: 'Personalisation' },
  { href: '/admin/email/reputation', icon: Shield, label: 'Reputation' },
  { href: '/admin/email/render-tests', icon: Monitor, label: 'Render Tests' },
  { href: '/admin/email/portability', icon: Package, label: 'Portability' },
  { href: '/admin/email/reviews', icon: ClipboardCheck, label: 'Reviews' },
  { href: '/admin/email/design-system', icon: PencilRuler, label: 'Design System' },
  { href: '/admin/email/developers', icon: Code2, label: 'Developers' },
  { href: '/admin/email/ai/usage', icon: Activity, label: 'AI Usage' },
  { href: '/admin/email/settings', icon: Settings, label: 'Email Settings' },
];

export default function EmailShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; category: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { profile, sessionUser } = useAdminProfile();

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : sessionUser?.email
      ? sessionUser.email.slice(0, 2).toUpperCase()
      : '??';

  const userDisplayName = profile?.full_name || sessionUser?.email || 'Admin User';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-panel')) setProfileOpen(false);
      if (!target.closest('.notification-panel')) setNotificationOpen(false);
      if (!target.closest('.email-search-panel')) setSearchOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('email-studio-collapsed') : null;
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('email-studio-collapsed', String(next));
      return next;
    });
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  };

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('email_templates')
      .select('id, name, subject, category')
      .or(`name.ilike.%${q}%,subject.ilike.%${q}%,category.ilike.%${q}%`)
      .limit(10);
    setSearchResults((data || []) as { id: string; name: string; category: string }[]);
    setSearching(false);
  }, []);

  const getBreadcrumbs = () => {
    if (!pathname) return [];
    const segments = pathname.split('/').filter(Boolean);
    const crumbs: { label: string; href?: string }[] = [];
    let accumulated = '';
    for (let i = 0; i < segments.length; i++) {
      accumulated += `/${segments[i]}`;
      const label = segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href: i < segments.length - 1 ? accumulated : undefined });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
        <Link href="/admin/email" className="flex items-center gap-3 cursor-pointer" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm text-white leading-tight">Email Studio</div>
              <div className="text-[10px] text-slate-500 tracking-wider">Digital Footprint</div>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {emailNavItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : (pathname || '').startsWith(item.href);
          const disabled = false;

          if (disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 cursor-not-allowed group relative"
                title={`${item.label} — Coming later`}
              >
                <item.icon className="w-[16px] h-[16px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[9px] text-slate-700 shrink-0">Soon</span>
                  </>
                )}
              </div>
            );
          }

          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className="w-[16px] h-[16px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="email-sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06B6D4] shrink-0" />
                  )}
                </>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <div key={item.href} className="relative group/tip">
                {link}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-lg text-xs text-white whitespace-nowrap opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all pointer-events-none z-50 shadow-xl">
                  {item.label}
                </div>
              </div>
            );
          }

          return link;
        })}
      </nav>

      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] space-y-1">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
        >
          <LayoutDashboard className="w-[16px] h-[16px] shrink-0" />
          {!collapsed && <span>Admin Panel</span>}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all cursor-pointer w-full"
        >
          {collapsed ? <ChevronRight className="w-[16px] h-[16px] shrink-0" /> : <ChevronLeft className="w-[16px] h-[16px] shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer w-full disabled:opacity-50"
        >
          <LogOut className="w-[16px] h-[16px] shrink-0" />
          {!collapsed && <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex">
      <aside
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-[#0a0a0c] border-r border-[rgba(255,255,255,0.06)] transition-all duration-200 ${
          collapsed ? 'w-[64px]' : 'w-[220px]'
        }`}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0a0a0c] border-r border-[rgba(255,255,255,0.08)] z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <Link href="/admin/email" className="flex items-center gap-3 cursor-pointer" onClick={() => setMobileOpen(false)}>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Email Studio</div>
                    <div className="text-[10px] text-slate-500">Digital Footprint</div>
                  </div>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className={`flex-1 min-h-screen transition-all duration-200 ${
          collapsed ? 'lg:ml-[64px]' : 'lg:ml-[220px]'
        }`}
      >
        <header
          className={`sticky top-0 z-30 transition-all duration-300 ${
            scrolled ? 'bg-[#0a0a0c]/85 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]' : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <nav className="hidden sm:flex items-center gap-1.5 text-xs">
                <Link href="/admin/email" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Email Studio
                </Link>
                {breadcrumbs.slice(2).map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="text-slate-600">/</span>
                    {crumb.href ? (
                      <Link href={crumb.href} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-200 font-medium">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative email-search-panel">
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setSearchOpen(!searchOpen); }}
                  className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer group"
                >
                  <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                  <span className="text-left">Search templates...</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-500 font-mono">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-11 w-80 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden z-50"
                      onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {searching ? (
                          <div className="p-4 text-center">
                            <div className="w-5 h-5 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((r) => (
                            <Link
                              key={r.id}
                              href={`/admin/email/templates`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.03)] last:border-0"
                            >
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">{r.name}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{r.category}</p>
                              </div>
                            </Link>
                          ))
                        ) : searchQuery.length >= 2 ? (
                          <p className="p-4 text-sm text-slate-500 text-center">No templates found</p>
                        ) : (
                          <p className="p-4 text-sm text-slate-500 text-center">Type to search templates</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NotificationBell
                userId={sessionUser?.id || null}
                open={notificationOpen}
                onToggle={() => { setNotificationOpen(!notificationOpen); setProfileOpen(false); }}
              />

              <div className="relative profile-panel">
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setProfileOpen(!profileOpen); setNotificationOpen(false); }}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[#06B6D4]/30 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center text-white text-xs font-bold">
                    {userInitials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 bg-[#1a1a1e] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
                        <p className="font-semibold text-sm text-white">{userDisplayName}</p>
                        <p className="text-xs text-slate-400">Email Studio</p>
                      </div>
                      <div className="p-2">
                        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors cursor-pointer">
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

        <main className="p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
