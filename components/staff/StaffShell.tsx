'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import SessionExpiryBanner from '@/components/admin/SessionExpiryBanner';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCircle,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Search,
  FileText,
  TestTube,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: { href: string; icon: React.ElementType; label: string; badge?: number }[];
}

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userInitials, setUserInitials] = useState('DF');
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        supabase.from('staff_profiles').select('full_name, role').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          if (cancelled) return;
          const name = data?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Staff';
          setUserName(name);
          setUserRole(data?.role || 'staff');
          setUserInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'DF');
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/staff/login');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/staff/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const roleLabel = userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : userRole === 'project_lead' ? 'Project Lead' : userRole === 'developer' ? 'Developer' : userRole === 'support' ? 'Support' : 'Staff';

  const navGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { href: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'MY WORK',
      items: [
        { href: '/staff/tasks', icon: CheckSquare, label: 'My Tasks' },
        { href: '/staff/projects', icon: FolderKanban, label: 'Projects' },
      ],
    },
    {
      label: 'CLIENTS',
      items: [
        { href: '/staff/leads', icon: UserCircle, label: 'Leads' },
        { href: '/staff/clients', icon: Users, label: 'Clients' },
        { href: '/staff/messages', icon: MessageSquare, label: 'Messages' },
      ],
    },
    {
      label: 'UAT',
      items: [
        { href: '/staff/uat/applications', icon: FileText, label: 'Applications' },
        { href: '/staff/uat/terms', icon: FileText, label: 'Legal Agreements' },
      ],
    },
    {
      label: 'RESOURCES',
      items: [
        { href: '/staff/files', icon: FolderOpen, label: 'Files' },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { href: '/staff/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const renderNavItems = () => (
    <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/staff/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] font-bold leading-none">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      <aside className="hidden lg:flex flex-col w-[248px] h-screen fixed left-0 top-0 z-40 bg-[#1E293B] border-r border-[rgba(255,255,255,0.08)]">
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
          <Link href="/staff/dashboard" className="flex items-center gap-3 cursor-pointer">
            <img
              src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
              alt="Logo"
              width={34}
              height={34}
              className="object-contain rounded-lg"
            />
            <div>
              <div className="font-bold text-sm text-white">Digital-Footprint</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Staff Portal</div>
            </div>
          </Link>
        </div>

        {renderNavItems()}

        <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#1E293B] border-r border-[rgba(255,255,255,0.08)] z-50 flex flex-col lg:hidden shadow-xl"
            >
              <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <Link href="/staff/dashboard" className="flex items-center gap-3 cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <img src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp" alt="Logo" width={34} height={34} className="object-contain rounded-lg" />
                  <span className="font-bold text-sm text-white">Digital-Footprint</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderNavItems()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-[248px] min-h-screen">
        <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)] shadow-sm' : 'bg-transparent'}`}>
          <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative max-w-sm w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search projects, clients or tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={notifRef}>
                <button onClick={() => setProfileOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>

              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[#06B6D4]/30 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center text-white text-[10px] font-bold">
                    {userInitials}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-xs font-medium text-white truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{roleLabel}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 bg-[#1E293B] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                        <p className="font-semibold text-sm text-white">{userName}</p>
                        <p className="text-xs text-slate-400">{roleLabel}</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/staff/settings" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <SessionExpiryBanner loginPath="/staff/login" portalName="staff portal" />

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}