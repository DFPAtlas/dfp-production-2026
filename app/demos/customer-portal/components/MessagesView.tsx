'use client';

import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { PortalMessage } from '../lib/types';

interface MessagesViewProps {
  messages: PortalMessage[];
  onMessagesChange: (msgs: PortalMessage[]) => void;
  onActivity: (msg: string) => void;
  team: Array<{ name: string; role: string; initials: string }>;
}

export default function MessagesView({
  messages,
  onMessagesChange,
  onActivity,
  team,
}: MessagesViewProps) {
  const [draft, setDraft] = useState('');

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) {
      onActivity('Enter a message before sending.');
      return;
    }
    const newMsg: PortalMessage = {
      id: `client-${Date.now()}`,
      author: 'Daniel Price',
      role: 'Client',
      body,
      time: 'Just now',
      client: true,
      avatar: 'DP',
    };
    onMessagesChange([...messages, newMsg]);
    setDraft('');
    onActivity('Message added to project conversation.');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1a2332]">Project Messages</h2>
            <p className="mt-1 text-xs text-[#6b7b8e]">
              Everything stays attached to your project.
            </p>
          </div>
        </div>

        <div className="mt-5 max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.client ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`max-w-[88%] rounded-2xl border p-4 ${
                msg.client
                  ? 'border-[#3b82f6]/20 bg-[#eff6ff]'
                  : 'border-[#e8e5df] bg-[#fafaf8]'
              }`}>
                <div className={`flex items-center gap-3 ${msg.client ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    msg.client ? 'bg-[#1a2332] text-white' : 'bg-[#3b82f6]/10 text-[#3b82f6]'
                  }`}>
                    {msg.avatar}
                  </span>
                  <div className={msg.client ? 'text-right' : 'text-left'}>
                    <p className="text-xs font-semibold text-[#1a2332]">{msg.author}</p>
                    <p className="text-[10px] text-[#8a8a8a]">{msg.role}</p>
                  </div>
                </div>
                <p className={`mt-3 text-xs leading-5 text-[#6b7b8e] ${msg.client ? 'text-right' : 'text-left'}`}>
                  {msg.body}
                </p>
                <p className={`mt-2 text-[10px] text-[#8a8a8a] ${msg.client ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#e8e5df] pt-5">
          <p className="mb-2 text-[10px] text-[#8a8a8a]">
            <i className="ri-information-line mr-1"></i>
            Demo message — not sent externally
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={320}
            placeholder="Write a message to your project team..."
            className="w-full resize-none rounded-xl border border-[#e8e5df] bg-[#fafaf8] px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#8a8a8a] focus:border-[#3b82f6]/30 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onActivity('Opened simulated attachment picker.')}
              className="inline-flex items-center gap-1.5 text-[10px] text-[#8a8a8a] transition hover:text-[#3b82f6]"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach file
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#8a8a8a]">{draft.length}/320</span>
              <button
                type="button"
                onClick={sendMessage}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2563eb]"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1a2332]">Your Project Team</h3>
          <div className="mt-4 space-y-2">
            {team.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-3 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]/10 text-xs font-semibold text-[#3b82f6]">
                  {member.initials}
                </span>
                <div>
                  <p className="text-xs font-medium text-[#1a2332]">{member.name}</p>
                  <p className="text-[10px] text-[#8a8a8a]">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#3b82f6]/20 bg-[#eff6ff] p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3b82f6]/10">
            <i className="ri-customer-service-2-line text-lg text-[#3b82f6]"></i>
          </span>
          <p className="mt-3 text-sm font-semibold text-[#1a2332]">Need help?</p>
          <p className="mt-2 text-xs leading-5 text-[#6b7b8e]">
            Your project manager is here to answer questions and keep things moving.
          </p>
          <button
            type="button"
            onClick={() => onActivity('Opened support request flow.')}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#3b82f6]/20 bg-white px-4 py-2.5 text-xs font-medium text-[#3b82f6] transition hover:bg-[#3b82f6]/5"
          >
            <i className="ri-message-3-line text-sm"></i>
            Message Project Manager
          </button>
        </div>
      </div>
    </div>
  );
}