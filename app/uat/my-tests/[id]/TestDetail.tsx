'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, Ban, ArrowLeft, Flag, X, Mail, MessageSquare, Webhook, ArrowLeftRight } from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import TestCasePanel from '@/components/uat/portal/TestCasePanel';
import TestCaseDetailPanel from '@/components/uat/portal/TestCaseDetailPanel';
import SessionPanel from '@/components/uat/portal/SessionPanel';
import MonitoringCard from '@/components/uat/portal/UATMonitoringCard';
import UATSandboxCard from '@/components/uat/portal/UATSandboxCard';
import { useUATMonitorStatus } from '@/hooks/useUATMonitorStatus';
import { useMailbox } from '@/hooks/useMailbox';
import { checkWorkerHealth } from '@/lib/uat-sandbox/worker/sandbox-service';
import type { UATMonitor } from '@/lib/uat-monitor/client';

interface AssignmentSummary {
  id: string;
  status: string;
  access_expires_at: string | null;
  job_title: string;
  project_name: string | null;
  deadline: string | null;
}

interface AssignedTestCase {
  id: string;
  test_case_id: string;
  reference: string;
  title: string;
  priority: string;
  status: string;
}

export default function TestDetail({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [assignment, setAssignment] = useState<AssignmentSummary | null>(null);
  const [testCases, setTestCases] = useState<AssignedTestCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<'cases' | 'detail' | 'session'>('cases');
  const [monitorStatus, setMonitorStatus] = useState<any>(null);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [checkpointNote, setCheckpointNote] = useState('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [environmentUrl, setEnvironmentUrl] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState<string | null>(null);
  const [sandboxHealth, setSandboxHealth] = useState<string | null>(null);
  const [sandboxExpires, setSandboxExpires] = useState<string | null>(null);
  const [sandboxResetCount, setSandboxResetCount] = useState(0);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [sandboxAccountCount, setSandboxAccountCount] = useState(0);
  const [workerOnline, setWorkerOnline] = useState(false);
  const monitorRef = useRef<UATMonitor | null>(null);

  const {
    stats: mailboxStats,
    refresh: refreshMailbox,
  } = useMailbox(assignmentId, testerId);

  const handleOpenMailbox = () => {
    router.push(`/uat/my-tests/${assignmentId}/mailbox`);
  };

  const monitorStatusState = useUATMonitorStatus(monitorRef, () => {});

  useEffect(() => { loadData(); }, [assignmentId, testerId, refreshKey]);

  const loadData = async () => {
    setLoading(true);
    const { data: assign } = await supabase.from('uat_assignments')
      .select('id, status, access_expires_at, job_id')
      .eq('id', assignmentId).eq('tester_id', testerId).maybeSingle();

    if (!assign) { setNotFound(true); setLoading(false); return; }

    const aData = assign as any;

    if (aData.status === 'cancelled' || aData.status === 'expired') {
      setBlocked(true); setBlockedMessage('This test assignment has been cancelled or has expired.');
      setLoading(false); return;
    }

    if (aData.access_expires_at && new Date(aData.access_expires_at) < new Date() && aData.status !== 'submitted') {
      setBlocked(true); setBlockedMessage('This test access has expired.');
      setLoading(false); return;
    }

    let projectName: string | null = null;
    let jobTitle = '';
    let deadline: string | null = null;

    if (aData.job_id) {
      const { data: job } = await supabase.from('uat_jobs').select('title, project_id, deadline').eq('id', aData.job_id).maybeSingle();
      if (job) {
        jobTitle = (job as any).title || '';
        deadline = (job as any).deadline || null;
        if ((job as any).project_id) {
          const { data: proj } = await supabase.from('uat_projects').select('name').eq('id', (job as any).project_id).maybeSingle();
          if (proj) projectName = (proj as any).name || null;
        }
      }
    }

    setAssignment({
      id: aData.id,
      status: aData.status,
      access_expires_at: aData.access_expires_at,
      job_title: jobTitle,
      project_name: projectName,
      deadline: deadline,
    });

    const { data: atcs } = await supabase.from('uat_assignment_test_cases')
      .select('id, test_case_id, status, sort_order')
      .eq('assignment_id', assignmentId)
      .eq('tester_id', testerId)
      .order('sort_order', { ascending: true });

    if (atcs && atcs.length > 0) {
      const tcIds = atcs.map((a: any) => a.test_case_id);
      const { data: tcs } = await supabase.from('uat_test_cases').select('id, reference, title, priority').in('id', tcIds);
      const tcMap: Record<string, any> = {};
      tcs?.forEach((tc: any) => { tcMap[tc.id] = tc; });

      const built: AssignedTestCase[] = atcs.map((atc: any) => ({
        id: atc.id,
        test_case_id: atc.test_case_id,
        reference: tcMap[atc.test_case_id]?.reference || 'N/A',
        title: tcMap[atc.test_case_id]?.title || tcMap[atc.test_case_id]?.reference || 'Untitled',
        priority: tcMap[atc.test_case_id]?.priority || 'medium',
        status: atc.status,
      }));
      setTestCases(built);
      if (!selectedCaseId || !built.find((b) => b.id === selectedCaseId)) {
        setSelectedCaseId(built[0]?.id || null);
      }
    } else {
      setTestCases([]);
    }

    const { data: sess } = await supabase.from('uat_sessions')
      .select('id, status')
      .eq('assignment_id', assignmentId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSessionId((sess as any)?.id || null);
    setSessionStatus((sess as any)?.status || null);

    loadMonitoringSettings(aData);
    loadSandboxData();
    setLoading(false);
  };

  const loadSandboxData = async () => {
    const { data: inst } = await supabase.from('uat_sandbox_instances')
      .select('*').eq('assignment_id', assignmentId).eq('tester_id', testerId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (inst) {
      setSandboxStatus((inst as any).status);
      setSandboxMode((inst as any).sandbox_mode);
      setSandboxHealth((inst as any).health_status);
      setSandboxExpires((inst as any).expires_at);
      setSandboxResetCount((inst as any).reset_count || 0);
      setSandboxUrl((inst as any).sandbox_url);

      const { count } = await supabase.from('uat_sandbox_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('sandbox_instance_id', (inst as any).id).neq('status', 'disabled');
      setSandboxAccountCount(count || 0);
    }

    const workerState = await checkWorkerHealth();
    setWorkerOnline(workerState.workerOnline);
  };

  const loadMonitoringSettings = async (aData: any) => {
    let pid: string | null = null;
    if (aData.job_id) {
      const { data: job } = await supabase.from('uat_jobs').select('project_id, environment_id').eq('id', aData.job_id).maybeSingle();
      pid = (job as any)?.project_id || null;
      if (pid) setProjectId(pid);
      if ((job as any)?.environment_id) {
        const { data: env } = await supabase.from('uat_environments').select('base_url').eq('id', (job as any).environment_id).maybeSingle();
        if (env) setEnvironmentUrl((env as any).base_url || null);
      }
    }
    if (!pid) return;

    const { data: settings } = await supabase.from('uat_monitoring_settings')
      .select('monitoring_enabled').eq('project_id', pid).maybeSingle();
    if ((settings as any)?.monitoring_enabled) setMonitoringEnabled(true);
  };

  const handleStatusChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSessionChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleReportBug = (atcId: string) => {
    router.push(`/uat/feedback/${assignmentId}?atcId=${atcId}`);
  };

  const handleOpenTestWebsite = () => {
    if (environmentUrl) window.open(environmentUrl, '_blank', 'noopener');
  };

  const handleReconnectMonitoring = async () => {
    if (!monitorRef.current || !sessionId || !projectId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-uat-monitoring-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ assignment_id: assignmentId, session_id: sessionId, origin: window.location.origin }),
    });
    if (!res.ok) return;
    const result = await res.json();
    if (!result.success || !result.token) return;
    monitorRef.current.resume(result.token);
  };

  const handleAddCheckpoint = () => {
    setCheckpointLabel('');
    setCheckpointNote('');
    setShowCheckpoint(true);
  };

  const handleSaveCheckpoint = () => {
    if (!checkpointLabel.trim()) return;
    monitorRef.current?.checkpoint(checkpointLabel.trim(), { note: checkpointNote || undefined });
    setShowCheckpoint(false);
  };

  const handleViewEvents = () => {
    router.push(`/uat/my-tests/${assignmentId}/events`);
  };

  const completedCases = testCases.filter((c) => ['passed', 'failed', 'blocked', 'skipped'].includes(c.status));
  const passedCount = testCases.filter((c) => c.status === 'passed').length;
  const failedCount = testCases.filter((c) => c.status === 'failed').length;
  const blockedCount = testCases.filter((c) => c.status === 'blocked').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading test assignment...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Not Available' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Assignment Not Available</h3>
            <p className="text-slate-500 mb-6">This test assignment does not exist or does not belong to you.</p>
            <button onClick={() => router.push('/uat/my-tests')} className="px-5 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to My Tests</button>
          </div>
        </div>
      </>
    );
  }

  if (blocked) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Access Revoked' }]} />
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

  if (assignment?.status === 'submitted' || assignment?.status === 'completed' || assignment?.status === 'approved') {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: assignment?.job_title || 'Test' }]} />
        <div className="mt-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <i className="ri-check-double-line text-2xl text-emerald-500 w-8 h-8 flex items-center justify-center" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Test Submitted</h3>
            <p className="text-slate-500 mb-6">This assignment has been submitted for review.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => router.push('/uat/my-tests')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">Back to My Tests</button>
              <button onClick={() => router.push(`/uat/feedback/${assignmentId}`)}
                className="px-6 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">View Feedback</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!assignment) return null;

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: assignment.job_title || 'Test' }]} />

      <div className="mt-3 flex items-center gap-2">
        {assignment.project_name && (
          <span className="text-xs font-medium text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-lg">{assignment.project_name}</span>
        )}
        <span className="text-sm font-semibold text-[#17325c]">{assignment.job_title}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
          sessionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
          sessionStatus === 'paused' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {sessionStatus || 'No Session'}
        </span>
      </div>

      {monitoringEnabled && (
        <div className="mt-4 max-w-md">
          <MonitoringCard
            status={monitorStatusState.status}
            lastEventAt={monitorStatusState.lastEventAt}
            currentPage={monitorStatusState.currentPage}
            errorCount={monitorStatusState.errorCount}
            failedRequestCount={monitorStatusState.failedRequestCount}
            slowRequestCount={monitorStatusState.slowRequestCount}
            checkpointCount={monitorStatusState.checkpointCount}
            pageViewCount={monitorStatusState.pageViewCount}
            onOpenTestWebsite={handleOpenTestWebsite}
            onReconnect={handleReconnectMonitoring}
            onAddCheckpoint={handleAddCheckpoint}
            onViewEvents={handleViewEvents}
            sessionActive={sessionStatus === 'active'}
          />
        </div>
      )}

      <div className="mt-4 max-w-md">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#17325c] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#2878d0]" /> Test Mailbox
            </h3>
            <button onClick={refreshMailbox}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#2878d0] transition-colors cursor-pointer">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Emails</p>
              <p className="text-base font-bold text-[#17325c]">{mailboxStats.email}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">SMS</p>
              <p className="text-base font-bold text-[#17325c]">{mailboxStats.sms}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Webhooks</p>
              <p className="text-base font-bold text-[#17325c]">{mailboxStats.webhook}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Blocked</p>
              <p className="text-base font-bold text-[#17325c]">{mailboxStats.blocked}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {mailboxStats.latest && (
              <span className="text-[10px] text-slate-400">
                Latest: {new Date(mailboxStats.latest).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={handleOpenMailbox}
              className="px-3 py-1.5 bg-[#edf5ff] hover:bg-[#dbeafe] rounded-lg text-xs font-semibold text-[#2878d0] cursor-pointer whitespace-nowrap transition-colors">
              Open Test Mailbox
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 max-w-md">
        <UATSandboxCard
          status={sandboxStatus}
          mode={sandboxMode}
          healthStatus={sandboxHealth}
          expiresAt={sandboxExpires}
          resetCount={sandboxResetCount}
          sandboxUrl={sandboxUrl}
          accountCount={sandboxAccountCount}
          workerOnline={workerOnline}
          onNavigate={() => router.push(`/uat/my-tests/${assignmentId}/sandbox`)}
        />
      </div>

      {showCheckpoint && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCheckpoint(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#17325c] flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-500" /> Add Checkpoint
              </h3>
              <button onClick={() => setShowCheckpoint(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Label</label>
                <input type="text" value={checkpointLabel} onChange={(e) => setCheckpointLabel(e.target.value)}
                  placeholder="e.g. Problem started here"
                  maxLength={255}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note (optional)</label>
                <textarea value={checkpointNote} onChange={(e) => setCheckpointNote(e.target.value)}
                  placeholder="Additional details..."
                  maxLength={2000}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 resize-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCheckpoint(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">Cancel</button>
              <button onClick={handleSaveCheckpoint} disabled={!checkpointLabel.trim()}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">Save Checkpoint</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 lg:hidden flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {(['cases', 'detail', 'session'] as const).map((panel) => (
          <button key={panel} onClick={() => setMobilePanel(panel)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
              mobilePanel === panel ? 'bg-white text-[#17325c] shadow-sm' : 'text-slate-500'
            }`}>
            {panel === 'cases' ? 'Cases' : panel === 'detail' ? 'Detail' : 'Session'}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4 h-[calc(100vh-16rem)]">
        <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ${
          mobilePanel === 'cases' ? 'block' : 'hidden lg:block'
        }`}>
          <TestCasePanel
            cases={testCases}
            selectedId={selectedCaseId}
            onSelect={setSelectedCaseId}
          />
        </div>

        <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ${
          mobilePanel === 'detail' ? 'block' : 'hidden lg:block'
        }`}>
          <TestCaseDetailPanel
            assignmentTestCaseId={selectedCaseId}
            sessionId={sessionId}
            sessionStatus={sessionStatus}
            assignmentId={assignmentId}
            onStatusChange={handleStatusChange}
            onReportBug={handleReportBug}
          />
        </div>

        <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden ${
          mobilePanel === 'session' ? 'block' : 'hidden lg:block'
        }`}>
          <SessionPanel
            assignmentId={assignmentId}
            assignmentStatus={assignment.status}
            accessExpiresAt={assignment.access_expires_at}
            deadline={assignment.deadline}
            totalCases={testCases.length}
            completedCases={completedCases.length}
            passedCount={passedCount}
            failedCount={failedCount}
            blockedCount={blockedCount}
            onSessionChange={handleSessionChange}
          />
        </div>
      </div>

      {sessionStatus === 'paused' && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm mx-4 pointer-events-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-pause-circle-line text-2xl text-amber-500 w-8 h-8 flex items-center justify-center" />
            </div>
            <h3 className="text-xl font-bold text-[#17325c] mb-2">Session Paused</h3>
            <p className="text-slate-500 text-sm mb-6">Time tracking is paused. Resume when you&apos;re ready to continue testing.</p>
            <button onClick={async () => {
              if (!sessionId) return;
              await supabase.rpc('resume_uat_session', { p_session_id: sessionId });
              handleSessionChange();
            }} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">
              Resume Testing
            </button>
          </div>
        </div>
      )}
    </>
  );
}