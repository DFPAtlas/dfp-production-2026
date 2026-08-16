'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getSessionSafe } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  UAT_TERMS_TITLE,
  UAT_TERMS_VERSION,
  UAT_TERMS_EFFECTIVE_DATE,
  UAT_TERMS_INTRO,
  UAT_TERMS_SECTIONS,
  UAT_FINAL_DECLARATIONS,
  UAT_TERMS_READING_TIME,
  UAT_TOTAL_SECTIONS,
  getTermsContentHash,
  TERMS_CONTENT_JSON,
} from '@/lib/uat-terms-content';
import { ChevronRight, AlertTriangle, CheckCircle2, Clock3, FileText, Loader2, ArrowLeft } from 'lucide-react';

function ErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <p className="text-sm font-bold text-red-700">
          {errors.length} {errors.length === 1 ? 'issue' : 'issues'} need{errors.length === 1 ? 's' : ''} attention
        </p>
      </div>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((e, i) => (
          <li key={i} className="text-xs text-red-600">{e}</li>
        ))}
      </ul>
    </div>
  );
}

export default function UATTesterTermsPage() {
  const router = useRouter();
  const [sectionChecked, setSectionChecked] = useState<boolean[]>(new Array(UAT_TOTAL_SECTIONS).fill(false));
  const [declarationChecked, setDeclarationChecked] = useState<boolean[]>(new Array(UAT_FINAL_DECLARATIONS.length).fill(false));
  const [legalName, setLegalName] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [termsVersionId, setTermsVersionId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  const sectionCount = sectionChecked.filter(Boolean).length;

  useEffect(() => {
    const init = async () => {
      const session = await getSessionSafe();
      if (!session) {
        setSessionChecked(true);
        setPageLoading(false);
        return;
      }
      setUserEmail(session.user.email || '');
      setSessionChecked(true);

      const { data: version } = await supabase
        .from('uat_terms_versions')
        .select('id')
        .eq('is_active', true)
        .eq('version', UAT_TERMS_VERSION)
        .maybeSingle();

      if (version) {
        setTermsVersionId(version.id);
      } else {
        setTermsVersionId('pending-seed');
      }

      const { data: existing } = await supabase
        .from('uat_terms_acceptances')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('terms_version_id', version?.id || '')
        .maybeSingle();

      if (existing) {
        setTimeout(() => router.replace('/uat-testing/terms/complete'), 0);
        return;
      }

      setPageLoading(false);
    };
    init();
  }, [router]);

  const validateAll = useCallback((): string[] => {
    const errs: string[] = [];
    for (let i = 0; i < UAT_TOTAL_SECTIONS; i++) {
      if (!sectionChecked[i]) errs.push(`Section ${i + 1} checkbox is required`);
    }
    for (let i = 0; i < UAT_FINAL_DECLARATIONS.length; i++) {
      if (!declarationChecked[i]) errs.push(`Declaration ${i + 1} is required`);
    }
    if (!legalName.trim()) errs.push('Legal name is required');
    if (!typedSignature.trim()) errs.push('Typed signature is required');
    if (typedSignature.trim().toLowerCase() !== legalName.trim().toLowerCase()) {
      errs.push('Typed signature must match legal name (case-insensitive)');
    }
    if (!signatureConfirmed) errs.push('You must confirm this is your typed signature');
    return errs;
  }, [sectionChecked, declarationChecked, legalName, typedSignature, signatureConfirmed]);

  const handleSubmit = async () => {
    const errs = validateAll();
    setErrors(errs);
    if (errs.length > 0) return;
    setShowConfirmModal(true);
  };

  const doSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setServerError('');

    try {
      const session = await getSessionSafe();
      if (!session) {
        setServerError('Session expired. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      const contentHash = getTermsContentHash();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uat-terms-accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            termsVersionId: termsVersionId,
            legalName: legalName.trim(),
            typedSignature: typedSignature.trim(),
            sectionAcceptances: UAT_TERMS_SECTIONS.map((s, i) => ({
              sectionId: s.id,
              confirmed: sectionChecked[i],
            })),
            declarationAcceptances: UAT_FINAL_DECLARATIONS.map((d, i) => ({
              declaration: d,
              confirmed: declarationChecked[i],
            })),
            contentHash,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyAccepted) {
          setTimeout(() => router.replace('/uat-testing/terms/complete'), 0);
          return;
        }
        setServerError(data.error || data.detail || 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }

      router.replace('/uat-testing/terms/complete');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#fbfcff] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#2878d0] animate-spin" />
      </main>
    );
  }

  if (sessionChecked && !userEmail) {
    return (
      <main className="min-h-screen bg-[#fbfcff]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <FileText className="h-16 w-16 text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Sign in Required</h1>
          <p className="text-slate-500 mb-6 max-w-md">You need to be signed in to accept the UAT tester terms.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 font-semibold text-white hover:bg-[#1e68b9] transition">
            Sign In <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/uat-testing" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2878d0] transition">
            <ArrowLeft className="h-4 w-4" /> Back to UAT
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#789265] mb-2">Legal Agreement</p>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-[#17325c] md:text-4xl">
                {UAT_TERMS_TITLE}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Version {UAT_TERMS_VERSION}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Clock3 className="h-3.5 w-3.5" /> {UAT_TERMS_READING_TIME} read
                </span>
                <span className="text-xs">Effective: {new Date(UAT_TERMS_EFFECTIVE_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-8">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Access remains locked until every section, declaration and signature is completed.
              </p>
            </div>

            <ErrorSummary errors={errors} />

            <div className="prose prose-slate max-w-none mb-8 mt-6">
              <p className="text-slate-600 leading-relaxed text-sm">{UAT_TERMS_INTRO}</p>
            </div>

            <div className="space-y-4" id="sections">
              {UAT_TERMS_SECTIONS.map((section, idx) => (
                <div
                  key={section.id}
                  id={`section-${section.id}`}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-slate-200"
                >
                  <h2 className="font-serif text-lg font-semibold text-[#17325c] mb-3">{section.title}</h2>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                  <label className="mt-4 flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-3 transition hover:bg-sky-50">
                    <input
                      type="checkbox"
                      checked={sectionChecked[idx]}
                      onChange={(e) => {
                        const next = [...sectionChecked];
                        next[idx] = e.target.checked;
                        setSectionChecked(next);
                        setErrors([]);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{section.checkboxLabel}</span>
                  </label>
                </div>
              ))}
            </div>

            <div id="declarations" className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-serif text-xl font-semibold text-[#17325c] mb-4">Final Declarations</h2>
              <p className="text-sm text-slate-500 mb-5">Please confirm each declaration below.</p>
              <div className="space-y-3">
                {UAT_FINAL_DECLARATIONS.map((decl, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-3 transition hover:bg-sky-50">
                    <input
                      type="checkbox"
                      checked={declarationChecked[idx]}
                      onChange={(e) => {
                        const next = [...declarationChecked];
                        next[idx] = e.target.checked;
                        setDeclarationChecked(next);
                        setErrors([]);
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{decl}</span>
                  </label>
                ))}
              </div>
            </div>

            <div id="signature" className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-serif text-xl font-semibold text-[#17325c] mb-4">Electronic Signature</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="legal-name" className="block text-sm font-medium text-slate-600 mb-1.5">Full Legal Name *</label>
                  <input
                    id="legal-name"
                    type="text"
                    value={legalName}
                    onChange={(e) => { setLegalName(e.target.value); setErrors([]); }}
                    placeholder="e.g. Jane Elizabeth Smith"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition"
                  />
                </div>
                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium text-slate-600 mb-1.5">Account Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={userEmail}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="typed-sig" className="block text-sm font-medium text-slate-600 mb-1.5">Type Your Full Name as Electronic Signature *</label>
                  <input
                    id="typed-sig"
                    type="text"
                    value={typedSignature}
                    onChange={(e) => { setTypedSignature(e.target.value); setErrors([]); }}
                    placeholder="Type your full legal name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition font-['Pacifico'] text-lg"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer rounded-lg bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={signatureConfirmed}
                    onChange={(e) => { setSignatureConfirmed(e.target.checked); setErrors([]); }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">I confirm this typed signature is mine</span>
                </label>
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>Accepted at: {new Date().toUTCString()} (UTC) &mdash; Version {UAT_TERMS_VERSION}</span>
                </div>
              </div>
            </div>

            {serverError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-8 w-full rounded-xl bg-[#2878d0] py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#1e68b9] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                'Accept, Sign and Generate PDF'
              )}
            </button>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-4">Progress</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500">Sections confirmed</span>
                    <span className="font-bold text-[#2878d0]">{sectionCount} of {UAT_TOTAL_SECTIONS}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2878d0] to-[#789265] transition-all duration-400"
                      style={{ width: `${(sectionCount / UAT_TOTAL_SECTIONS) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <ProgressItem label="Sections read" done={sectionCount === UAT_TOTAL_SECTIONS} />
                  <ProgressItem label="Declarations accepted" done={declarationChecked.every(Boolean)} />
                  <ProgressItem label="Legal name entered" done={legalName.trim().length > 0} />
                  <ProgressItem label="Signature matches" done={typedSignature.trim().toLowerCase() === legalName.trim().toLowerCase() && legalName.trim().length > 0} />
                  <ProgressItem label="Signature confirmed" done={signatureConfirmed} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-5 w-full rounded-xl bg-[#2878d0] py-3 text-sm font-bold text-white hover:bg-[#1e68b9] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Sign Agreement'}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-serif text-lg font-semibold text-[#17325c] mb-3">Jump to Section</h3>
                <nav className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
                  {UAT_TERMS_SECTIONS.map((s) => (
                    <a
                      key={s.id}
                      href={`#section-${s.id}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-sky-50 hover:text-[#2878d0] transition"
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${sectionChecked[s.id - 1] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {sectionChecked[s.id - 1] ? <CheckCircle2 className="h-3 w-3" /> : s.id}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </a>
                  ))}
                  <a href="#declarations" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-sky-50 hover:text-[#2878d0] transition">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-400">D</span>
                    Declarations
                  </a>
                  <a href="#signature" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-sky-50 hover:text-[#2878d0] transition">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-400">S</span>
                    Signature
                  </a>
                </nav>
              </div>
            </div>
          </aside>

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{sectionCount}/{UAT_TOTAL_SECTIONS} sections</span>
              <span className="text-xs font-medium text-slate-500">{declarationChecked.filter(Boolean).length}/{UAT_FINAL_DECLARATIONS.length} declarations</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-[#2878d0] py-3 text-sm font-bold text-white hover:bg-[#1e68b9] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : 'Sign Agreement'}
            </button>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-semibold text-[#17325c] mb-3">Confirm Your Acceptance</h3>
            <p className="text-sm text-slate-600 mb-2">You are about to sign a legally binding agreement.</p>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1 mb-5">
              <p><strong>Name:</strong> {legalName.trim()}</p>
              <p><strong>Email:</strong> {userEmail}</p>
              <p><strong>Version:</strong> {UAT_TERMS_VERSION}</p>
              <p><strong>Sections:</strong> {sectionCount}/{UAT_TOTAL_SECTIONS} confirmed</p>
              <p><strong>Declarations:</strong> {declarationChecked.filter(Boolean).length}/{UAT_FINAL_DECLARATIONS.length} confirmed</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition whitespace-nowrap"
              >
                Go Back
              </button>
              <button
                onClick={doSubmit}
                className="flex-1 rounded-xl bg-[#2878d0] py-3 text-sm font-bold text-white hover:bg-[#1e68b9] transition whitespace-nowrap"
              >
                I Agree &amp; Sign
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function ProgressItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0 ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
        {done ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[10px]">-</span>}
      </span>
      <span className={done ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
    </div>
  );
}