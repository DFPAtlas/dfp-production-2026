'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Search,
  Loader2,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
  UserPlus,
  Rocket,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Hash,
} from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', icon: FileText, description: 'Your application has been received and is in the queue for review.' },
  { key: 'under_review', label: 'Under Review', icon: Eye, description: 'A member of our team is reviewing your application, experience and skills.' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, description: 'Your application has been accepted. You will receive onboarding instructions.' },
  { key: 'rejected', label: 'Not Progressed', icon: XCircle, description: 'Your application was not progressed at this time. This does not prevent future applications.' },
  { key: 'onboarding', label: 'Onboarding', icon: UserPlus, description: 'Complete the onboarding process to start testing.' },
  { key: 'active', label: 'Active Tester', icon: Rocket, description: 'You are an active tester. Browse and accept test assignments.' },
  { key: 'inactive', label: 'Inactive', icon: Clock, description: 'Your tester account is currently inactive. Contact us if you would like to resume.' },
];

function getStageIndex(status: string): number {
  const mapping: Record<string, number> = {
    submitted: 0,
    under_review: 1,
    accepted: 2,
    rejected: 2,
    onboarding: 4,
    active: 5,
    inactive: 6,
  };
  return mapping[status] ?? -1;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TrackApplicationPage() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    const emailParam = params.get('email');
    if (refParam) setReference(refParam);
    if (emailParam) setEmail(emailParam);
    if (refParam && emailParam) {
      doLookup(refParam, emailParam);
    }
  }, []);

  const doLookup = async (ref?: string, em?: string) => {
    const lookupRef = (ref || reference).trim();
    const lookupEmail = (em || email).trim().toLowerCase();

    if (!lookupRef || !lookupEmail) {
      setError('Please enter both your application reference and email address.');
      return;
    }

    setSearching(true);
    setNotFound(false);
    setError('');
    setAppData(null);

    const { data, error: dbError } = await supabase
      .rpc('get_uat_application_status', { p_reference: lookupRef, p_email: lookupEmail });

    if (dbError) {
      setError('Something went wrong while looking up your application. Please try again.');
      setSearching(false);
      return;
    }

    const result = data as { found?: boolean } | null;
    if (!result || !result.found) {
      setNotFound(true);
      setSearching(false);
      return;
    }

    setAppData(result);
    setSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup();
  };

  const stageIndex = appData ? getStageIndex(appData.status) : -1;
  const isRejected = appData?.status === 'rejected';

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/uat-testing" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2878d0] transition">
            <ArrowLeft className="h-4 w-4" /> Back to UAT TestLab
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#789265] mb-2">Application Tracker</p>
          <h1 className="font-serif text-3xl font-semibold text-[#17325c]">Check Your Application Status</h1>
          <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">Enter your application reference and email to see where your application is in the review pipeline.</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Application Reference</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="DFP-UAT-APP-2026-123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition font-mono"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searching}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#1e68b9] transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto justify-center"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {searching ? 'Looking up...' : 'Check Status'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-[#17325c] mb-2">No Application Found</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                We could not find an application matching the reference and email you entered. Please double-check both and try again.
              </p>
              <Link
                href="/uat-testing/apply"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e68b9] transition"
              >
                Start a New Application
              </Link>
            </motion.div>
          )}

          {appData && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Application</p>
                  <span className="font-mono text-xs text-slate-400">{appData.application_reference}</span>
                </div>
                <h2 className="font-serif text-xl font-semibold text-[#17325c]">{appData.legal_name}</h2>
                <p className="text-sm text-slate-500">{appData.email}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Submitted {formatDate(appData.submitted_at)}</span>
                  {appData.reviewed_at && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Reviewed {formatDate(appData.reviewed_at)}</span>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-5">Review Pipeline</h3>

                <div className="relative">
                  <div className="hidden sm:block absolute top-5 left-[calc(7.14%+8px)] right-[calc(7.14%+8px)] h-0.5 bg-slate-200" />

                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const isCurrent = stage.key === appData.status;
                      const isPast = !isRejected ? i < stageIndex : (i < stageIndex || (i === stageIndex && stage.key === 'rejected'));
                      const isRejectedStage = stage.key === 'rejected';

                      let bgClass = 'bg-slate-50 border-slate-200';
                      let iconClass = 'text-slate-400';
                      if (isCurrent && !isRejectedStage) {
                        bgClass = 'bg-[#2878d0]/5 border-[#2878d0]/30';
                        iconClass = 'text-[#2878d0]';
                      } else if (isCurrent && isRejectedStage) {
                        bgClass = 'bg-rose-50 border-rose-200';
                        iconClass = 'text-rose-500';
                      } else if (isPast) {
                        bgClass = 'bg-emerald-50 border-emerald-200';
                        iconClass = 'text-emerald-600';
                      }

                      const IconComponent = isPast ? CheckCircle2 : (isCurrent && isRejectedStage ? XCircle : stage.icon);

                      return (
                        <div key={stage.key} className={`relative flex flex-col items-center text-center rounded-xl border p-3 transition-all ${bgClass}`}>
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isPast ? 'bg-emerald-100' : isCurrent && isRejectedStage ? 'bg-rose-100' : 'bg-slate-100'}`}>
                            <IconComponent className={`h-4.5 w-4.5 ${iconClass}`} />
                          </div>
                          <p className={`mt-2 text-[11px] font-bold leading-tight ${isCurrent ? 'text-[#17325c]' : 'text-slate-500'}`}>{stage.label}</p>
                          {isCurrent && (
                            <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${isRejectedStage ? 'bg-rose-100 text-rose-600' : 'bg-[#2878d0]/10 text-[#2878d0]'}`}>
                              Current
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {stageIndex >= 0 && (
                  <div className={`mt-5 rounded-xl p-4 ${isRejected ? 'bg-rose-50 border border-rose-100' : 'bg-sky-50 border border-sky-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${isRejected ? 'bg-rose-100' : 'bg-sky-100'}`}>
                        {isRejected ? <XCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-[#2878d0]" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isRejected ? 'text-rose-700' : 'text-[#17325c]'}`}>
                          {PIPELINE_STAGES[isRejected ? 3 : stageIndex]?.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {PIPELINE_STAGES[isRejected ? 3 : stageIndex]?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {appData.admin_notes && (
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#2878d0]" /> Notes from the Team
                  </h3>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{appData.admin_notes}</p>
                    {appData.reviewed_at && (
                      <p className="text-xs text-slate-400 mt-3">{formatDate(appData.reviewed_at)}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-4">Application Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailRow label="Name" value={appData.legal_name} />
                  <DetailRow label="Email" value={appData.email} />
                  <DetailRow label="Location" value={[appData.town_city, appData.county, appData.country].filter(Boolean).join(', ')} />
                  <DetailRow label="Experience Level" value={appData.experience_level} />
                  <DetailRow label="Devices" value={Array.isArray(appData.devices) ? appData.devices.join(', ') : '—'} />
                  <DetailRow label="Availability" value={appData.availability_hours} />
                  <DetailRow label="Reference" value={appData.application_reference} mono />
                  <DetailRow label="Last Updated" value={formatDate(appData.updated_at)} />
                </div>
              </div>

              <div className="text-center pb-6">
                <p className="text-xs text-slate-400">
                  Questions about your application?{' '}
                  <Link href="/contact" className="text-[#2878d0] hover:underline font-medium">Contact us</Link>
                  {' '}and quote your reference number.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!appData && !notFound && !searching && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 mb-4">
              <FileText className="h-8 w-8 text-[#2878d0]" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-[#17325c] mb-2">Haven't Applied Yet?</h2>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Join our tester community and earn rewards for finding bugs and providing useful feedback on websites and applications.
            </p>
            <Link
              href="/uat-testing/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e68b9] transition"
            >
              Apply to Become a Tester
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</span>
    </div>
  );
}