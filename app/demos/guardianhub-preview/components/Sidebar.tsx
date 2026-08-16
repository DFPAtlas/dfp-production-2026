'use client';

import type { ViewKey } from '../lib/types';
import { NAV_ITEMS } from '../lib/data';

interface SidebarProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ view, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-white/[0.05] bg-[#080c14] transition-transform duration-300 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-11 items-center gap-2 border-b border-white/[0.05] px-4">
          <span className="font-['Pacifico'] text-sm text-cyan-400">df</span>
          <span className="text-[11px] font-semibold text-white">GuardianHub</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">Operations</p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => { onNavigate(item.key); onCloseMobile(); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  view === item.key
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
                }`}
              >
                <i className={`${item.icon} text-sm w-4 h-4 flex items-center justify-center`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/[0.05] px-3 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-300">System Status</span>
              <span className="text-[9px] text-slate-500">All systems operational</span>
            </div>
          </div>
          <p className="mt-2 text-center text-[9px] text-slate-600">Demo Environment</p>
        </div>
      </aside>
    </>
  );
}