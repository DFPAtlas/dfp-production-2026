'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PoundSterling,
  User,
  Workflow,
} from 'lucide-react';
import type { Project } from '../../lib/types';

interface ProjectsViewProps {
  projects: Project[];
  onActivity: (message: string) => void;
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'on-track', label: 'On track' },
  { key: 'attention', label: 'Attention' },
];

function StatusPill({ status }: { status: Project['status'] }) {
  const classes =
    status === 'On Track'
      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
      : status === 'At Risk'
        ? 'bg-orange-500/10 text-orange-400 ring-orange-500/20'
        : 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${classes}`}
    >
      {status === 'At Risk' && (
        <AlertTriangle className="mr-1 h-2.5 w-2.5" />
      )}
      {status}
    </span>
  );
}

export default function ProjectsView({
  projects,
  onActivity,
}: ProjectsViewProps) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('orion');

  const filtered = projects.filter(
    (p) =>
      filter === 'all' ||
      (filter === 'on-track'
        ? p.status === 'On Track'
        : p.status !== 'On Track'),
  );
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Projects</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Active delivery</p>
          </div>
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${filter === f.key ? 'bg-cyan-500 text-slate-950' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                setSelectedId(project.id);
                onActivity(`Opened ${project.name}`);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${selectedId === project.id ? 'border-cyan-500/20 bg-cyan-500/[0.06]' : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10'}`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">{project.name}</span>
                  <StatusPill status={project.status} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{project.client} · {project.owner}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                    <div
                      className="h-1 rounded-full bg-cyan-400 transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{project.progress}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-400">Project Detail</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{selected.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{selected.client}</p>
            </div>
            <StatusPill status={selected.status} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Progress</p>
              <p className="mt-1 text-lg font-semibold text-white">{selected.progress}%</p>
              <div className="mt-1 h-1 rounded-full bg-white/[0.06]">
                <div className="h-1 rounded-full bg-cyan-400" style={{ width: `${selected.progress}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Budget</p>
              <p className="mt-1 text-lg font-semibold text-white">{selected.budget}</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Owner</p>
              <div className="mt-1 flex items-center gap-1.5">
                <User className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-300">{selected.owner}</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-slate-500">Deadline</p>
              <div className="mt-1 flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-300">{selected.due}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="text-[10px] text-slate-500">Health</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${selected.health === 'At Risk' ? 'bg-orange-400' : selected.health === 'Healthy' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              <span className="text-xs text-slate-300">{selected.health}</span>
            </div>
          </div>

          <div className={`mt-4 rounded-lg border p-4 ${selected.status === 'At Risk' ? 'border-orange-500/15 bg-orange-500/[0.04]' : 'border-cyan-500/15 bg-cyan-500/[0.04]'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white">Next Best Action</p>
            <p className="mt-2 text-sm font-medium text-white">{selected.nextAction}</p>
            <button
              type="button"
              onClick={() => onActivity(`Marked ${selected.nextAction.toLowerCase()} as reviewed`)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              Review Action
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}