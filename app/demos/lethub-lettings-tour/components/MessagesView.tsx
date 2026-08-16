'use client';

import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  isManager: boolean;
}

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'Emma Clarke',
    recipient: 'Property Manager',
    subject: 'Boiler issue',
    body: 'The heating pressure keeps dropping. I have to repressurise it every few days. Can someone take a look?',
    timestamp: 'Today · 09:14',
    isManager: false,
  },
  {
    id: 'msg-2',
    sender: 'Property Manager',
    recipient: 'Emma Clarke',
    subject: 'Re: Boiler issue',
    body: 'Hi Emma, we have assigned RapidHeat Services to attend today at 15:30. They will check the boiler and expansion vessel.',
    timestamp: 'Today · 14:42',
    isManager: true,
  },
  {
    id: 'msg-3',
    sender: 'Sophie Walsh',
    recipient: 'Property Manager',
    subject: 'Kitchen tap',
    body: 'The kitchen mixer tap is dripping constantly. It is getting worse.',
    timestamp: 'Yesterday · 16:30',
    isManager: false,
  },
];

export default function MessagesView() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const sendReply = () => {
    if (!replyingTo || !replyText.trim()) return;
    const parent = messages.find((m) => m.id === replyingTo);
    if (!parent) return;
    const newMsg: Message = {
      id: `msg-${messages.length + 1}`,
      sender: 'Property Manager',
      recipient: parent.sender,
      subject: `Re: ${parent.subject}`,
      body: replyText,
      timestamp: 'Just now',
      isManager: true,
    };
    setMessages([newMsg, ...messages]);
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2332]">Messages</h2>
        <p className="text-sm text-[#8a8a8a]">{messages.length} conversations</p>
      </div>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`rounded-xl border bg-white p-4 ${msg.isManager ? 'border-[#0d9488]/20' : 'border-[#e8e5df]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${msg.isManager ? 'bg-[#1a2332] text-white' : 'bg-[#f0eeea] text-[#1a2332]'}`}>
                {msg.sender.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-medium text-[#1a2332]">{msg.sender}</p>
                <p className="text-[10px] text-[#8a8a8a]">{msg.timestamp}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#1a2332]">{msg.subject}</p>
            <p className="mt-1 text-sm text-[#8a8a8a]">{msg.body}</p>

            {!msg.isManager && replyingTo !== msg.id && (
              <button
                onClick={() => setReplyingTo(msg.id)}
                className="mt-3 rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[11px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
              >
                Reply
              </button>
            )}

            {replyingTo === msg.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${msg.sender}...`}
                  maxLength={500}
                  className="w-full rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3 text-sm text-[#1a2332] outline-none placeholder:text-[#8a8a8a]"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={sendReply}
                    className="rounded-lg bg-[#1a2332] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-[#2a3342] cursor-pointer whitespace-nowrap"
                  >
                    Send Demo Update
                  </button>
                  <button
                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="rounded-lg border border-[#e8e5df] bg-white px-4 py-2 text-[11px] font-medium text-[#1a2332] transition hover:bg-[#f6f5f2] cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[9px] text-[#8a8a8a]">Demo message — not sent externally</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}