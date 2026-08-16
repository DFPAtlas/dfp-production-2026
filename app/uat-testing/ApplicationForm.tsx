'use client';

import { motion, useInView } from '@/components/motion';
import { ArrowRight, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

export default function ApplicationForm() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="quick-apply" className="relative overflow-hidden bg-white py-24" ref={ref}>
      <div className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-sky-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#dce8d4]/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
            <Zap className="h-7 w-7 text-[#2878d0]" />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-sky-600">Quick Apply</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17325c]">Start your tester application</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-500">
            No sign-in required. Fill in your details through our step-by-step wizard — your progress saves automatically so you can return anytime.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-start gap-6">
            <div className="hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e8f0e1] sm:flex">
              <FileText className="h-8 w-8 text-[#6f8d5c]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#17325c]">What you&apos;ll need</h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0]">1</span>
                  Your legal name, email, and a short intro about yourself
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0]">2</span>
                  A list of the devices and operating systems you can test on
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0]">3</span>
                  Your weekly availability and preferred testing times
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0]">4</span>
                  Your testing interests and relevant experience
                </li>
              </ul>

              <Link
                href="/uat-testing/apply"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2878d0] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#1e68b9] whitespace-nowrap cursor-pointer sm:w-auto"
              >
                Start Application <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-4 text-xs text-slate-400">
                Takes about 10–15 minutes. Your progress is saved as you go.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}