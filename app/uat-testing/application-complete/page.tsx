'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getSessionSafe } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight, Loader2, FileText, Search } from 'lucide-react';

export default function ApplicationCompletePage() {
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const stored = sessionStorage.getItem('uat_app_complete');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!cancelled) {
          setAppData({
            legal_name: parsed.name,
            application_reference: parsed.reference,
            submitted_at: parsed.date,
            status: 'submitted',
          });
          setLoading(false);
        }
        return () => { cancelled = true; };
      } catch {}
    }

    const init = async () => {
      const session = await getSessionSafe();
      if (cancelled) return;
      if (!session) { setLoading(false); return; }

      const { data: app } = await supabase
        .from('uat_tester_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!app) {
        const { data: draft } = await supabase
          .from('uat_tester_applications')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'draft')
          .maybeSingle();

        if (cancelled) return;

        if (draft) {
          window.location.href = '/uat-testing/apply';
          return;
        }

        setLoading(false);
        return;
      }

      setAppData(app);
      setLoading(false);
    };
    init();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfcff] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#2878d0] animate-spin" />
      </main>
    );
  }

  if (!appData && !loading) {
    return (
      <main className="min-h-screen bg-[#fbfcff]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <FileText className="h-16 w-16 text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">No Application Found</h1>
          <p className="text-slate-500 mb-6 max-w-md">You have not submitted a UAT tester application yet.</p>
          <Link href="/uat-testing/apply" className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 font-semibold text-white hover:bg-[#1e68b9] transition">
            Start Application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="font-serif text-3xl font-semibold text-[#17325c] mb-3">Your DFP UAT Tester application has been submitted</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Thank you for applying. Your application is now under review. We will get back to you by email.
        </p>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm mb-8">
          <h2 className="font-serif text-lg font-semibold text-[#17325c] mb-4">Application Summary</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Name</span>
              <span className="font-medium">{appData.legal_name || (appData.application_data?.legalName) || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Application Reference</span>
              <span className="font-medium font-mono text-xs">{appData.application_reference}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Submitted</span>
              <span className="font-medium">{appData.submitted_at ? new Date(appData.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-600">Under Review</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm mb-8">
          <h3 className="font-serif text-base font-semibold text-[#17325c] mb-3">What happens next</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0] flex-shrink-0 mt-0.5">1</span>
              <p>Our team will review your application, including your experience, devices and availability.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0] flex-shrink-0 mt-0.5">2</span>
              <p>If your application is approved, you will receive access to the tester dashboard and may be invited to complete onboarding materials.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#2878d0] flex-shrink-0 mt-0.5">3</span>
              <p>Once onboarding is complete, you can browse available test assignments and start testing.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/uat-testing/track?ref=${encodeURIComponent(appData.application_reference)}&email=${encodeURIComponent(appData.email || '')}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2878d0]/30 bg-white px-6 py-3.5 font-semibold text-[#2878d0] hover:bg-sky-50 transition whitespace-nowrap"
          >
            <Search className="h-4 w-4" /> Track Your Application
          </Link>
          <Link
            href="/uat/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3.5 font-semibold text-white hover:bg-[#1e68b9] transition shadow-lg shadow-blue-200 whitespace-nowrap"
          >
            Go to Tester Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}