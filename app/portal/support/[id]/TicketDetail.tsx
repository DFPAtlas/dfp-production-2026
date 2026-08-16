'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { formatMessageTime, getTicketStatusLabel, getTicketCategoryLabel, getTicketPriorityLabel, getTicketStatusColor, getPriorityColor } from '@/lib/message-definitions';
import { ArrowLeft, Send, Clock, FolderKanban, Globe, ExternalLink, Headphones, Loader2, RefreshCw, X, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PortalShell from '../../PortalShell';
import { AttachmentUploader, AttachmentFile } from '@/components/portal/AttachmentUploader';
import { sendNotificationEmail, buildTicketEmailHtml } from '@/lib/email-notifications';

interface Ticket {
  id: string;
  ticket_reference: string;
  client_id: string;
  project_id: string | null;
  website_id: string | null;
  thread_id: string | null;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_staff: string | null;
  created_by: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  thread_id: string | null;
  sender_name: string;
  content: string;
  is_internal: boolean;
  attachments: any[] | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

export default function TicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setNotFound(true); return; }
    setUserId(session.user.id);
    setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Client');

    const { data: ticketData, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (error || !ticketData) { setNotFound(true); setLoading(false); return; }
    setTicket(ticketData);

    if (ticketData.project_id) {
      const { data: projData } = await supabase.from('projects').select('id, name').eq('id', ticketData.project_id).maybeSingle();
      if (projData) setProject(projData);
    }

    if (ticketData.thread_id) {
      const { data: msgData } = await supabase
        .from('project_messages')
        .select('*')
        .eq('thread_id', ticketData.thread_id)
        .eq('is_internal', false)
        .order('created_at', { ascending: true });
      setMessages(msgData || []);

      const unreadMsgs = (msgData || []).filter(m => m.sender_name !== userName);
      if (unreadMsgs.length) {
        const receipts = unreadMsgs.map(m => ({ message_id: m.id, user_id: session.user.id }));
        await supabase.from('message_read_receipts').upsert(receipts, { onConflict: 'message_id, user_id', ignoreDuplicates: true });
      }
    }

    setLoading(false);
  }, [ticketId, userName]);

  useEffect(() => {
    loadData();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadData]);

  useEffect(() => {
    if (!ticket?.thread_id) return;

    const channel = supabase
      .channel(`ticket-detail:${ticketId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `thread_id=eq.${ticket.thread_id}`,
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `id=eq.${ticketId}`,
      }, (payload) => {
        setTicket(payload.new as Ticket);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.thread_id, ticketId, loadData]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleReply() {
    if (!newReply.trim() || !ticket || sending) return;
    setSending(true);

    const msg = {
      project_id: ticket.project_id || '00000000-0000-0000-0000-000000000000',
      thread_id: ticket.thread_id || null,
      sender_id: userId,
      sender_name: userName,
      content: newReply.trim(),
      read: false,
      is_internal: false,
    };

    const { data, error } = await supabase.from('project_messages').insert(msg).select().single();
    if (!error && data) {
      setMessages(prev => [...prev, data as Message]);
      setNewReply('');
      setAttachments([]);
      if (ticket.thread_id) {
        await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', ticket.thread_id);
      }
      sendNotificationEmail({
        event_type: 'ticket_replied',
        related_entity_id: ticket.id,
        subject: `New reply on ${ticket.ticket_reference}`,
        html: buildTicketEmailHtml('replied', ticket.ticket_reference, ticket.subject, '', `${window.location.origin}/portal/support/${ticket.id}`),
      }).catch(() => {});
    }
    setSending(false);
  }

  async function handleClose() {
    if (!ticket || closing) return;
    setClosing(true);
    const { data, error } = await supabase.rpc('client_close_ticket', { p_ticket_id: ticket.id });
    if (!error && data?.success) {
      setTicket(prev => prev ? { ...prev, status: 'closed', closed_at: new Date().toISOString() } : null);
    }
    setClosing(false);
  }

  async function handleReopen() {
    if (!ticket || reopening) return;
    setReopening(true);
    const { data, error } = await supabase.rpc('client_reopen_ticket', { p_ticket_id: ticket.id });
    if (!error && data?.success) {
      setTicket(prev => prev ? { ...prev, status: 'open', resolved_at: null, closed_at: null } : null);
    }
    setReopening(false);
  }

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (notFound || !ticket) {
    return (
      <PortalShell>
        <div className="flex min-h-[55vh] flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 mb-4">
            <Headphones className="h-7 w-7 text-[#A78BFA]" />
          </div>
          <p className="text-lg font-semibold text-white mb-1">Ticket not found</p>
          <p className="text-sm text-slate-400 mb-4">This ticket may have been removed or you don&apos;t have access.</p>
          <Link href="/portal/support" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22D3EE] text-[#071221] rounded-xl text-sm font-bold hover:bg-[#67E8F9] transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Support
          </Link>
        </div>
      </PortalShell>
    );
  }

  const statusColor = getTicketStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  const canReply = ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'cancelled';
  const canClose = ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'cancelled';
  const canReopen = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <PortalShell>
      <div className="mx-auto max-w-4xl h-[calc(100vh-8rem)]">
        <div className="mb-4">
          <Link href="/portal/support" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />Back to Support
          </Link>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-slate-500">{ticket.ticket_reference}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                {getTicketStatusLabel(ticket.status)}
              </span>
              {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>
                  {getTicketPriorityLabel(ticket.priority)}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-slate-400">{getTicketCategoryLabel(ticket.category)}</span>
              {project && (
                <Link href={`/portal/projects/${project.id}`} className="flex items-center gap-1 text-xs text-[#22D3EE] hover:text-[#67E8F9] transition-colors">
                  <FolderKanban className="w-3 h-3" />{project.name}
                </Link>
              )}
              <span className="text-[10px] text-slate-500">Created {formatMessageTime(ticket.created_at)}</span>
            </div>
          </motion.div>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex flex-col h-[calc(100%-80px)]">
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${statusColor}15` }}>
              <Headphones className="w-4 h-4" style={{ color: statusColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
              <p className="text-xs text-slate-400">
                {ticket.status === 'resolved' ? `Resolved ${ticket.resolved_at ? formatMessageTime(ticket.resolved_at) : ''}` : getTicketStatusLabel(ticket.status)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canClose && (
                <button onClick={handleClose} disabled={closing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
                  {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Close
                </button>
              )}
              {canReopen && (
                <button onClick={handleReopen} disabled={reopening}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 hover:bg-[#22D3EE]/20 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
                  {reopening ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {ticket.description && (
              <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#C4B5FD] mb-2">Request Description</p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Headphones className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">Awaiting response</p>
                  <p className="text-sm text-slate-400">Our support team will respond soon</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.sender_name === userName;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] ${isMine ? 'order-1' : ''}`}>
                      <p className={`text-xs font-medium mb-1 px-1 ${isMine ? 'text-right text-[#8B5CF6]' : 'text-slate-400'}`}>
                        {isMine ? 'You' : msg.sender_name}
                      </p>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-[#8B5CF6] text-white rounded-br-md' : 'bg-white/5 text-slate-200 rounded-bl-md'}`}>
                        {msg.content}
                      </div>
                      {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1 px-1">
                          {msg.attachments.map((att: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-500 bg-white/5 rounded-lg px-2 py-1">
                              <FileText className="w-3 h-3" />
                              <span className="truncate">{att.name || 'Attachment'}</span>
                              {att.size && <span className="text-slate-600">{att.size}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : ''}`}>
                        <span className="text-[10px] text-slate-500">{formatMessageTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {canReply && (
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
              <AttachmentUploader onAttachmentsChange={setAttachments} maxFiles={3} disabled={sending} />
              <div className="flex items-center gap-3 mt-2">
                <input type="text" value={newReply} onChange={e => setNewReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all" />
                <button onClick={handleReply} disabled={!newReply.trim() || sending}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0">
                  {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}