'use client';

import { useRouter } from 'next/navigation';
import { useUatOverview } from '@/hooks/useUatData';
import {
  Bug, FolderKanban, Users, MonitorPlay, MessageSquare, AlertTriangle,
  RefreshCw, Clock, CheckCircle, ServerOff, CalendarClock,
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  filterKey: string;
  tabTarget: string;
}

export default function UatOverviewCards({ onMetricClick }: { onMetricClick?: (tab: string) => void }) {
  const metrics = useUatOverview();
  const router = useRouter();

  const handleClick = (card: MetricCard) => {
    if (onMetricClick) onMetricClick(card.tabTarget);
  };

  const cards: MetricCard[] = [
    { label: 'Active Projects', value: metrics.activeProjects, color: '#06B6D4', icon: <FolderKanban className="w-5 h-5" />, filterKey: 'active', tabTarget: 'projects' },
    { label: 'Recruiting', value: metrics.recruitingProjects, color: '#3B82F6', icon: <Users className="w-5 h-5" />, filterKey: 'recruiting', tabTarget: 'projects' },
    { label: 'Jobs Ready', value: metrics.jobsReadyForAssignment, color: '#10B981', icon: <CheckCircle className="w-5 h-5" />, filterKey: 'ready', tabTarget: 'jobs' },
    { label: 'Active Sessions', value: metrics.activeSessions, color: '#8B5CF6', icon: <MonitorPlay className="w-5 h-5" />, filterKey: 'sessions', tabTarget: 'sessions' },
    { label: 'Awaiting Triage', value: metrics.feedbackAwaitingTriage, color: '#F59E0B', icon: <MessageSquare className="w-5 h-5" />, filterKey: 'triage', tabTarget: 'triage' },
    { label: 'Critical Defects', value: metrics.criticalDefects, color: '#DC2626', icon: <AlertTriangle className="w-5 h-5" />, filterKey: 'critical', tabTarget: 'triage' },
    { label: 'Awaiting Retest', value: metrics.fixesAwaitingRetest, color: '#EC4899', icon: <RefreshCw className="w-5 h-5" />, filterKey: 'retest', tabTarget: 'retests' },
    { label: 'Overdue Retests', value: metrics.overdueRetests, color: '#EF4444', icon: <Clock className="w-5 h-5" />, filterKey: 'overdue', tabTarget: 'retests' },
    { label: 'Awaiting Approval', value: metrics.projectsAwaitingApproval, color: '#06B6D4', icon: <CheckCircle className="w-5 h-5" />, filterKey: 'approval', tabTarget: 'approval' },
    { label: 'Unavailable Envs', value: metrics.unavailableEnvironments, color: '#F97316', icon: <ServerOff className="w-5 h-5" />, filterKey: 'env', tabTarget: 'environments' },
    { label: 'Deadlines (7d)', value: metrics.deadlinesApproaching, color: '#F59E0B', icon: <CalendarClock className="w-5 h-5" />, filterKey: 'deadlines', tabTarget: 'jobs' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => handleClick(card)}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-left hover:border-[rgba(255,255,255,0.14)] hover:bg-white/[0.03] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: card.color, backgroundColor: card.color + '15' }}>
              {card.icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.loading ? '-' : card.value}</p>
          <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{card.label}</p>
        </button>
      ))}
    </div>
  );
}