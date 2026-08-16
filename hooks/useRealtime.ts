'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: ChangeEvent;
  filter?: string;
  enabled?: boolean;
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  options: RealtimeSubscriptionOptions,
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { table, schema = 'public', event = '*', filter, enabled = true } = options;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    cleanup();

    const channel = supabase
      .channel(`realtime:${table}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes' as never,
        {
          event,
          schema,
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onEvent(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed
        }
      });

    channelRef.current = channel;

    return () => {
      cleanup();
    };
  }, [table, schema, event, filter, enabled, cleanup, onEvent]);

  return {
    unsubscribe: cleanup,
  };
}

export function useRealtimePresence(
  channelName: string,
  userState: Record<string, unknown>,
  enabled = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userState.user_id as string || 'anonymous' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Presence state updated
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userState);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, enabled]);

  return channelRef;
}