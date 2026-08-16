import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative px-6 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(34,211,238,0.07),transparent_50%),radial-gradient(ellipse_at_50%_80%,rgba(251,146,60,0.04),transparent_50%)]" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          You&apos;ve seen our software.
          <br />
          <span className="bg-gradient-to-r from-cyan-200 via-white to-cyan-100 bg-clip-text text-transparent">
            Now let&apos;s design yours.
          </span>
        </h2>
        <p className="mt-6 max-w-xl mx-auto text-lg leading-8 text-slate-400">
          Start with one feature, combine several of these ideas or bring us a completely different problem.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            prefetch={false}
            className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-cyan-300 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Start My Project
            <i className="ri-arrow-right-line transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            Talk Through My Idea
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          No obligation. Start with a conversation.
        </p>
      </div>
    </section>
  );
}