'use client';

import { useState } from 'react';
import SparklineChart from '../SparklineChart';
import BusinessPulse from '../BusinessPulse';
import AttentionCentre from '../AttentionCentre';
import ActivityFeed from '../ActivityFeed';
import ProjectsPanel from '../ProjectsPanel';
import ProjectDetailPanel from '../ProjectDetailPanel';
import TeamCapacityBars from '../TeamCapacityBars';
import FinancialOverview from '../FinancialOverview';
import type { MetricCard, ActivityEvent, AttentionItem, Project, TeamCapacity, FinanceMetric } from '../../lib/types';

type ViewKey = 'overview' | 'projects' | 'people' | 'tasks' | 'finance' | 'pulse' | 'attention' | 'activity' | 'workstreams' | 'milestones' | 'resources';

interface OverviewViewProps {
  metrics: MetricCard[];
  attentionItems: AttentionItem[];
  activityEvents: ActivityEvent[];
  projects: Project[];
  teamCapacity: TeamCapacity[];
  financeMetrics: FinanceMetric[];
  onNavigate: (view: ViewKey) => void;
  onActivity: (message: string) => void;
}

export default function OverviewView({
  metrics,
  attentionItems,
  activityEvents,
  projects,
  teamCapacity,
  financeMetrics,
  onNavigate,
  onActivity,
}: OverviewViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('orion');
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  return (
    <div className="space-y-4">
      {/* COMMAND CENTRE Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Command Centre</h2>
          <p className="mt-0.5 text-[10px] text-slate-600">Real-time overview of business performance and operations</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <i className="ri-settings-4-line text-xs"></i>
          Configure
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {metrics.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => {
              onActivity(`Opened ${m.label} from the overview`);
              onNavigate(m.target);
            }}
            className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-3 text-left transition hover:border-cyan-500/15"
          >
            <p className="text-[10px] text-slate-500">{m.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white">{m.value}</span>
              <span className={`text-[10px] font-medium ${m.changePositive ? 'text-emerald-400' : 'text-orange-400'}`}>
                {m.change}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-slate-600">{m.vsPrior}</p>
            <div className="mt-2">
              <SparklineChart data={m.sparkline} width={120} height={28} />
            </div>
          </button>
        ))}
      </div>

      {/* Second Row: Pulse + Attention + Activity */}
      <div className="grid grid-cols-[1fr_1.2fr_0.9fr] gap-4">
        <BusinessPulse />
        <AttentionCentre items={attentionItems} onNavigate={onNavigate} onActivity={onActivity} />
        <ActivityFeed events={activityEvents.slice(0, 5)} />
      </div>

      {/* Third Row: Projects + Detail + Capacity */}
      <div className="grid grid-cols-[0.9fr_1.3fr_0.9fr] gap-4">
        <ProjectsPanel
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
          onActivity={onActivity}
        />
        <ProjectDetailPanel project={selectedProject} onActivity={onActivity} />
        <TeamCapacityBars capacities={teamCapacity} onNavigate={() => onNavigate('people')} />
      </div>

      {/* Bottom: Financial Overview */}
      <FinancialOverview metrics={financeMetrics} />
    </div>
  );
}