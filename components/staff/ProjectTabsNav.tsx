'use client';

import { FolderKanban, Target, CheckCircle, MessageSquare, FileText, DollarSign, Map, Activity } from 'lucide-react';

interface Tab {
  key: string;
  label: string;
  icon: React.ElementType;
  count?: number;
}

export default function ProjectTabsNav({
  activeTab,
  onTabChange,
  counts,
  canViewInvoices,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: Record<string, number>;
  canViewInvoices: boolean;
}) {
  const allTabs: Tab[] = [
    { key: 'overview', label: 'Overview', icon: FolderKanban },
    { key: 'milestones', label: 'Milestones', icon: Target, count: counts.milestones },
    { key: 'tasks', label: 'Tasks', icon: CheckCircle, count: counts.tasks },
    { key: 'messages', label: 'Messages', icon: MessageSquare, count: counts.messages },
    { key: 'files', label: 'Files', icon: FileText, count: counts.files },
    { key: 'invoices', label: 'Invoices', icon: DollarSign, count: counts.invoices },
    { key: 'roadmap', label: 'Roadmap', icon: Map, count: counts.roadmap },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const tabs = canViewInvoices ? allTabs : allTabs.filter(t => t.key !== 'invoices');

  return (
    <div className="flex items-center gap-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-1.5 mb-6 overflow-x-auto">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive ? 'bg-[#06B6D4] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}