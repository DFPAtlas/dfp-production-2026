'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import MailboxPanel from '@/components/uat/portal/MailboxPanel';
import { useMailbox } from '@/hooks/useMailbox';
import { AlertCircle, Ban, ArrowLeft } from 'lucide-react';

export default function TesterMailboxPage({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [testCases, setTestCases] = useState<Array<{ id: string; reference: string; title: string }>>([]);
  const [feedbackItems, setFeedbackItems] = useState<Array<{ id: string; title: string }>>([]);
  const [jobTitle, setJobTitle] = useState('');

  const {
    messages, stats, loading: mailboxLoading, error, refresh,
    linkToTestCase, linkToFeedback, markReviewed,
  } = useMailbox(assignmentId, testerId);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId, testerId]);

  const loadAssignment = async () => {
    setLoading(true);
    const { data: assign } = await supabase.from('uat_assignments')
      .select('id, status, access_expires_at, job_id')
      .eq('id', assignmentId).eq('tester_id', testerId).maybeSingle();

    if (!assign) { setNotFound(true); setLoading(false); return; }

    const aData = assign as any;
    if (aData.status === 'cancelled' || aData.status === 'expired') {
      setBlocked(true); setBlockedMessage('This assignment has been cancelled or expired.');
      setLoading(false); return;
    }
    if (aData.access_expires_at && new Date(aData.access_expires_at) < new Date() && aData.status !== 'submitted') {
      setBlocked(true); setBlockedMessage('This test access has expired.');
      setLoading(false); return;
    }

    if (aData.job_id) {
      const { data: job } = await supabase.from('uat_jobs').select('title').eq('id', aData.job_id).maybeSingle();
      if (job) setJobTitle((job as any).title || '');
    }

    const { data: atcs } = await supabase.from('uat_assignment_test_cases')
      .select('id, test_case_id, status')
      .eq('assignment_id', assignmentId)
      .eq('tester_id', testerId);

    if (atcs && atcs.length > 0) {
      const tcIds = atcs.map((a: any) => a.test_case_id);
      const { data: tcs } = await supabase.from('uat_test_cases').select('id, reference, title').in('id', tcIds);
      const tcMap: Record<string, any> = {};
      tcs?.forEach((tc: any) => { tcMap[tc.id] = tc; });
      setTestCases(atcs.map((atc: any) => ({
        id: atc.id,
        reference: tcMap[atc.test_case_id]?.reference || 'N/A',
        title: tcMap[atc.test_case_id]?.title || 'Untitled',
      })));
    }

    const { data: feedbacks } = await supabase.from('uat_feedback')
      .select('id, title')
      .eq('assignment_id', assignmentId)
      .eq('tester_id', testerId)
      .order('created_at', { ascending: false });

    setFeedbackItems((feedbacks || []).map((f: any) => ({ id: f.id, title: f.title || 'Untitled' })));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading mailbox...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Mailbox' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Assignment Not Available</h3>
            <p className="text-slate-500 mb-6">This mailbox does not exist or does not belong to you.</p>
            <button onClick={() => router.push('/uat/my-tests')} className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to My Tests</button>
          </div>
        </div>
      </>
    );
  }

  if (blocked) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Mailbox' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Ban className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Access Revoked</h3>
            <p className="text-slate-500 mb-6">{blockedMessage}</p>
            <button onClick={() => router.push('/uat/my-tests')} className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to My Tests</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UATPortalBreadcrumbs items={[
        { label: 'My Tests', href: '/uat/my-tests' },
        { label: jobTitle || 'Test', href: `/uat/my-tests/${assignmentId}` },
        { label: 'Mailbox' },
      ]} />

      <div className="mt-6">
        <MailboxPanel
          assignmentId={assignmentId}
          messages={messages}
          stats={stats}
          loading={mailboxLoading}
          error={error}
          onRefresh={refresh}
          onLinkToTestCase={linkToTestCase}
          onLinkToFeedback={linkToFeedback}
          onMarkReviewed={markReviewed}
          testCases={testCases}
          feedbackItems={feedbackItems}
        />
      </div>
    </>
  );
}