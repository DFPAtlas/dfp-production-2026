import Link from 'next/link';

export default function DifferentProject() {
  return (
    <section className="relative px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,0.03),transparent_50%)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">Different Type of Project</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Don&apos;t see your industry?
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Good. We don&apos;t only build from templates.
        </p>
        <p className="mt-3 max-w-2xl mx-auto text-base leading-7 text-slate-400">
          Digital Footprint can design a platform around a process, problem or business idea that does not exist anywhere else in the Experience Centre.
        </p>

        <Link
          href="/contact"
          prefetch={false}
          className="mt-8 inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Tell Us What You&apos;re Building
          <i className="ri-arrow-right-line" />
        </Link>
      </div>
    </section>
  );
}