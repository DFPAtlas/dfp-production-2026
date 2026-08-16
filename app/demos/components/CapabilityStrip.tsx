import { capabilityLabels } from '../lib/data';

export default function CapabilityStrip() {
  return (
    <section className="relative px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(251,146,60,0.03),transparent_50%)]" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          What We Can Connect
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {capabilityLabels.map((label) => (
            <span
              key={label}
              className="whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              {label}
            </span>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          These experiences can be combined. Your system doesn&apos;t need to look like one of them — it can draw from several.
        </p>
      </div>
    </section>
  );
}