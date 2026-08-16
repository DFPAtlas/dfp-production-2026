'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  Search, Send, Loader2, MessageSquare, User,
  RefreshCw, ArrowUpRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StaffShell from '../../../components/staff/StaffShell';



interface Message {
  id: string;
  project_id: number;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  project_name?: string;
}

export default function StaffMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      await fetchData();
    }
    init();
  }, [router]);

  const fetchData = async () => {
    const [messagesRes, projectsRes] = await Promise.all([
      supabase.from('project_messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('projects').select('id, name, client_id'),
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);

    if (messagesRes.data) {
      const enriched = messagesRes.data.map(m => ({
        ...m,
        project_name: projectsRes.data?.find(p => String(p.id) === String(m.project_id))?.name || 'Unknown',
      }));
      setMessages(enriched);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProject) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const senderName = session?.user?.user_metadata?.full_name || 'Staff';

    const { error } = await supabase.from('project_messages').insert({
      project_id: selectedProject,
      sender_name: senderName,
      content: newMessage.trim(),
      read: false,
    });

    if (!error) {
      setMessages(prev => [{
        id: crypto.randomUUID(),
        project_id: selectedProject,
        sender_name: senderName,
        content: newMessage.trim(),
        read: false,
        created_at: new Date().toISOString(),
        project_name: projects.find(p => p.id === selectedProject)?.name || 'Unknown',
      }, ...prev]);
      setNewMessage('');
    }
    setSending(false);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (loading) {
    return (
      <StaffShell>
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" /></div>
      </StaffShell>
    );
  }

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-sm text-slate-400 mt-0.5">{unreadCount} unread messages across all projects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-5">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search messages..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 transition-all" />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-slate-400 font-medium mb-2">Reply to Project</label>
                <select value={selectedProject || ''} onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredMessages.length > 0 ? filteredMessages.slice(0, 15).map(msg => (
                  <button key={msg.id} onClick={() => setSelectedProject(msg.project_id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${selectedProject === msg.project_id ? 'bg-[#06B6D4]/5 border border-[#06B6D4]/10' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-300">{msg.sender_name}</span>
                      {!msg.read && <span className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{msg.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{msg.project_name} · {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </button>
                )) : (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No messages</p>
                  </div>
                )}
              </div>

              <button onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6">
              {selectedProject ? (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                    <div>
                      <h3 className="font-bold text-white">{projects.find(p => p.id === selectedProject)?.name || 'Project'}</h3>
                      <p className="text-xs text-slate-400">Send a message to the client</p>
                    </div>
                    <Link href={`/staff/projects/${selectedProject}`}
                      className="flex items-center gap-1 text-xs text-[#06B6D4] hover:underline cursor-pointer">
                      View Project <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                    {messages.filter(m => m.project_id === selectedProject).map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_name !== 'Staff' && !msg.sender_name.includes('Staff') ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender_name !== 'Staff' ? 'bg-white/5 text-slate-200 rounded-bl-md' : 'bg-[#06B6D4] text-white rounded-br-md'}`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-[10px] mt-1 opacity-60">{msg.sender_name} · {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                    {messages.filter(m => m.project_id === selectedProject).length === 0 && (
                      <div className="text-center py-10 text-slate-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No messages in this conversation yet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4] transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                    <button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}
                      className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Select a Project</h3>
                  <p className="text-sm text-slate-400">Choose a project from the left to view and send messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}