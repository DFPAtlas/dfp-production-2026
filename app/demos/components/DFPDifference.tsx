export default function DFPDifference() {
  const layers = [
    { label: 'Customer Experience', desc: 'Portals, dashboards, mobile-friendly interfaces your team and clients will use every day.', icon: 'ri-smartphone-line' },
    { label: 'Business Logic', desc: 'Workflows, approvals, matching, scheduling — the rules that make your business run.', icon: 'ri-settings-3-line' },
    { label: 'Automation', desc: 'AI assistance, scheduled jobs, notifications and repetitive task handling without manual work.', icon: 'ri-robot-2-line' },
    { label: 'Data', desc: 'Structured storage, real-time sync, reporting and analytics built around your business model.', icon: 'ri-database-2-line' },
    { label: 'Integrations', desc: 'Connect to email, payments, calendars, CRMs, messaging platforms and your existing tools.', icon: 'ri-link' },
    { label: 'Operations', desc: 'Monitoring, backups, security, access control — the foundation that keeps everything running.', icon: 'ri-shield-check-line' },
  ];

  return (
    <section className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(34,211,238,0.04),transparent_55%)]" />

      <div className="relative mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">The DFP Difference</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            We don&apos;t just build the front end.
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            We design the experience and the systems behind it.
          </p>
        </div>

        <div className="space-y-6">
          {layers.map((layer, i) => (
            <div key={layer.label} className="group flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 group-hover:text-white transition-colors">
                <i className={`${layer.icon} text-base`} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{layer.label}</h3>
                <p className="mt-0.5 text-sm text-slate-400">{layer.desc}</p>
              </div>
              {i < layers.length - 1 && (
                <div className="hidden sm:flex items-center ml-auto">
                  <i className="ri-arrow-down-line text-slate-700 text-sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}