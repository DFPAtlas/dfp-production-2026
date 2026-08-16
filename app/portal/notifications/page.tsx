'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { Bell, Check, Trash2, Search, MessageSquare, Headphones, FileText, ReceiptText, FolderKanban, Globe, CheckCircle, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';

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

function getNotifIcon(type: string) {
  if (type.startsWith('message') || type.startsWith('thread')) return MessageSquare;
  if (type.startsWith('support') || type.startsWith('ticket')) return Headphones;
  if (type.startsWith('approval')) return CheckCircle;
  if (type.startsWith('invoice') || type.startsWith('payment')) return ReceiptText;
  if (type.startsWith('file') || type.startsWith('content')) return FileText;
  if (type.startsWith('project')) return FolderKanban;
  if (type.startsWith('website')) return Globe;
  if (type.startsWith('security')) return Shield;
  return Bell;
}

function getNotifColor(type: string) {
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

function formatNotifFull(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const load = useCallback(async (uid: string) => {
    const query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', uid)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'unread') query.is('read_at', null);

    const { data } = await query;
    setNotifications(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        load(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, [load]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  }

  async function markAllRead() {
    if (!userId) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_user_id', userId).is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const filtered = notifications.filter(n => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return n.title.toLowerCase().includes(s) || (n.message && n.message.toLowerCase().includes(s));
  });

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400 mt-1 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#22D3EE]/10 text-[#22D3EE] rounded-xl text-sm font-semibold hover:bg-[#22D3EE]/20 transition-colors cursor-pointer whitespace-nowrap">
                <Check className="w-4 h-4" />Mark all read
              </button>
            )}
          </div>
        </motion.div>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search notifications..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
          </div>
          <div className="flex gap-1">
            {[{ k: 'all' as const, l: 'All' }, { k: 'unread' as const, l: 'Unread' }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  filter === f.k ? 'bg-[#06B6D4]/15 text-[#22D3EE]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>{f.l}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No notifications</h3>
            <p className="text-sm text-slate-400">{searchTerm ? 'Try a different search' : 'You\'re all caught up!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => {
              const Icon = getNotifIcon(notif.event_type);
              const color = getNotifColor(notif.event_type);
              const isUnread = !notif.read_at;
              return (
                <div key={notif.id}
                  className={`bg-[#1E293B] border rounded-xl p-4 transition-colors group ${
                    isUnread ? 'border-[#22D3EE]/15 bg-[#06B6D4]/5' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${isUnread ? 'font-semibold text-white' : 'text-slate-200'}`}>
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && <span className="h-2 w-2 rounded-full bg-[#22D3EE]" />}
                          <button onClick={() => dismiss(notif.id)}
                            className="text-slate-600 hover:text-slate-300 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-500">{formatNotifFull(notif.created_at)}</span>
                        {notif.route && (
                          <Link href={notif.route}
                            onClick={() => { if (isUnread) markRead(notif.id); }}
                            className="text-[10px] font-semibold text-[#22D3EE] hover:text-[#67E8F9] cursor-pointer">
                            View details
                          </Link>
                        )}
                        {isUnread && (
                          <button onClick={() => markRead(notif.id)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-white cursor-pointer">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}