'use client';

import { useState } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import { NotificationItem } from '../lib/types';

interface PortalHeaderProps {
  progress: number;
  decision: string;
  nextMilestone: string;
  notifications: NotificationItem[];
  onMessagePM: () => void;
}

export default function PortalHeader({
  progress,
  decision,
  nextMilestone,
  notifications,
  onMessagePM,
}: PortalHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="border-b border-[#e8e5df] bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a2332] text-sm font-bold text-white">
            A
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#1a2332]">Aster & Co.</h1>
            <p className="text-xs text-[#8a8a8a]">Website Transformation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#8a8a8a] transition hover:bg-[#f6f5f2] hover:text-[#1a2332]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f97316] text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-[#e8e5df] bg-white p-3 shadow-xl">
                <p className="px-2 text-xs font-semibold text-[#1a2332]">Notifications</p>
                <div className="mt-2 space-y-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg px-2 py-2 text-xs ${n.read ? 'text-[#8a8a8a]' : 'bg-[#eff6ff] font-medium text-[#1a2332]'}`}
                    >
                      <p>{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-[#8a8a8a]">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-medium text-[#1a2332]">Amelia Hart</p>
              <p className="text-[10px] text-[#8a8a8a]">Project Manager</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]/10 text-xs font-semibold text-[#3b82f6]">
              AH
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#e8e5df] bg-[#fafaf8] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
            Project Status
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#059669]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            On Track
          </span>
        </div>

        <span className="hidden h-4 w-px bg-[#e8e5df] sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#1a2332]">{progress}%</span>
          <span className="text-[10px] text-[#8a8a8a]">Complete</span>
        </div>

        <span className="hidden h-4 w-px bg-[#e8e5df] sm:block" />

        <div className="flex items-center gap-2 text-[11px] text-[#8a8a8a]">
          <i className="ri-calendar-line text-sm"></i>
          <span>Target launch: 28 August</span>
        </div>

        <span className="hidden h-4 w-px bg-[#e8e5df] sm:block" />

        <div className="flex items-center gap-2 text-[11px] text-[#8a8a8a]">
          <i className="ri-flag-line text-sm"></i>
          <span>Next: {nextMilestone}</span>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={onMessagePM}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#3b82f6] transition hover:bg-[#3b82f6]/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Need help? Message Amelia
          </button>
        </div>
      </div>
    </div>
  );
}