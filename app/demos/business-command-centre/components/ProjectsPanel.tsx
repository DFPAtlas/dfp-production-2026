'use client';

import { ChevronRight } from 'lucide-react';
import type { Project } from '../lib/types';

interface ProjectsPanelProps {
  projects: Project[];
  selectedId: string;
  onSelect: (id: string) => void;
  onActivity: (message: string) => void;
}

export default function ProjectsPanel({ projects, selectedId, onSelect, onActivity }: ProjectsPanelProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Projects</span>
          <span className="text-[10px] text-slate-500">Workstreams</span>
          <span className="text-[10px] text-slate-500">Milestones</span>
        </div>
        <button
          type="button"
          className="text-[10px] text-cyan-400 transition hover:text-cyan-300"
        >
          View all projects
        </button>
      </div>

      <div className="space-y-1.5">
        {projects.map((project) => {
          const isSelected = selectedId === project.id;
          const isRisk = project.status === 'At Risk';
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                onSelect(project.id);
                onActivity(`Opened ${project.name}`);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                isSelected
                  ? 'border-cyan-500/20 bg-cyan-500/[0.06]'
                  : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.02]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-white">{project.name}</span>
                  <span
                    className={`text-[9px] font-semibold ${
                      isRisk ? 'text-orange-400' : 'text-emerald-400'
                    }`}
                  >
                    {isRisk ? 'At Risk' : 'On Track'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-1 rounded-full transition-all ${isRisk ? 'bg-orange-400' : 'bg-cyan-400'}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{project.progress}%</span>
                </div>
                <p className="mt-1 text-[9px] text-slate-600">
                  {project.progress}% complete · {project.due}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}