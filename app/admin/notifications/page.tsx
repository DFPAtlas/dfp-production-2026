'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import { motion } from '@/components/motion';
import { Bell, CheckCheck, Search, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { ACTIVITY_COLORS } from '@/lib/event-catalogue';
import { markNotificationAsRead, markAllNotificationsAsRead, dismissNotification } from '@/lib/notification-service';
import AdminShell from '@/components/admin/AdminShell';

const PAGE_SIZE = 20;

export default function NotificationCentre() {
  const { profile } = useAdminProfile();
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_user_id', profile.id)
      .is('dismissed_at', null);

    if (filterUnread) query = query.is('read_at', null);
    if (filterCategory) query = query.eq('category', filterCategory);
    if (filterSeverity) query = query.eq('severity', filterSeverity);
    if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);

    const { data, error: queryErr, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (queryErr) { setError(queryErr.message); setLoading(false); return; }

    setNotifications(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [profile?.id, page, filterUnread, filterCategory, filterSeverity, searchTerm]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    await markAllNotificationsAsRead(profile.id);
    setNotifications((p) => p.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const handleDismiss = async (id: string) => {
    await dismissNotification(id);
    setNotifications((p) => p.filter((n) => n.id !== id));
    setTotalCount((c) => c - 1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const categories = ['assignment', 'mention', 'approval', 'deadline', 'client', 'project', 'task', 'finance', 'operations', 'automation', 'uat', 'pbx', 'content', 'security', 'system'];
  const severities = ['info', 'success', 'warning', 'high', 'critical'];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-300">Notifications</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notification Centre</h1>
            <p className="text-sm text-slate-400 mt-1">{totalCount} notifications</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-[rgba(255,255,255,0.08)] text-xs text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40"
            />
          </div>

          <button onClick={() => { setFilterUnread(!filterUnread); setPage(0); }} className={`px-3 py-2 rounded-xl border text-xs cursor-pointer whitespace-nowrap transition-all ${filterUnread ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}>
            Unread only
          </button>

          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none focus:border-[#06B6D4]/40 appearance-none pr-8"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-300 cursor-pointer focus:outline-none focus:border-[#06B6D4]/40 appearance-none pr-8"
          >
            <option value="">All severities</option>
            {severities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {(filterUnread || filterCategory || filterSeverity || searchTerm) && (
            <button onClick={() => { setFilterUnread(false); setFilterCategory(''); setFilterSeverity(''); setSearchTerm(''); setPage(0); }} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer whitespace-nowrap flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-white/[0.02] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-400">Failed to load notifications</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <button onClick={load} className="mt-3 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer transition-all">Retry</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No notifications found</p>
            <p className="text-xs text-slate-600 mt-1">
              {searchTerm || filterUnread || filterCategory || filterSeverity ? 'Try adjusting your filters' : 'You\'re all caught up'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((n) => (
                <motion.div
                  key={n.id as string}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-xl p-4 border transition-colors ${!n.read_at ? 'bg-[#06B6D4]/[0.03] border-[rgba(255,255,255,0.08)]' : 'bg-white/[0.01] border-transparent opacity-60'}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: (ACTIVITY_COLORS[n.event_type as string] || '#64748B') + '20' }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[n.event_type as string] || '#64748B' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-white">{n.title as string}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 capitalize">{n.category as string}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${(n.severity as string) === 'critical' ? 'bg-red-500/10 text-red-400' : (n.severity as string) === 'high' ? 'bg-orange-500/10 text-orange-400' : (n.severity as string) === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-white/5 text-slate-500'} capitalize`}>
                          {n.severity as string}
                        </span>
                        {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />}
                      </div>
                      {(n.message as string) && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message as string}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span>{new Date(n.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {(n.occurrence_count as number) > 1 && <span className="text-slate-600">{n.occurrence_count as number} occurrences</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(n.route as string) && (
                        <Link
                          href={n.route as string}
                          onClick={() => handleMarkRead(n.id as string)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-[10px] text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View
                        </Link>
                      )}
                      {!n.read_at && (
                        <button onClick={() => handleMarkRead(n.id as string)} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                          Read
                        </button>
                      )}
                      <button onClick={() => handleDismiss(n.id as string)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all ${i === page ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

