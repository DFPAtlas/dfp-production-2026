'use client';

import type { ViewKey } from '../lib/types';
import { iconMap } from '../lib/data';
import {
  Workflow,
  UsersRound,
  ListChecks,
  CirclePoundSterling,
  Gauge,
  Zap,
  BellRing,
  Repeat,
  Activity,
  AlertTriangle,
  Bookmark,
  Layers,
  Calendar,
  HardHat,
} from 'lucide-react';

interface SidebarProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const commandItems: { key: ViewKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Command Centre', icon: 'Gauge' },
  { key: 'pulse', label: 'Business Pulse', icon: 'Activity' },
  { key: 'attention', label: 'Attention Centre', icon: 'AlertTriangle' },
  { key: 'activity', label: 'Activity Feed', icon: 'Zap' },
];

const operationsItems: { key: ViewKey; label: string; icon: string }[] = [
  { key: 'projects', label: 'Projects', icon: 'Workflow' },
  { key: 'workstreams', label: 'Workstreams', icon: 'Layers' },
  { key: 'milestones', label: 'Milestones', icon: 'Calendar' },
  { key: 'people', label: 'Team Capacity', icon: 'UsersRound' },
  { key: 'resources', label: 'Resources', icon: 'HardHat' },
];

const automations = [
  { label: 'Lead follow-up', icon: Zap },
  { label: 'Invoice reminders', icon: BellRing },
  { label: 'Project alerts', icon: Repeat },
];

export default function Sidebar({ view, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-52 shrink-0 flex-col border-r border-white/[0.05] bg-[#0c101a] lg:flex`}
      >
        <div className="flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15">
            <span className="text-[11px] font-bold text-cyan-400">N</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Northstar</p>
            <div className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              Northstar Co.
              <span className="text-slate-700">·</span>
              <span className="text-slate-600">Operations</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3">
          <p className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Command
          </p>
          <nav className="space-y-0.5">
            {commandItems.map((item) => {
              const Icon = iconMap[item.icon] ?? Gauge;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onNavigate(item.key);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-medium transition ${active ? 'bg-cyan-500/12 text-cyan-300' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-300'}`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1 w-1 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <p className="mt-4 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Operations
          </p>
          <nav className="space-y-0.5">
            {operationsItems.map((item) => {
              const Icon = iconMap[item.icon] ?? Workflow;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onNavigate(item.key);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-medium transition ${active ? 'bg-cyan-500/12 text-cyan-300' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-300'}`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4">
            <p className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Automations
            </p>
            <div className="space-y-0.5">
              {automations.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] text-slate-500"
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">
              EL
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white truncate">Executive User</p>
              <p className="text-[10px] text-slate-500">Operations Director</p>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-slate-600">Digital Footprint Demo</p>
        </div>
      </aside>
    </>
  );
}