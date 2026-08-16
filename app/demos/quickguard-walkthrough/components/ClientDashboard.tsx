interface ClientDashboardProps {
  onStartJob: () => void;
  greeting: string;
}

export default function ClientDashboard({ onStartJob, greeting }: ClientDashboardProps) {
  return (
    <div id="client-dashboard" className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-blue-400">Hawthorne Events Ltd.</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{greeting}</h1>
        <p className="mt-1 text-sm text-slate-400">What do you need security for?</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onStartJob}
          className="group flex items-center gap-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-4 text-left transition hover:border-blue-500/30 hover:bg-blue-500/[0.10] cursor-pointer"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
            <i className="ri-add-circle-line text-blue-400 text-lg"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Book a Guard</p>
            <p className="text-[11px] text-slate-500">Create a new security request</p>
          </div>
        </button>

        <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 opacity-50 cursor-not-allowed">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
            <i className="ri-briefcase-line text-slate-500 text-lg"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">My Jobs</p>
            <p className="text-[11px] text-slate-600">No active jobs</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 opacity-50 cursor-not-allowed">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
            <i className="ri-message-2-line text-slate-500 text-lg"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Messages</p>
            <p className="text-[11px] text-slate-600">No new messages</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Saved Locations
        </h3>
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <i className="ri-map-pin-line text-blue-400 text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Riverside Conference Centre</p>
            <p className="text-[11px] text-slate-500">Birmingham</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Quick Actions
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: 'ri-file-list-3-line', label: 'View past jobs' },
            { icon: 'ri-bank-card-line', label: 'Payment history' },
            { icon: 'ri-settings-3-line', label: 'Account settings' },
            { icon: 'ri-question-line', label: 'Help centre' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] px-3 py-2.5 text-left text-xs text-slate-500 transition hover:bg-white/[0.03] cursor-not-allowed opacity-60"
            >
              <i className={`${item.icon} text-sm text-slate-600`}></i>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}