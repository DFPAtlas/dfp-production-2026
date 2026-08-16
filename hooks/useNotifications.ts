'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationItem {
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
  actor_user_id: string | null;
  source_system: string;
  occurrence_count: number;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  delivery_state: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userId: string | null) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setState((p) => ({ ...p, loading: false }));
      return;
    }

    const [{ data: recent, error: recentErr }, { count, error: countErr }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', userId)
        .is('read_at', null)
        .is('dismissed_at', null),
    ]);

    if (recentErr || countErr) {
      setState((p) => ({ ...p, loading: false, error: (recentErr || countErr)!.message }));
      return;
    }

    setState({
      notifications: recent || [],
      unreadCount: count || 0,
      loading: false,
      error: null,
    });
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
    setState((p) => ({
      ...p,
      notifications: p.notifications.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, p.unreadCount - (p.notifications.find((n) => n.id === notificationId && !n.read_at) ? 1 : 0)),
    }));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_user_id', userId).is('read_at', null);
    setState((p) => ({
      ...p,
      notifications: p.notifications.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
      unreadCount: 0,
    }));
  }, [userId]);

  const dismiss = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', notificationId);
    setState((p) => ({
      ...p,
      notifications: p.notifications.filter((n) => n.id !== notificationId),
      unreadCount: p.unreadCount - (p.notifications.find((n) => n.id === notificationId && !n.read_at) ? 1 : 0),
    }));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${userId}` },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  return { ...state, markAsRead, markAllAsRead, dismiss, refresh: loadNotifications };
}