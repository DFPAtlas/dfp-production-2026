'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from '@/components/motion';

export default function WithdrawApplicationPage() {
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [email, setEmail] = useState('');
  const [applications, setApplications] = useState<{ id: string; vacancy_title: string; submitted_at: string; application_status: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(false);

  const handleFindApplications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }

    setLoading(true);
    setError('');
    setFound(false);

    const { data: apps, error: appsError } = await supabase
      .from('career_applications')
      .select('id, application_status, submitted_at, vacancy_id')
      .eq('candidate_email', email.trim().toLowerCase())
      .not('application_status', 'in', '("Withdrawn","Archived")')
      .order('submitted_at', { ascending: false });

    if (appsError) {
      setError('Unable to look up your applications. Please try again.');
      setLoading(false);
      return;
    }

    if (!apps || apps.length === 0) {
      setError('No active applications found for this email address. Applications may have already been withdrawn or archived.');
      setLoading(false);
      return;
    }

    const vacancyIds = apps.map(a => a.vacancy_id).filter(Boolean);
    const { data: vacs } = await supabase
      .from('careers_vacancies')
      .select('id, title')
      .in('id', vacancyIds);

    const vacMap = new Map((vacs || []).map(v => [v.id, v.title]));

    setApplications(apps.map(a => ({
      id: a.id,
      vacancy_title: vacMap.get(a.vacancy_id || '') || 'Unknown Role',
      submitted_at: a.submitted_at,
      application_status: a.application_status,
    })));

    setFound(true);
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!selectedId) { setError('Please select the application to withdraw.'); return; }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase
      .from('career_applications')
      .update({
        application_status: 'Withdrawn',
        withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedId)
      .eq('candidate_email', email.trim().toLowerCase());

    if (updateError) {
      setError('Unable to withdraw your application. Please contact us for assistance.');
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1D32] to-white pointer-events-none" />
          <div className="relative max-w-2xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer whitespace-nowrap">
                <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
                Back to Careers
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Withdraw an Application</h1>
              <p className="text-sm text-slate-400">Securely withdraw a previously submitted job application.</p>
            </motion.div>
          </div>
        </section>

        <section className="relative -mt-6 pb-20">
          <div className="max-w-2xl mx-auto px-6">
            {step === 'success' ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line w-7 h-7 text-emerald-500 flex items-center justify-center" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Application Withdrawn</h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Your application has been successfully withdrawn. You will no longer receive recruitment communications related to this role.
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  Required records are retained in accordance with our data retention policy. If you have any questions, please contact us.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link href="/careers" className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                    View More Roles
                  </Link>
                  <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white font-medium text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                    Contact Us
                  </Link>
                </div>
              </motion.div>
            ) : step === 'confirm' ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Select Application to Withdraw</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Found {applications.length} active application{applications.length !== 1 ? 's' : ''} for <strong>{email}</strong>. Please select the one you would like to withdraw.
                </p>
                <div className="space-y-3 mb-6">
                  {applications.map(app => (
                    <label
                      key={app.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedId === app.id
                          ? 'border-[#06B6D4] bg-[#06B6D4]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="application"
                        value={app.id}
                        checked={selectedId === app.id}
                        onChange={() => setSelectedId(app.id)}
                        className="mt-0.5 w-4 h-4 text-[#06B6D4] focus:ring-[#06B6D4] cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{app.vacancy_title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted {new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Status: {app.application_status}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || !selectedId}
                    className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Withdrawing...' : 'Withdraw Application'}
                  </button>
                  <button
                    onClick={() => { setStep('form'); setFound(false); setSelectedId(''); setError(''); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <form onSubmit={handleFindApplications} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Find Your Application</h2>
                    <p className="text-sm text-slate-500">
                      Enter the email address you used when applying. We will show your active applications so you can choose which one to withdraw.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Looking up...' : 'Find My Applications'}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    We will only show applications matching the email address you provide. No other application data is exposed. If you need further assistance, please{' '}
                    <Link href="/contact" className="text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">contact us</Link>.
                  </p>
                </form>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}