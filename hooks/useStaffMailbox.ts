import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UATSandboxMessage, UATSandboxMessageEvent, UATMessageAttachment } from '@/lib/uat-communications/types';

export function useStaffMailbox(sandboxInstanceId: string | null) {
  const [messages, setMessages] = useState<UATSandboxMessage[]>([]);
  const [events, setEvents] = useState<Record<string, UATSandboxMessageEvent[]>>();
  const [attachments, setAttachments] = useState<Record<string, UATMessageAttachment[]>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    if (!sandboxInstanceId) return;
    setLoading(true);
    setError('');

    const { data: msgs, error: msgsErr } = await supabase
      .from('uat_sandbox_messages')
      .select('*')
      .eq('sandbox_instance_id', sandboxInstanceId)
      .order('intercepted_at', { ascending: false });

    if (msgsErr) {
      setError(msgsErr.message);
      setLoading(false);
      return;
    }

    setMessages((msgs || []) as UATSandboxMessage[]);

    if (msgs && msgs.length > 0) {
      const ids = msgs.map((m: any) => m.id);
      const [{ data: evts }, { data: atts }] = await Promise.all([
        supabase.from('uat_sandbox_message_events').select('*').in('message_id', ids).order('created_at', { ascending: true }),
        supabase.from('uat_sandbox_message_attachments').select('*').in('message_id', ids),
      ]);

      const evMap: Record<string, UATSandboxMessageEvent[]> = {};
      evts?.forEach((e: any) => {
        if (!evMap[e.message_id]) evMap[e.message_id] = [];
        evMap[e.message_id].push(e as UATSandboxMessageEvent);
      });
      setEvents(evMap);

      const attMap: Record<string, UATMessageAttachment[]> = {};
      atts?.forEach((a: any) => {
        if (!attMap[a.message_id]) attMap[a.message_id] = [];
        attMap[a.message_id].push(a as UATMessageAttachment);
      });
      setAttachments(attMap);
    }

    setLoading(false);
  }, [sandboxInstanceId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const quarantineMessage = async (messageId: string, reason: string) => {
    const { data, error: rpcErr } = await supabase.rpc('uat_quarantine_message', {
      p_message_id: messageId,
      p_reason: reason,
    });

    if (rpcErr) return { success: false, error: rpcErr.message };
    if (data?.success) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status: 'quarantined' } : m));
    }
    return data;
  };

  return {
    messages, events, attachments, loading, error,
    refresh: loadMessages, quarantineMessage,
  };
}