'use client';

import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from '@/components/motion';
import { Bell } from 'lucide-react';
import { ACTIVITY_COLORS } from '@/lib/event-catalogue';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB');
}

interface NotificationBellProps {
  userId: string | null;
  open: boolean;
  onToggle: () => void;
}

export default function NotificationBell({ userId, open, onToggle }: NotificationBellProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, dismiss } = useNotifications(userId);

  return (
    <div className="relative notification-panel">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/30 transition-all cursor-pointer relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#F97316] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-[#1E293B] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <span className="font-semibold text-sm text-white">Notifications</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">
                    Mark all read
                  </button>
                )}
                <Link href="/admin/notifications" className="text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">
                  View all
                </Link>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-600 mt-1">You&apos;re all caught up</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start gap-3 transition-colors border-b border-[rgba(255,255,255,0.05)] last:border-0 ${n.read_at ? 'opacity-60 hover:bg-white/[0.02]' : 'hover:bg-white/5'}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: (ACTIVITY_COLORS[n.event_type] || '#64748B') + '20' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[n.event_type] || '#64748B' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="text-slate-600 hover:text-slate-400 shrink-0 cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      {n.message && <p className="text-xs text-slate-400 truncate mt-0.5">{n.message}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[10px] text-slate-500">{timeAgo(n.created_at)}</p>
                        {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />}
                      </div>
                      {n.route && (
                        <Link
                          href={n.route}
                          onClick={() => markAsRead(n.id)}
                          className="inline-block text-[10px] text-[#06B6D4] hover:underline mt-1 cursor-pointer"
                        >
                          View details
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}