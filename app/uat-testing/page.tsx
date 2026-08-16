'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ApplicationForm from './ApplicationForm';
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Home,
  Info,
  LockKeyhole,
  MessageCircle,
  MonitorSmartphone,
  Search,
  SearchCheck,
  ShieldCheck,
  Trophy,
  UserRound,
  WalletCards,
  FileText,
} from 'lucide-react';

const benefits = [
  { icon: Home, title: 'Work remotely', copy: 'Complete tests from home using devices you already own.' },
  { icon: CalendarDays, title: 'Flexible around family life', copy: 'Choose suitable assignments without fixed working hours.' },
  { icon: UserRound, title: 'No technical experience needed', copy: 'Clear instructions guide you through each test.' },
  { icon: MessageCircle, title: 'Earn from useful bug reports', copy: 'Valid, original and reproducible reports can earn rewards.' },
  { icon: Heart, title: 'Improve real products', copy: 'Your feedback helps make websites and software easier to use.' },
];

const steps = [
  { icon: UserRound, number: '1', title: 'Apply to join', copy: 'Tell us about your devices, experience and availability.' },
  { icon: ShieldCheck, number: '2', title: 'Complete onboarding', copy: 'Review the tester rules and learn how to report clearly.' },
  { icon: Search, number: '3', title: 'Test and find bugs', copy: 'Follow the test plan and submit evidence for genuine issues.' },
  { icon: Trophy, number: '4', title: 'Get rewarded', copy: 'Approved work and qualifying bugs are added to your balance.' },
];

const rewards = [
  { level: 'Minor', amount: '£2–£5', note: 'Small visual, wording or usability issue', className: 'text-sky-600' },
  { level: 'Medium', amount: '£5–£15', note: 'A feature or form does not work correctly', className: 'text-emerald-700' },
  { level: 'Major', amount: '£15–£40', note: 'An important task cannot be completed', className: 'text-amber-600' },
  { level: 'Critical', amount: 'Reviewed individually', note: 'Payment, security, account or data issue', className: 'text-rose-600' },
];

const TOTAL_STEPS = 9;

interface SavedDraft {
  step: number;
  data?: { legalName?: string; email?: string };
}

