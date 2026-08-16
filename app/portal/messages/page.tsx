'use client';

import { useEffect, useState, useRef, useCallback, type MouseEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { formatMessageTime, formatMessageTimeFull, getThreadStatusLabel, getThreadTypeLabel, getThreadStatusColor, getPriorityColor } from '@/lib/message-definitions';
import { Search, Send, MessageSquare, FolderKanban, Globe, ReceiptText, CheckCircle, FileText, Headphones, ArrowLeft, Plus, Clock, Loader2 } from 'lucide-react';
import PortalShell from '../PortalShell';
import { AttachmentUploader, AttachmentFile } from '@/components/portal/AttachmentUploader';
import { sendNotificationEmail, buildClientReplyEmailHtml } from '@/lib/email-notifications';

interface Thread {
  id: string;
  client_id: string;
  project_id: string | null;
  website_id: string | null;
  approval_id: string | null;
  invoice_id: string | null;
  ticket_id: string | null;
  subject: string;
  thread_type: string;
  status: string;
  priority: string;
  created_by: string;
  assigned_staff: string | null;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface Message {
  id: string;
  project_id: string;
  thread_id: string | null;
  sender_id: string | null;
  sender_name: string;
  content: string;
  is_internal: boolean;
  read: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Website {
  id: string;
  name: string;
}

interface ThreadWithMeta extends Thread {
  projectName?: string;
  websiteName?: string;
  lastMessage?: Message;
  unreadCount: number;
}

type FilterKey = 'all' | 'unread' | 'projects' | 'support' | 'billing' | 'resolved';

export default function MessagesPage() {
  const [threads, setThreads] = useState<ThreadWithMeta[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newType, setNewType] = useState('general');
  const [newProjectId, setNewProjectId] = useState('');
  const [newBody, setNewBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUserId(session.user.id);
      setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Client');

      const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle();
      const cid = clientData?.id || null;
      setClientId(cid);

      if (cid) {
        const [projRes, webRes] = await Promise.all([
          supabase.from('projects').select('id, name').eq('client_id', cid).order('name'),
          supabase.from('client_websites').select('id, name').eq('client_id', cid).eq('client_visible', true).order('name'),
        ]);
        setProjects(projRes.data || []);
        setWebsites(webRes.data || []);
        await fetchThreads();
      }
      setLoading(false);
    }
    init();

    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && clientId) fetchThreads(true);
      });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchThreads = useCallback(async (silent = false) => {
    if (!clientId) return;
    if (!silent) setLoading(true);

    const { data: threadData } = await supabase
      .from('message_threads')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false });

    if (!threadData?.length) { setThreads([]); if (!silent) setLoading(false); return; }

    const threadIds = threadData.map(t => t.id);
    const { data: msgData } = await supabase
      .from('project_messages')
      .select('*')
      .in('thread_id', threadIds)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    const { data: readData } = await supabase
      .from('message_read_receipts')
      .select('message_id')
      .eq('user_id', userId)
      .in('message_id', (msgData || []).map(m => m.id));

    const readSet = new Set((readData || []).map(r => r.message_id));
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    const websiteMap = new Map(websites.map(w => [w.id, w.name]));

    const enriched: ThreadWithMeta[] = threadData.map(t => {
      const threadMsgs = (msgData || []).filter(m => m.thread_id === t.id);
      const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
      const unread = threadMsgs.filter(m => !readSet.has(m.id) && m.sender_name !== userName).length;
      return {
        ...t,
        projectName: t.project_id ? projectMap.get(t.project_id) : undefined,
        websiteName: t.website_id ? websiteMap.get(t.website_id) : undefined,
        lastMessage: lastMsg,
        unreadCount: unread,
      };
    });

    setThreads(enriched);
    if (!silent) setLoading(false);
  }, [clientId, userId, userName, projects, websites]);

  useEffect(() => { fetchThreads(); }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`portal-messages:${clientId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
      }, () => {
        fetchThreads(true);
        if (activeThreadId) fetchMessages(activeThreadId);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'message_threads',
      }, () => {
        fetchThreads(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, activeThreadId]);

  async function fetchMessages(threadId: string) {
    const { data } = await supabase
      .from('project_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function markThreadRead(threadId: string) {
    const unreadMsgs = messages.filter(m => m.sender_name !== userName);
    if (!unreadMsgs.length) return;
    const receipts = unreadMsgs.map(m => ({ message_id: m.id, user_id: userId }));
    await supabase.from('message_read_receipts').upsert(receipts, { onConflict: 'message_id, user_id', ignoreDuplicates: true });
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t));
  }

  function handleSelectThread(threadId: string) {
    setActiveThreadId(threadId);
    setMobileView('thread');
    fetchMessages(threadId);
    markThreadRead(threadId);
  }

  async function handleSend() {
    if (!newMessage.trim() || !activeThreadId || sending) return;
    setSending(true);
    const activeThread = threads.find(t => t.id === activeThreadId);
    const msg = {
      project_id: activeThread?.project_id || '00000000-0000-0000-0000-000000000000',
      thread_id: activeThreadId,
      sender_id: userId,
      sender_name: userName,
      content: newMessage.trim(),
      read: false,
      is_internal: false,
      attachments: [],
    };
    const { data, error } = await supabase.from('project_messages').insert(msg).select().single();
    setNewMessage('');
    if (!error && data) {
      setMessages(prev => [...prev, data as Message]);
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, lastMessage: data as Message, updated_at: new Date().toISOString() } : t));
      await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', activeThreadId);

      const activeThreadData = threads.find(t => t.id === activeThreadId);
      if (activeThreadData) {
        sendNotificationEmail({
          event_type: 'client_reply',
          related_entity_id: activeThreadId,
          subject: `New reply: ${activeThreadData.subject}`,
          html: buildClientReplyEmailHtml(userName, newMessage.trim(), activeThreadData.subject, `${window.location.origin}/portal/messages`, false),
        }).catch(() => {});
      }
    }
    setSending(false);
  }

  async function handleCreateThread() {
    if (!newSubject.trim() || !newBody.trim() || creating || !clientId) return;
    setCreating(true);

    const thread: any = {
      client_id: clientId,
      project_id: newProjectId || null,
      subject: newSubject.trim(),
      thread_type: newType,
      status: 'awaiting_team',
      priority: 'normal',
      created_by: userId,
      client_visible: true,
    };

    const { data: threadData, error: threadErr } = await supabase.from('message_threads').insert(thread).select().single();
    if (threadErr || !threadData) { setCreating(false); return; }

    const msg = {
      project_id: newProjectId || '00000000-0000-0000-0000-000000000000',
      thread_id: threadData.id,
      sender_id: userId,
      sender_name: userName,
      content: newBody.trim(),
      read: false,
      is_internal: false,
    };

    const { error: msgErr } = await supabase.from('project_messages').insert(msg);
    if (msgErr) { setCreating(false); return; }

    setShowNewModal(false);
    setNewSubject('');
    setNewBody('');
    setNewProjectId('');
    setNewType('general');
    setCreating(false);
    await fetchThreads();
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function getContextIcon(type: string) {
    switch (type) {
      case 'project': return FolderKanban;
      case 'website': return Globe;
      case 'approval': return CheckCircle;
      case 'content': return FileText;
      case 'billing': return ReceiptText;
      case 'support': return Headphones;
      default: return MessageSquare;
    }
  }

  function getContextLabel(thread: ThreadWithMeta) {
    switch (thread.thread_type) {
      case 'project': return thread.projectName || 'Project';
      case 'website': return thread.websiteName || 'Website';
      default: return getThreadTypeLabel(thread.thread_type);
    }
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const filteredThreads = threads.filter(t => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!t.subject.toLowerCase().includes(s) && !(t.projectName && t.projectName.toLowerCase().includes(s))) return false;
    }
    switch (filter) {
      case 'unread': return t.unreadCount > 0;
      case 'projects': return t.thread_type === 'project';
      case 'support': return t.thread_type === 'support';
      case 'billing': return t.thread_type === 'billing';
      case 'resolved': return t.status === 'resolved' || t.status === 'closed';
      default: return true;
    }
  });

  const activeThread = threads.find(t => t.id === activeThreadId);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'projects', label: 'Projects' },
    { key: 'support', label: 'Support' },
    { key: 'billing', label: 'Billing' },
    { key: 'resolved', label: 'Resolved' },
  ];

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl h-[calc(100vh-8rem)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Messages</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {totalUnread > 0 ? `${totalUnread} unread across ${threads.filter(t => t.unreadCount > 0).length} conversation${threads.filter(t => t.unreadCount > 0).length !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#22D3EE] text-[#071221] rounded-xl text-sm font-bold hover:bg-[#67E8F9] transition-colors cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />New Message
          </button>
        </motion.div>

        <div className={`bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex h-full ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}`}>
          <div className={`w-full md:w-80 lg:w-96 border-r border-[rgba(255,255,255,0.08)] flex flex-col flex-shrink-0`}>
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search conversations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      filter === f.key ? 'bg-[#06B6D4]/15 text-[#22D3EE]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}>{f.label}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">{searchTerm ? 'No matching conversations' : 'No conversations yet'}</p>
                  {!searchTerm && (
                    <button onClick={() => setShowNewModal(true)}
                      className="mt-3 text-xs font-semibold text-[#22D3EE] hover:text-[#67E8F9] cursor-pointer">Start a new message</button>
                  )}
                </div>
              ) : (
                filteredThreads.map(thread => {
                  const Icon = getContextIcon(thread.thread_type);
                  const statusColor = getThreadStatusColor(thread.status);
                  return (
                    <button key={thread.id} onClick={() => handleSelectThread(thread.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.04)] ${
                        activeThreadId === thread.id ? 'bg-[#06B6D4]/5 border-l-2 border-l-[#06B6D4]' : 'hover:bg-white/5 border-l-2 border-l-transparent'
                      }`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${thread.unreadCount > 0 ? 'bg-[#06B6D4]/10' : 'bg-white/5'}`}>
                            <Icon className={`w-4 h-4 ${thread.unreadCount > 0 ? 'text-[#06B6D4]' : 'text-slate-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-white truncate">{thread.subject}</p>
                            <p className="text-xs text-slate-500 truncate">{getContextLabel(thread)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {thread.status !== 'open' && thread.status !== 'awaiting_team' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                              {getThreadStatusLabel(thread.status)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between ml-10">
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {thread.lastMessage ? thread.lastMessage.content.slice(0, 55) + (thread.lastMessage.content.length > 55 ? '...' : '') : 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-500">{thread.updated_at ? formatMessageTime(thread.updated_at) : ''}</span>
                          {thread.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-[#06B6D4] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{thread.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-1 flex-col min-w-0">
            {activeThread ? (
              <ThreadView
                thread={activeThread}
                messages={messages}
                userId={userId}
                userName={userName}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sending={sending}
                handleSend={handleSend}
                messagesEndRef={messagesEndRef}
                onBack={() => {}}
                isMobile={false}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-white font-medium mb-1">Select a conversation</p>
                  <p className="text-sm text-slate-400">Choose a thread to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeThread && mobileView === 'thread' && (
          <div className="md:hidden fixed inset-0 z-40 bg-[#081321]">
            <ThreadView
              thread={activeThread}
              messages={messages}
              userId={userId}
              userName={userName}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sending={sending}
              handleSend={handleSend}
              messagesEndRef={messagesEndRef}
              onBack={() => { setMobileView('list'); }}
              isMobile={true}
            />
          </div>
        )}

        <AnimatePresence>
          {showNewModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">New Message</h3>
                  <button onClick={() => setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5">
                    <span className="text-lg">&times;</span>
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                    <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="What's this about?"
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['general', 'project', 'website', 'billing'].map(t => (
                        <button key={t} onClick={() => setNewType(t)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                            newType === t ? 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30' : 'bg-white/5 text-slate-400 border border-transparent hover:border-white/10'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {newType === 'project' && projects.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                      <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#06B6D4]/30 transition-all cursor-pointer pr-8">
                        <option value="">Select a project...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Type your message..."
                      rows={4} maxLength={5000}
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all resize-none" />
                  </div>
                  <button onClick={handleCreateThread} disabled={creating || !newSubject.trim() || !newBody.trim()}
                    className="w-full py-2.5 bg-[#22D3EE] text-[#071221] rounded-xl text-sm font-bold hover:bg-[#67E8F9] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap">
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Message</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}

function ThreadView({
  thread, messages, userId, userName, newMessage, setNewMessage, sending, handleSend, messagesEndRef, onBack, isMobile,
}: {
  thread: ThreadWithMeta;
  messages: Message[];
  userId: string;
  userName: string;
  newMessage: string;
  setNewMessage: (v: string) => void;
  sending: boolean;
  handleSend: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  isMobile: boolean;
}) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const statusColor = getThreadStatusColor(thread.status);
  const ContextIcon = (() => {
    switch (thread.thread_type) {
      case 'project': return FolderKanban;
      case 'website': return Globe;
      case 'approval': return CheckCircle;
      case 'content': return FileText;
      case 'billing': return ReceiptText;
      case 'support': return Headphones;
      default: return MessageSquare;
    }
  })();

  return (
    <>
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
        {isMobile && (
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${statusColor}15` }}>
          <ContextIcon className="w-5 h-5" style={{ color: statusColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-white truncate">{thread.subject}</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400 truncate">{getThreadTypeLabel(thread.thread_type)}{thread.projectName ? ` · ${thread.projectName}` : ''}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
              {getThreadStatusLabel(thread.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-white font-medium mb-1">No messages yet</p>
              <p className="text-sm text-slate-400">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_name === userName;
            const showSender = i === 0 || messages[i - 1].sender_name !== msg.sender_name;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'order-1' : ''}`}>
                  {showSender && (
                    <p className={`text-xs font-medium mb-1 px-1 ${isMine ? 'text-right text-[#06B6D4]' : 'text-slate-400'}`}>
                      {isMine ? 'You' : msg.sender_name}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-[#06B6D4] text-white rounded-br-md' : 'bg-white/5 text-slate-200 rounded-bl-md'}`}>
                    {msg.content}
                  </div>
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

      <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
        <AttachmentUploader onAttachmentsChange={setAttachments} maxFiles={3} disabled={sending} />
        <div className="flex items-center gap-3 mt-2">
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/30 transition-all" />
          <button onClick={handleSend} disabled={!newMessage.trim() || sending}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0">
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </>
  );
}
