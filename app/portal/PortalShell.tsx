'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from '@/components/motion';
import { NotificationDropdown } from '@/components/portal/NotificationDropdown';
import SessionExpiryBanner from '@/components/admin/SessionExpiryBanner';
import {
  ChevronDown,
  FileText,
  Fingerprint,
  FolderKanban,
  FolderOpen,
  Globe,
  Headphones,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Monitor,
  Settings,
  User,
  X,
  CheckCircle,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface PortalShellProps {
  children: React.ReactNode;
}

export default function PortalShell({ children }: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchCounts = useCallback(async (uid: string, cid: string) => {
    const { data: threadsData } = await supabase
      .from('message_threads')
      .select('id')
      .eq('client_id', cid)
      .eq('client_visible', true);

    const threadIds = (threadsData || []).map(t => t.id);
    let msgCount = 0;

    if (threadIds.length > 0) {
      const { data: allMsgs } = await supabase
        .from('project_messages')
        .select('id')
        .in('thread_id', threadIds)
        .eq('is_internal', false);

      if (allMsgs && allMsgs.length > 0) {
        const msgIds = allMsgs.map(m => m.id);
        const { data: readData } = await supabase
          .from('message_read_receipts')
          .select('message_id')
          .eq('user_id', uid)
          .in('message_id', msgIds);

        const readSet = new Set((readData || []).map(r => r.message_id));
        msgCount = allMsgs.filter(m => !readSet.has(m.id)).length;
      }
    }
    setUnreadCount(msgCount);

    const { data: projData } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', cid);
    const projectIds = (projData || []).map(p => p.id);

    if (projectIds.length > 0) {
      const { count: approvalCount } = await supabase
        .from('client_approvals')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .in('status', ['awaiting_client', 'viewed', 'resubmitted']);
      setPendingApprovals(approvalCount ?? 0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        setTimeout(() => { if (!cancelled) router.replace('/portal/login'); }, 0);
        return;
      }

      const name =
        session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] ||
        'Client';

      setUserEmail(session.user.email ?? null);
      setUserName(name);
      setLoading(false);

      supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle().then(({ data }) => {
        if (data?.id && !cancelled) {
          fetchCounts(session.user.id, data.id);
        }
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT' || !session) {
        setTimeout(() => { if (!cancelled) router.replace('/portal/login'); }, 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, fetchCounts]);

  useEffect(() => {
    let cancelled = false;
    const initRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!clientData?.id) return;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`portal-shell:${session.user.id}:${Date.now()}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
        }, () => {
          if (!cancelled) fetchCounts(session.user.id, clientData.id);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_read_receipts',
        }, () => {
          if (!cancelled) fetchCounts(session.user.id, clientData.id);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_approvals',
        }, () => {
          if (!cancelled) fetchCounts(session.user.id, clientData.id);
        })
        .subscribe();

      channelRef.current = channel;
    };

    initRealtime();
    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchCounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/portal/login'), 0);
  };

  const navItems = [
    { href: '/portal/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/portal/projects', label: 'Projects', icon: FolderKanban },
    { href: '/portal/approvals', label: 'Approvals', icon: CheckCircle, badge: pendingApprovals },
    { href: '/portal/websites', label: 'My Websites', icon: Monitor },
    { href: '/portal/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
    { href: '/portal/files', label: 'Content & Assets', icon: FolderOpen },
    { href: '/portal/support', label: 'Support', icon: LifeBuoy },
    { href: '/portal/invoices', label: 'Invoices', icon: FileText },
    { href: '/portal/roadmap', label: 'Roadmap', icon: Map },
    { href: '/portal/settings', label: 'Settings', icon: Settings },
  ];

  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'C';

  const sidebar = (
    <div className="flex h-full flex-col bg-[#071221]">
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06B6D4]/10">
          <Fingerprint className="h-6 w-6 text-[#22D3EE]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">Digital Footprint</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Client portal
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/portal/dashboard' && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-[#22D3EE]/55 bg-[#0891B2]/15 text-[#67E8F9] shadow-[0_0_24px_rgba(6,182,212,0.08)]'
                  : 'border-transparent text-slate-400 hover:bg-white/[0.045] hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {'badge' in item && (item.badge ?? 0) > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7C3AED]/25 px-1.5 text-[10px] font-bold text-[#C4B5FD]">
                  {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06B6D4]/10">
              <Headphones className="h-5 w-5 text-[#67E8F9]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Need help?</p>
              <p className="text-xs text-slate-500">Our team is here</p>
            </div>
          </div>
          <Link
            href="/support"
            className="inline-flex items-center text-xs font-semibold text-[#22D3EE] transition-colors hover:text-[#67E8F9]"
          >
            Contact support
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081321]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-2 border-[#06B6D4]/25 border-t-[#22D3EE]" />
          <p className="text-sm text-slate-400">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081321] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.08] lg:block">
        {sidebar}
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 h-16 border-b border-white/[0.08] bg-[#081321]/95 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
                aria-label="Open portal navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="hidden text-[11px] font-semibold tracking-[0.17em] text-slate-500 sm:block">
                RESHAPING YOUR DIGITAL WORLD
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationDropdown />

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(value => !value)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
                  aria-expanded={menuOpen}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#22D3EE]/30 bg-[#06B6D4]/10 text-xs font-bold text-[#67E8F9]">
                    {initials}
                  </div>
                  <div className="hidden max-w-36 text-left sm:block">
                    <p className="truncate text-sm font-semibold text-slate-200">{userName}</p>
                    <p className="text-[11px] text-slate-500">Client</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111E30] shadow-2xl"
                    >
                      <div className="border-b border-white/[0.08] p-4">
                        <p className="truncate text-sm font-semibold text-white">{userName}</p>
                        <p className="truncate text-xs text-slate-400">{userEmail}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/portal/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <User className="h-4 w-4" />
                          Account settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <SessionExpiryBanner loginPath="/portal/login" portalName="client portal" />

        <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close portal navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/65 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/[0.08] shadow-2xl lg:hidden"
            >
              {sidebar}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close portal navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