export default function UATTestingPage() {
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('uat_application_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.step === 'number') {
          setSavedDraft({ step: parsed.step, data: parsed.data });
        }
      }
    } catch {}
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />

      <section className="relative overflow-hidden bg-white pt-28 lg:pt-32">
        <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-[#dce8d4]/60 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20">
          <div className="relative z-10">
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#17325c] sm:text-6xl lg:text-7xl">
              Parents <span className="text-[#8ca579]">Make</span><br />Brilliant Testers
            </h1>
            <div className="mt-5 h-1.5 w-52 rounded-full bg-sky-400/70" />
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              Test websites, apps and online services from home. Find genuine bugs, share useful feedback and earn rewards for accepted reports.
            </p>

            {savedDraft && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#17325c]">You have a saved application</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      You reached step {savedDraft.step} of {TOTAL_STEPS}{savedDraft.data?.legalName ? ` as ${savedDraft.data.legalName.split(' ')[0]}` : ''}. Pick up right where you left off.
                    </p>
                    <Link
                      href="/uat-testing/apply"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
                    >
                      Continue your application <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className={`${savedDraft ? 'mt-4' : 'mt-9'} flex flex-col gap-3 sm:flex-row`}>
              <Link href="/uat-testing/apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2878d0] px-6 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#1e68b9] whitespace-nowrap cursor-pointer">
                {savedDraft ? 'Start a New Application' : 'Apply to Become a Tester'} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#payments" className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300 bg-white px-6 py-4 font-semibold text-[#2878d0] transition hover:bg-sky-50 whitespace-nowrap cursor-pointer">
                <Info className="h-4 w-4" /> How Payments Work
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm"><Home className="h-5 w-5 text-[#2878d0]" /> Remote</div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm"><CalendarDays className="h-5 w-5 text-[#2878d0]" /> Flexible</div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm"><UserRound className="h-5 w-5 text-[#2878d0]" /> No technical experience needed</div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-[#f2f6ee] shadow-[0_30px_80px_rgba(37,72,112,0.14)]">
            <img
              src="https://readdy.ai/api/search-image?query=bright%20airy%20realistic%20lifestyle%20photo%20of%20a%20smiling%20British%20mother%20in%20a%20soft%20sage%20green%20jumper%20working%20on%20a%20silver%20laptop%20at%20a%20light%20wooden%20kitchen%20table%20with%20a%20ceramic%20mug%20smartphone%20and%20small%20houseplant%20warm%20natural%20daylight%20clean%20white%20home%20interior%20professional%20family%20friendly%20advertising%20photography&width=1000&height=850&seq=dfp-uat-parent&orientation=landscape"
              alt="Parent completing a DFP user testing assignment from home"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div><p className="font-semibold text-[#17325c]">Find bugs. Improve products.</p><p className="mt-1 text-sm text-slate-600">Earn rewards for clear, valid reports.</p></div>
                <div className="rounded-full bg-[#e7f0df] p-3"><WalletCards className="h-6 w-6 text-[#6f8d5c]" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-[#f8fafc] py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.22em] text-[#789265]">Why join DFP UAT?</p><h2 className="mt-3 font-serif text-4xl font-semibold text-[#17325c]">Flexible testing with real impact</h2></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {benefits.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${index % 3 === 0 ? 'bg-sky-100' : index % 3 === 1 ? 'bg-[#e8f0e1]' : 'bg-amber-100'}`}><Icon className="h-6 w-6 text-[#17325c]" /></div>
                <h3 className="mt-5 font-semibold text-[#17325c]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">How it works</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17325c]">Start testing in four simple steps</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, number, title, copy }) => (
              <article key={title} className="relative rounded-2xl border border-slate-100 bg-[#fbfcff] p-5">
                <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#2878d0] text-xs font-bold text-white">{number}</span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"><Icon className="h-7 w-7 text-[#2878d0]" /></div>
                <h3 className="mt-5 font-semibold text-[#17325c]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </article>
            ))}
          </div>

          <div id="payments" className="mt-12 rounded-3xl border border-slate-100 bg-[#fbfcff] p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.22em] text-[#789265]">How payments work</p><h2 className="mt-2 font-serif text-3xl font-semibold text-[#17325c]">Clear rewards for accepted bugs</h2></div><WalletCards className="h-10 w-10 text-[#789265]" /></div>
            <p className="mt-4 max-w-3xl text-slate-600">Rewards are paid for valid, original and reproducible bugs. Duplicate reports, known issues and reports without enough evidence may not qualify. Final severity and reward decisions are made during DFP review.</p>
            <div className="mt-7 grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
              {rewards.map((reward) => <div key={reward.level} className="border-b border-slate-200 p-5 last:border-0 sm:border-r lg:border-b-0"><p className={`font-bold ${reward.className}`}>{reward.level}</p><p className="mt-3 text-xl font-bold text-[#17325c]">{reward.amount}</p><p className="mt-2 text-xs leading-5 text-slate-500">{reward.note}</p></div>)}
            </div>
          </div>

          <div className="mt-12 grid items-center gap-6 rounded-3xl bg-[#17325c] p-7 text-white lg:grid-cols-[1fr_auto] lg:p-10">
            <div><div className="flex items-center gap-3"><MonitorSmartphone className="h-7 w-7 text-sky-300" /><p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-200">Start testing today</p></div><h2 className="mt-3 font-serif text-3xl font-semibold">Ready to become a DFP UAT Tester?</h2><p className="mt-3 max-w-3xl text-slate-300">Apply now — no sign-in needed. Fill in your details and we will review your application.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/uat-testing/apply" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-semibold text-[#17325c] transition hover:bg-sky-50 whitespace-nowrap cursor-pointer">Start My Application <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/uat-testing/track" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/20 whitespace-nowrap cursor-pointer">Track Application <SearchCheck className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-slate-100 bg-sky-50 px-6 py-4 text-center text-sm text-slate-600">
        <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#2878d0]" /> Application details are used only for tester recruitment, onboarding and suitable project matching.</span>
      </div>

      <ApplicationForm />
      <Footer />
    </main>
  );
}