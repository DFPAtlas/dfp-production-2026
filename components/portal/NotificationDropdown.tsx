'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { Bell, X, Check, Shield, MessageSquare, Headphones, FileText, ReceiptText, FolderKanban, Globe, CheckCircle, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  event_type: string;
  category: string;
  severity: string;
  title: string;
  message: string | null;
  related_module: string | null;
  related_record_type: string | null;
  related_record_id: string | null;
  route: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

function getNotificationIcon(type: string) {
  if (type.startsWith('message') || type.startsWith('thread')) return MessageSquare;
  if (type.startsWith('support') || type.startsWith('ticket')) return Headphones;
  if (type.startsWith('approval')) return CheckCircle;
  if (type.startsWith('invoice') || type.startsWith('payment')) return ReceiptText;
  if (type.startsWith('file') || type.startsWith('content')) return FileText;
  if (type.startsWith('project')) return FolderKanban;
  if (type.startsWith('website')) return Globe;
  return Bell;
}

function getNotificationColor(type: string) {
  if (type.startsWith('message') || type.startsWith('thread')) return '#22D3EE';
  if (type.startsWith('support') || type.startsWith('ticket')) return '#8B5CF6';
  if (type.startsWith('approval')) return '#A78BFA';
  if (type.startsWith('invoice') || type.startsWith('payment')) return '#F59E0B';
  if (type.startsWith('file') || type.startsWith('content')) return '#10B981';
  if (type.startsWith('project')) return '#3B82F6';
  if (type.startsWith('website')) return '#06B6D4';
  if (type.startsWith('security')) return '#EF4444';
  return '#94A3B8';
}

function formatNotifTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchNotifications(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-dropdown:${userId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${userId}`,
      }, () => {
        fetchNotifications(userId);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications(uid: string) {
    setLoading(true);
    const [{ data: recent }, { count }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', uid)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', uid)
        .is('read_at', null)
        .is('dismissed_at', null),
    ]);
    setNotifications(recent || []);
    setUnreadCount(count || 0);
    setLoading(false);
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function markAllRead() {
    if (!userId) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_user_id', userId).is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
    const wasUnread = !notifications.find(n => n.id === id)?.read_at;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
  }

  const unread = notifications.filter(n => !n.read_at);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 text-[10px] font-bold text-white ring-2 ring-[#081321]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111E30] shadow-2xl z-50"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-[#22D3EE] hover:text-[#67E8F9] flex items-center gap-1 cursor-pointer whitespace-nowrap">
                    <Check className="w-3 h-3" />Mark all read
                  </button>
                )}
                <Link href="/portal/notifications" onClick={() => setOpen(false)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer">
                  View all
                </Link>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-10 h-10 text-slate-500 mb-3" />
                  <p className="text-sm font-medium text-slate-300">No notifications</p>
                  <p className="text-xs text-slate-500 mt-1">We&apos;ll let you know when something happens</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const Icon = getNotificationIcon(notif.event_type);
                  const color = getNotificationColor(notif.event_type);
                  const isUnread = !notif.read_at;
                  return (
                    <div key={notif.id} className={`group flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors ${isUnread ? 'bg-[#06B6D4]/5' : 'hover:bg-white/[0.02]'}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="h-4.5 w-4.5" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'text-slate-300'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isUnread && <span className="h-2 w-2 rounded-full bg-[#22D3EE]" />}
                            <button onClick={() => dismiss(notif.id)}
                              className="text-slate-600 hover:text-slate-300 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {notif.message && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{formatNotifTime(notif.created_at)}</span>
                          {notif.route && (
                            <Link
                              href={notif.route}
                              onClick={() => { setOpen(false); if (isUnread) markRead(notif.id); }}
                              className="text-[10px] font-semibold text-[#22D3EE] hover:text-[#67E8F9] cursor-pointer">
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}