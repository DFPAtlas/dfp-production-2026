'use client';

import { AlertTriangle, ArrowRight, Check, CheckCircle2, UsersRound } from 'lucide-react';
import type { TeamMember } from '../../lib/types';

interface PeopleViewProps {
  team: TeamMember[];
  relieved: boolean;
  onRelieve: () => void;
  onActivity: (message: string) => void;
}

export default function PeopleView({
  team,
  relieved,
  onRelieve,
  onActivity,
}: PeopleViewProps) {
  const avgUtil = Math.round(
    team.reduce((sum, m) => sum + m.capacity, 0) / team.length,
  );
  const warnings = team.filter((m) => m.capacity > 90).length;
  const balanced = team.filter((m) => m.capacity >= 70 && m.capacity <= 90).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Team Capacity</h2>
        <p className="mt-1 text-sm text-slate-400">
          {team.length} team members · {avgUtil}% average utilisation · {warnings > 0 ? `${warnings} workload risk` : 'No risks'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Capacity by person</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">This week&apos;s simulated assignments</p>
            </div>
            <UsersRound className="h-4 w-4 text-cyan-400" />
          </div>

          <div className="space-y-3">
            {team.map((member) => {
              const barColor =
                member.capacity > 90
                  ? '#ef4444'
                  : member.capacity > 75
                    ? '#22d3ee'
                    : '#34d399';

              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => onActivity(`Reviewed ${member.name}'s workload`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 text-left transition hover:border-cyan-500/15"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-[11px] font-semibold text-cyan-400">
                    {member.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{member.name}</span>
                      <span
                        className={`text-[10px] font-semibold ${member.status === 'Over capacity' ? 'text-orange-400' : member.status === 'Available' ? 'text-emerald-400' : 'text-cyan-400'}`}
                      >
                        {member.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">{member.role} · {member.projects} projects · {member.department}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${member.capacity}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{member.capacity}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${relieved ? 'border-emerald-500/15 bg-emerald-500/[0.04]' : 'border-orange-500/15 bg-orange-500/[0.04]'}`}>
            <div className="flex items-center gap-2.5">
              {relieved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-white">{relieved ? 'Workload balanced' : 'Capacity warning'}</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {relieved
                    ? 'Chris is now below the risk threshold'
                    : 'Chris has reached 94% capacity across five projects'}
                </p>
              </div>
            </div>

            {!relieved && (
              <button
                type="button"
                onClick={() => {
                  onRelieve();
                  onActivity('Reassigned one task from Chris to Sophie');
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Reassign one task
              </button>
            )}

            {relieved && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/10 px-3 py-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">Workload balanced successfully</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
            <h3 className="text-sm font-semibold text-white">Capacity Summary</h3>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Available capacity</dt>
                <dd className="font-medium text-emerald-400">{relieved ? '24%' : '18%'}</dd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Balanced members</dt>
                <dd className="font-medium text-slate-300">{balanced}</dd>
              </div>
              <div className="flex items-center justify-between text-xs">
                <dt className="text-slate-500">Workload warnings</dt>
                <dd className={warnings === 0 ? 'font-medium text-emerald-400' : 'font-medium text-orange-400'}>{warnings}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}