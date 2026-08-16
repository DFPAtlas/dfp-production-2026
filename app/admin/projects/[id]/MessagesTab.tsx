'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { formatMessageTime, getThreadStatusLabel, getThreadTypeLabel, getThreadStatusColor, getPriorityColor } from '@/lib/message-definitions';
import { MessageSquare, Send, Search, X, Loader2, Eye, EyeOff, FolderKanban, ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { sendNotificationEmail, buildClientReplyEmailHtml } from '@/lib/email-notifications';

interface Thread {
  id: string;
  client_id: string;
  project_id: string | null;
  subject: string;
  thread_type: string;
  status: string;
  priority: string;
  created_by: string;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface Message {
  id: string;
  thread_id: string | null;
  sender_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Client {
  id: string;
  company_name?: string;
  contact_name?: string;
}

export default function MessagesTab({ project, onProjectUpdated }: { project: any; onProjectUpdated: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, [project.id]);

  async function fetchData() {
    setLoading(true);
    const projectId = project.id;

    const { data: threadData } = await supabase
      .from('message_threads')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    setThreads(threadData || []);
    if (threadData && threadData.length > 0 && !activeThreadId) {
      setActiveThreadId(threadData[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!activeThreadId) return;
    async function loadMessages() {
      const { data } = await supabase
        .from('project_messages')
        .select('*')
        .eq('thread_id', activeThreadId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    }
    loadMessages();
  }, [activeThreadId]);

  async function handleSend() {
    if (!newMessage.trim() || !activeThreadId || sending) return;
    setSending(true);

    const senderName = 'DFP Team';

    const msg = {
      project_id: project.id,
      thread_id: activeThreadId,
      sender_id: null,
      sender_name: senderName,
      content: newMessage.trim(),
      read: false,
      is_internal: isInternal,
    };

    const { data, error } = await supabase.from('project_messages').insert(msg).select().single();
    setNewMessage('');
    if (!error && data) {
      setMessages(prev => [...prev, data as Message]);
      await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', activeThreadId);

      if (!isInternal) {
        const thread = threads.find(t => t.id === activeThreadId);
        if (thread) {
          sendNotificationEmail({
            event_type: 'staff_reply',
            related_entity_id: activeThreadId,
            subject: `DFP Team replied: ${thread.subject}`,
            html: buildClientReplyEmailHtml('DFP Team', newMessage.trim(), thread.subject, `${window.location.origin}/portal/messages`, true),
          }).catch(() => {});
        }
      }
    }
    setSending(false);
  }

  async function handleStatusChange(threadId: string, newStatus: string) {
    const updates: any = { status: newStatus };
    if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
    await supabase.from('message_threads').update(updates).eq('id', threadId);
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: newStatus, closed_at: newStatus === 'closed' ? new Date().toISOString() : t.closed_at } : t));
  }

  const activeThread = threads.find(t => t.id === activeThreadId);
  const statusColor = activeThread ? getThreadStatusColor(activeThread.status) : '#94A3B8';

  const filteredThreads = threads.filter(t => {
    if (searchTerm) {
      if (!t.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }
    if (filter === 'open') return t.status === 'open' || t.status === 'awaiting_team' || t.status === 'awaiting_client';
    if (filter === 'resolved') return t.status === 'resolved' || t.status === 'closed' || t.status === 'archived';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#06B6D4]" />Messages
        </h3>
        <button onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden flex h-[550px]">
        <div className="w-72 border-r border-[rgba(255,255,255,0.08)] flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-[rgba(255,255,255,0.06)] space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
            </div>
            <div className="flex gap-1">
              {[{ k: 'all', l: 'All' }, { k: 'open', l: 'Open' }, { k: 'resolved', l: 'Resolved' }].map(f => (
                <button key={f.k} onClick={() => setFilter(f.k)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                    filter === f.k ? 'bg-[#06B6D4]/15 text-[#22D3EE]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>{f.l}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
                <p className="text-[10px] text-slate-500 mt-1">Clients start conversations from the portal</p>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const sc = getThreadStatusColor(thread.status);
                return (
                  <button key={thread.id} onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.03)] ${
                      activeThreadId === thread.id ? 'bg-[#06B6D4]/8 border-l-2 border-l-[#06B6D4]' : 'hover:bg-white/5 border-l-2 border-l-transparent'
                    }`}>
                    <p className="text-xs font-medium text-white truncate">{thread.subject}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">{getThreadTypeLabel(thread.thread_type)}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${sc}15`, color: sc }}>
                        {getThreadStatusLabel(thread.status)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {activeThread ? (
            <>
              <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{activeThread.subject}</p>
                  <p className="text-[10px] text-slate-400">{getThreadTypeLabel(activeThread.thread_type)} · {getThreadStatusLabel(activeThread.status)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select value={activeThread.status} onChange={e => handleStatusChange(activeThread.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer focus:outline-none pr-6">
                    <option value="open" className="bg-[#1E293B]">Open</option>
                    <option value="awaiting_client" className="bg-[#1E293B]">Awaiting Client</option>
                    <option value="awaiting_team" className="bg-[#1E293B]">Awaiting Team</option>
                    <option value="resolved" className="bg-[#1E293B]">Resolved</option>
                    <option value="closed" className="bg-[#1E293B]">Closed</option>
                    <option value="archived" className="bg-[#1E293B]">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.is_internal ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%]`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-medium text-slate-400">{msg.sender_name}</span>
                          {msg.is_internal && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Internal</span>
                          )}
                        </div>
                        <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          msg.is_internal ? 'bg-amber-500/8 border border-amber-500/15 text-amber-100 rounded-br-md' : 'bg-white/5 text-slate-200 rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5 px-1">{formatMessageTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setIsInternal(false)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      !isInternal ? 'bg-[#06B6D4]/20 text-[#22D3EE] ring-1 ring-[#06B6D4]/30' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}>
                    <Send className="w-3 h-3 inline mr-1" />Client Reply
                  </button>
                  <button onClick={() => setIsInternal(true)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isInternal ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}>
                    <Shield className="w-3 h-3 inline mr-1" />Internal Note
                  </button>
                  {isInternal && (
                    <span className="text-[10px] text-amber-400/70 flex items-center gap-1 ml-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                      Staff only — clients cannot see this
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={isInternal ? 'Add an internal note...' : 'Reply to client...'}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                    className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5">
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Select a conversation</p>
                <p className="text-xs text-slate-500 mt-1">Client messages appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
