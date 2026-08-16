'use client';

import { ChevronRight, User, Calendar, Flag } from 'lucide-react';
import type { Project } from '../lib/types';

interface ProjectDetailPanelProps {
  project: Project;
  onActivity: (message: string) => void;
}

export default function ProjectDetailPanel({ project, onActivity }: ProjectDetailPanelProps) {
  const isRisk = project.status === 'At Risk';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{project.name}</h3>
            {isRisk && (
              <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-orange-400">
                At Risk
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-3">
            {['OVERVIEW', 'PLAN', 'FINANCIALS', 'RISKS', 'RESOURCES', 'DOCUMENTS'].map((tab, i) => (
              <span
                key={tab}
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  i === 0 ? 'text-cyan-400' : 'text-slate-600'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="text-slate-600 hover:text-white">
          <i className="ri-more-2-fill text-sm"></i>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
          <p className="text-[10px] text-slate-500">Progress</p>
          <p className="mt-1 text-xl font-semibold text-white">{project.progress}%</p>
          <p className="mt-0.5 text-[9px] text-slate-600">Non-Complete</p>
          <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
            <div
              className={`h-1 rounded-full ${isRisk ? 'bg-orange-400' : 'bg-cyan-400'}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
          <p className="text-[10px] text-slate-500">Schedule</p>
          <div className="mt-2 h-16">
            <svg width="100%" height="100%" viewBox="0 0 100 40">
              <path d="M0,35 Q25,30 50,20 T100,10" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.4" />
              <path d="M0,38 Q25,32 50,22 T100,15" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
              <circle cx="50" cy="22" r="2" fill="#22d3ee" />
            </svg>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-600">
            <span>Baseline</span>
            <span>Actual</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
          <p className="text-[10px] text-slate-500">Budget</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-semibold text-white">$1.76M</span>
            <span className="text-[9px] text-slate-600">spent</span>
          </div>
          <p className="text-[9px] text-slate-600">Total budget {project.budget}</p>
          <div className="mt-2 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20 * 0.71} ${2 * Math.PI * 20 * 0.29}`}
                strokeDashoffset={-Math.PI * 20 * 0.5}
                transform="rotate(-90 24 24)"
              />
              <text x="24" y="25" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">
                71%
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <div>
            <p className="text-[9px] text-slate-500">Project Owner</p>
            <p className="text-[11px] font-medium text-slate-300">{project.owner}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <div>
            <p className="text-[9px] text-slate-500">Sponsor</p>
            <p className="text-[11px] font-medium text-slate-300">{project.sponsor}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
          <Flag className="h-3.5 w-3.5 text-slate-500" />
          <div>
            <p className="text-[9px] text-slate-500">Priority</p>
            <p className="text-[11px] font-medium text-slate-300">{project.priority}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isRisk ? 'bg-orange-400' : 'bg-emerald-400'}`} />
          <span className="text-[11px] text-slate-300">{isRisk ? 'At Risk' : 'On Track'}</span>
        </div>
        <span className="text-[9px] text-slate-600">Last Updated {project.lastUpdated}</span>
      </div>
    </div>
  );
}