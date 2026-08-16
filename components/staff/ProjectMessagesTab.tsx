'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string | null;
  message: string | null;
  read: boolean;
  is_internal: boolean;
  created_at: string;
  sender_full_name?: string;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
}

export default function ProjectMessagesTab({
  messages,
  loading,
  error,
  projectId,
  currentUserId,
  currentUserName,
  staffList,
  onRefresh,
  onRetry,
}: {
  messages: Message[];
  loading: boolean;
  error: string | null;
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  staffList: StaffInfo[];
  onRefresh: () => void;
  onRetry: () => void;
}) {
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || sending) return;
    if (text.length > 5000) { setSendError('Message too long (max 5000 characters)'); return; }

    setSending(true);
    setSendError('');

    const { data: inserted, error: insertErr } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        content: text,
        message: text,
        is_internal: false,
        read: false,
      })
      .select('id, sender_id, sender_name, content, message, read, is_internal, created_at')
      .single();

    if (!insertErr && inserted) {
      setNewMsg('');
      onRefresh();
    } else {
      setSendError(insertErr?.message || 'Failed to send message');
    }
    setSending(false);
  };

  const isOwnMessage = (msg: Message): boolean => {
    if (msg.sender_id && msg.sender_id === currentUserId) return true;
    const senderStaff = staffList.find(s => s.id === msg.sender_id);
    if (senderStaff?.id === currentUserId) return true;
    return false;
  };

  const getSenderName = (msg: Message): string => {
    if (msg.sender_full_name) return msg.sender_full_name;
    if (msg.sender_name) return msg.sender_name;
    const sender = staffList.find(s => s.id === msg.sender_id);
    if (sender?.full_name) return sender.full_name;
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-16 bg-white/5 rounded-2xl ${i % 2 === 0 ? 'w-3/5 rounded-bl-md' : 'w-2/5 rounded-br-md'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load messages</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
      <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 min-h-[200px]">
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-16">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
            </div>
          </div>
        ) : (
          sortedMessages.map(msg => {
            const own = isOwnMessage(msg);
            const displayContent = msg.content || msg.message || '';
            return (
              <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  own
                    ? 'bg-[#06B6D4] text-white rounded-br-md'
                    : 'bg-white/5 text-slate-200 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
                  <p className={`text-[10px] mt-1.5 ${own ? 'opacity-70' : 'opacity-50'}`}>
                    {own ? 'You' : getSenderName(msg)}
                    {' · '}
                    {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <textarea
          value={newMsg}
          onChange={(e) => { setNewMsg(e.target.value); setSendError(''); }}
          placeholder="Type a message..."
          rows={2}
          maxLength={5000}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center gap-2 self-end"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
      {sendError && (
        <p className="text-xs text-[#EF4444] mt-2">{sendError}</p>
      )}
    </div>
  );
}