'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getSessionSafe } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UAT_TERMS_VERSION, UAT_TERMS_TITLE } from '@/lib/uat-terms-content';
import { CheckCircle2, Download, ArrowRight, Clock3, Loader2 } from 'lucide-react';

export default function UATTesterTermsCompletePage() {
  const router = useRouter();
  const [acceptance, setAcceptance] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const session = await getSessionSafe();
      if (!session) { setLoading(false); return; }

      const { data: versions } = await supabase
        .from('uat_terms_versions')
        .select('id')
        .eq('is_active', true)
        .eq('version', UAT_TERMS_VERSION)
        .maybeSingle();

      const { data: acc } = await supabase
        .from('uat_terms_acceptances')
        .select('*')
        .eq('user_id', session.user.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!acc) {
        setTimeout(() => router.replace('/uat-testing/terms'), 0);
        return;
      }

      setAcceptance(acc);

      if (acc.pdf_storage_path) {
        try {
          const { data: signed } = await supabase.storage
            .from('uat-legal-agreements')
            .createSignedUrl(acc.pdf_storage_path, 3600);
          if (signed?.signedUrl) setPdfUrl(signed.signedUrl);
        } catch {}
      }

      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfcff] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#2878d0] animate-spin" />
      </main>
    );
  }

  if (!acceptance) {
    return (
      <main className="min-h-screen bg-[#fbfcff]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
          <Clock3 className="h-16 w-16 text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">No Acceptance Found</h1>
          <p className="text-slate-500 mb-6">You have not yet accepted the current UAT terms.</p>
          <Link href="/uat-testing/terms" className="inline-flex items-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3 font-semibold text-white hover:bg-[#1e68b9] transition">
            Review and Accept Terms <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#17325c]">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="font-serif text-3xl font-semibold text-[#17325c] mb-3">Agreement Accepted</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Thank you. Your signed agreement has been recorded and a PDF copy has been generated for your records.
        </p>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm mb-8">
          <h2 className="font-serif text-lg font-semibold text-[#17325c] mb-4">{UAT_TERMS_TITLE}</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Version</span>
              <span className="font-medium">{acceptance.terms_version_id ? UAT_TERMS_VERSION : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Accepted</span>
              <span className="font-medium">{new Date(acceptance.accepted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Legal Name</span>
              <span className="font-medium">{acceptance.legal_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Email</span>
              <span className="font-medium">{acceptance.tester_email}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Acceptance ID</span>
              <span className="font-medium text-xs font-mono">{acceptance.id}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3.5 font-semibold text-[#17325c] hover:bg-slate-50 transition shadow-sm whitespace-nowrap"
            >
              <Download className="h-4 w-4" /> Download Signed Agreement
            </a>
          )}
          <Link
            href="/uat-testing/portal"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2878d0] px-6 py-3.5 font-semibold text-white hover:bg-[#1e68b9] transition shadow-lg shadow-blue-200 whitespace-nowrap"
          >
            Continue to UAT Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}