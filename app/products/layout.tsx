import Link from 'next/link';
import type { ReactNode } from 'react';

export default function ProductsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <section className="border-t border-slate-200 bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">DFP Demo Lab</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
              Try the type of software we build.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Explore three safe, interactive examples covering business operations, AI-assisted sales and a customer project portal. No registration and no real customer data.
            </p>
          </div>
          <Link
            href="/demos"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Open Demo Lab
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
