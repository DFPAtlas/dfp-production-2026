'use client';

import { Lead, LeadStage, LeadState } from '../lib/types';

interface LeadQueueProps {
  leads: Lead[];
  selectedId: string;
  states: Record<string, LeadState>;
  onSelect: (id: string) => void;
  onActivity: (message: string) => void;
}

const stageOrder: LeadStage[] = [
  'New',
  'Researching',
  'Qualified',
  'Response Ready',
  'Proposal',
  'Won',
];

const stageMeta: Record<
  LeadStage,
  { short: string; color: string }
> = {
  New: { short: 'New', color: 'text-amber-400' },
  Researching: { short: 'Research', color: 'text-cyan-400' },
  Qualified: { short: 'Qualified', color: 'text-emerald-400' },
  'Response Ready': { short: 'Response', color: 'text-blue-400' },
  Proposal: { short: 'Proposal', color: 'text-violet-400' },
  Won: { short: 'Won', color: 'text-emerald-300' },
};

function FitDot({ fit }: { fit: Lead['fit'] }) {
  const color =
    fit === 'High'
      ? 'bg-emerald-400'
      : fit === 'Medium'
        ? 'bg-amber-400'
        : 'bg-red-400';
  return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
}

export default function LeadQueue({
  leads,
  selectedId,
  states,
  onSelect,
  onActivity,
}: LeadQueueProps) {
  const counts = stageOrder.map(
    (stage) => leads.filter((l) => states[l.id].stage === stage).length,
  );
  const totalActive = leads.length;

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[280px] lg:shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Lead Queue</h3>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-400">
          {totalActive}
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {stageOrder.map((stage, i) => {
          const count = counts[i];
          const meta = stageMeta[stage];
          const hasLeads = count > 0;
          return (
            <button
              key={stage}
              type="button"
              className={`flex shrink-0 flex-col items-center rounded-lg border px-2 py-1.5 text-center transition ${
                hasLeads
                  ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                  : 'border-white/[0.04] bg-transparent opacity-40'
              }`}
            >
              <span className={`text-[10px] font-semibold ${meta.color}`}>
                {count}
              </span>
              <span className="mt-0.5 text-[9px] text-slate-500">
                {meta.short}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {leads.map((lead) => {
          const state = states[lead.id];
          const isActive = selectedId === lead.id;
          const meta = stageMeta[state.stage];

          return (
            <button
              key={lead.id}
              type="button"
              onClick={() => {
                onSelect(lead.id);
                onActivity(`Selected ${lead.company} from lead queue.`);
              }}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                isActive
                  ? 'border-cyan-500/30 bg-cyan-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-white">
                {lead.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-white">
                    {lead.company}
                  </p>
                  <span className={`shrink-0 text-[9px] font-semibold ${meta.color}`}>
                    {meta.short}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">{lead.sector}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                  <span>{lead.estValue}</span>
                  <span className="flex items-center gap-1">
                    <FitDot fit={lead.fit} />
                    {lead.fit} Fit
                  </span>
                  <span>{lead.score}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onActivity('Viewed all leads in the pipeline.')}
        className="mt-1 w-full rounded-xl border border-white/[0.08] py-2.5 text-center text-xs font-medium text-slate-400 transition hover:border-white/[0.15] hover:text-slate-300"
      >
        View All Leads
      </button>
    </aside>
  );
}