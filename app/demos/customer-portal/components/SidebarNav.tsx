import {
  LayoutDashboard,
  Workflow,
  FileCheck2,
  MessageSquareText,
  FolderOpen,
  CirclePoundSterling,
} from 'lucide-react';
import { ViewKey } from '../lib/types';

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'milestones', label: 'Milestones', icon: Workflow },
  { key: 'approvals', label: 'Approvals', icon: FileCheck2 },
  { key: 'messages', label: 'Messages', icon: MessageSquareText },
  { key: 'files', label: 'Files', icon: FolderOpen },
  { key: 'billing', label: 'Payments', icon: CirclePoundSterling },
];

interface SidebarNavProps {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  progress: number;
  nextApproval: string;
  decision: string;
}

export default function SidebarNav({
  activeView,
  onSelect,
  progress,
  nextApproval,
  decision,
}: SidebarNavProps) {
  return (
    <aside className="w-full shrink-0 border-b border-[#e8e5df] bg-white lg:w-60 lg:border-b-0 lg:border-r">
      <nav className="p-3">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = activeView === key;
          const needsAttention = key === 'approvals' && decision === 'pending';
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                isActive
                  ? 'bg-[#1a2332] text-white'
                  : 'text-[#6b7b8e] hover:bg-[#f6f5f2] hover:text-[#1a2332]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {needsAttention && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[8px] font-bold text-white">
                  1
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8a8a]">
          Your Project
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a8a8a]">Schedule</span>
            <span className="font-medium text-[#059669]">On Track</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a8a8a]">Budget</span>
            <span className="font-medium text-[#059669]">On Track</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8a8a8a]">Approvals</span>
            <span className={`font-medium ${decision === 'pending' ? 'text-[#f59e0b]' : 'text-[#059669]'}`}>
              {decision === 'pending' ? '1 Required' : 'All Clear'}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-[#e8e5df]">
            <div
              className="h-1.5 rounded-full bg-[#3b82f6] transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[#8a8a8a]">{progress}% complete</p>
        </div>
      </div>
    </aside>
  );
}