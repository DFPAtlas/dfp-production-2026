import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  formatMessageTypeLabel, formatStatusLabel, getStatusColor,
  maskEmail, maskPhone,
} from '@/lib/uat-communications/adapters/base';
import type { UATSandboxMessage, UATSandboxMessageEvent, MailboxStats } from '@/lib/uat-communications/types';

export function useMailbox(assignmentId: string, testerId: string) {
  const [messages, setMessages] = useState<UATSandboxMessage[]>([]);
  const [events, setEvents] = useState<Record<string, UATSandboxMessageEvent[]>>();
  const [stats, setStats] = useState<MailboxStats>({ email: 0, sms: 0, webhook: 0, blocked: 0, total: 0, latest: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMailbox = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: msgs, error: msgsErr } = await supabase
      .from('uat_tester_mailbox_view')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('intercepted_at', { ascending: false });

    if (msgsErr) {
      setError(msgsErr.message);
      setLoading(false);
      return;
    }

    setMessages((msgs || []) as UATSandboxMessage[]);

    const { data: statData, error: statErr } = await supabase
      .rpc('uat_tester_mailbox_stats', { p_assignment_id: assignmentId });

    if (!statErr && statData) {
      setStats(statData as MailboxStats);
    }

    if (msgs && msgs.length > 0) {
      const ids = msgs.map((m: any) => m.id);
      const { data: evts } = await supabase
        .from('uat_sandbox_message_events')
        .select('*')
        .in('message_id', ids)
        .order('created_at', { ascending: true });

      const evMap: Record<string, UATSandboxMessageEvent[]> = {};
      evts?.forEach((e: any) => {
        if (!evMap[e.message_id]) evMap[e.message_id] = [];
        evMap[e.message_id].push(e as UATSandboxMessageEvent);
      });
      setEvents(evMap);
    }

    setLoading(false);
  }, [assignmentId]);

  useEffect(() => { loadMailbox(); }, [loadMailbox]);

  const linkToTestCase = async (messageId: string, assignmentTestCaseId: string) => {
    const { data, error: rpcErr } = await supabase.rpc('uat_link_message_to_case', {
      p_message_id: messageId,
      p_assignment_test_case_id: assignmentTestCaseId,
    });

    if (rpcErr) return { success: false, error: rpcErr.message };
    return data;
  };

  const linkToFeedback = async (messageId: string, feedbackId: string) => {
    const { data, error: rpcErr } = await supabase.rpc('uat_link_message_to_feedback', {
      p_message_id: messageId,
      p_feedback_id: feedbackId,
    });

    if (rpcErr) return { success: false, error: rpcErr.message };
    return data;
  };

  const markReviewed = async (messageId: string) => {
    const { data, error: rpcErr } = await supabase.rpc('uat_mark_message_reviewed', {
      p_message_id: messageId,
    });

    if (rpcErr) return { success: false, error: rpcErr.message };
    if (data?.success) {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status: 'reviewed' } : m));
    }
    return data;
  };

  return {
    messages, events, stats, loading, error,
    refresh: loadMailbox,
    linkToTestCase, linkToFeedback, markReviewed,
  };
}

export type MessageFilter = 'all' | 'email' | 'sms' | 'webhook' | 'delivered' | 'failed' | 'blocked';

export function filterMessages(
  messages: UATSandboxMessage[],
  filter: MessageFilter,
  searchQuery: string
): UATSandboxMessage[] {
  let result = [...messages];

  switch (filter) {
    case 'email': result = result.filter((m) => m.message_type === 'email'); break;
    case 'sms': result = result.filter((m) => m.message_type === 'sms'); break;
    case 'webhook': result = result.filter((m) => m.message_type === 'webhook'); break;
    case 'delivered': result = result.filter((m) => m.status === 'simulated_delivered'); break;
    case 'failed': result = result.filter((m) => m.status === 'simulated_failed'); break;
    case 'blocked': result = result.filter((m) => m.status === 'blocked'); break;
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((m) =>
      (m.subject || '').toLowerCase().includes(q) ||
      (m.recipient_address || '').toLowerCase().includes(q) ||
      (m.sender_address || '').toLowerCase().includes(q) ||
      (m.safe_preview || '').toLowerCase().includes(q)
    );
  }

  return result;
}