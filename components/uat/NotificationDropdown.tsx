'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Briefcase, FileText, ClipboardCheck, X, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import type { Notification } from '@/hooks/useRealtimeNotifications';

interface NotificationDropdownProps {
  unreadCount: number;
  notifications: Notification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

const iconMap: Record<string, typeof Briefcase> = {
  new_job: Briefcase,
  application_update: FileText,
  assignment_update: ClipboardCheck,
};

const colorMap: Record<string, string> = {
  new_job: 'bg-sky-100 text-[#2878d0]',
  application_update: 'bg-violet-100 text-[#7C3AED]',
  assignment_update: 'bg-emerald-100 text-[#10B981]',
};

export default function NotificationDropdown({
  unreadCount, notifications, markAllRead, markRead, clearAll,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (d: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-[#17325c] hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2878d0] text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-[#17325c]">Notifications</p>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">Updates appear here in real time</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type] || Briefcase;
                const colorClass = colorMap[n.type] || 'bg-slate-100 text-slate-500';
                return (
                  <Link
                    key={n.id}
                    href={n.link || '#'}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-sky-50/50' : ''}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#17325c] truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.timestamp)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2878d0]" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}