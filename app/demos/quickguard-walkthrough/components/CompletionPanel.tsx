import type { DemoJob } from '../lib/types';

interface CompletionPanelProps {
  job: DemoJob;
  onApprove: () => void;
  onMarkPaid: () => void;
}

export default function CompletionPanel({ job, onApprove, onMarkPaid }: CompletionPanelProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
            <i className="ri-check-double-line text-emerald-400 text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Shift Completed</h2>
            <p className="text-sm text-slate-400">Security team has marked the job complete</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-5">
          <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="text-[10px] text-slate-500">Marcus Reed</p>
            <p className="text-sm font-medium text-white">{job.hours}h completed</p>
          </div>
          <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
            <p className="text-[10px] text-slate-500">Aisha Khan</p>
            <p className="text-sm font-medium text-white">{job.hours}h completed</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <i className="ri-file-list-3-line text-slate-500"></i>
            Activity log available for review
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-thumb-up-line"></i>
            Confirm Completion
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] cursor-not-allowed opacity-60 whitespace-nowrap"
          >
            <i className="ri-error-warning-line"></i>
            Report an Issue
          </button>
        </div>
      </div>
    </div>
  );
}