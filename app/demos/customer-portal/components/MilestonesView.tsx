'use client';

import { useState } from 'react';
import { Check, Clock, ChevronRight } from 'lucide-react';
import { Milestone, ApprovalDecision } from '../lib/types';

interface MilestonesViewProps {
  milestones: Milestone[];
  decision: ApprovalDecision;
  onActivity: (msg: string) => void;
}

export default function MilestonesView({
  milestones,
  decision,
  onActivity,
}: MilestonesViewProps) {
  const [selectedId, setSelectedId] = useState('review');
  const selected = milestones.find((m) => m.id === selectedId) ?? milestones[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <h2 className="text-xl font-semibold text-[#1a2332]">Project Milestones</h2>
        <p className="mt-1 text-sm text-[#6b7b8e]">
          Follow the project journey without chasing updates.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const isSelected = selectedId === milestone.id;
            const number = String(index + 1).padStart(2, '0');
            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => {
                  setSelectedId(milestone.id);
                  onActivity(`Opened milestone: ${milestone.title}.`);
                }}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-[#3b82f6]/30 bg-[#eff6ff]'
                    : 'border-[#e8e5df] bg-white hover:border-[#3b82f6]/20'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  milestone.status === 'Complete'
                    ? 'bg-[#10b981] text-white'
                    : milestone.status === 'Current'
                      ? 'border-2 border-[#3b82f6] bg-white text-[#3b82f6]'
                      : 'border-2 border-[#e8e5df] bg-white text-[#8a8a8a]'
                }`}>
                  {milestone.status === 'Complete' ? <Check className="h-5 w-5" /> : number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a2332]">{milestone.title}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      milestone.status === 'Complete'
                        ? 'bg-[#10b981]/10 text-[#059669]'
                        : milestone.status === 'Current'
                          ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                          : 'bg-[#e8e5df] text-[#8a8a8a]'
                    }`}>
                      {milestone.status === 'Complete' ? 'Complete' : milestone.status === 'Current' ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#8a8a8a]">{milestone.date}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#e8e5df]" />
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
                Milestone Detail
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a2332]">{selected.title}</h3>
              <p className="mt-1 text-xs text-[#8a8a8a]">{selected.date}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              selected.status === 'Complete'
                ? 'bg-[#10b981]/10 text-[#059669]'
                : selected.status === 'Current'
                  ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                  : 'bg-[#e8e5df] text-[#8a8a8a]'
            }`}>
              {selected.status}
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#6b7b8e]">{selected.description}</p>

          <div className="mt-5 rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-4">
            <p className="text-xs font-semibold text-[#1a2332]">What happens next</p>
            <p className="mt-2 text-xs leading-5 text-[#6b7b8e]">
              {selected.status === 'Complete'
                ? 'This milestone is complete and its approved outputs are stored in the project files area.'
                : selected.status === 'Current'
                  ? decision === 'approved'
                    ? 'Client approval received. The launch phase will begin automatically.'
                    : 'Client approval unlocks the final launch phase and release preparation.'
                  : 'This phase begins automatically after the previous milestone has been completed.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}