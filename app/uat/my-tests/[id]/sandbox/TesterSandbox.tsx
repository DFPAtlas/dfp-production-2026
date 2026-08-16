'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import {
  Box, Play, Pause, RotateCcw, Clock, StopCircle, AlertCircle,
  ExternalLink, Loader2, Eye, EyeOff, ChevronRight, Shield,
  RefreshCw, Server, Wifi, WifiOff,
} from 'lucide-react';
import {
  SANDBOX_STATUS_CONFIG, SANDBOX_MODE_CONFIG,
  SANDBOX_HEALTH_CONFIG, SANDBOX_ACCOUNT_TYPE_CONFIG,
  formatTimeRemaining,
} from '@/lib/uat-sandbox/types';
import type { SandboxStatus, SandboxInstance } from '@/lib/uat-sandbox/types';
import type { WorkerSandboxStatus } from '@/lib/uat-sandbox/worker/sandbox-service';
import { checkWorkerHealth, getWorkerSandboxStatus } from '@/lib/uat-sandbox/worker/sandbox-service';

export default function TesterSandboxPage({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [instance, setInstance] = useState<SandboxInstance | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [seededRecords, setSeededRecords] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [accessData, setAccessData] = useState<any>(null);
  const [showCredential, setShowCredential] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [workerStatus, setWorkerStatus] = useState<WorkerSandboxStatus | null>(null);
  const [workerOnline, setWorkerOnline] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  useEffect(() => { loadData(); }, [assignmentId, testerId]);

  const loadData = async () => {
    const { data: assign } = await supabase.from('uat_assignments')
      .select('id, status, job_id')
      .eq('id', assignmentId).eq('tester_id', testerId).maybeSingle();

    if (!assign) { setNotFound(true); setLoading(false); return; }
    setAssignment(assign);

    const { data: inst } = await supabase.from('uat_sandbox_instances')
      .select('*').eq('assignment_id', assignmentId).eq('tester_id', testerId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    setInstance(inst as SandboxInstance);

    if (inst) {
      const [{ data: accts }, { data: acts }, { data: seeds }] = await Promise.all([
        supabase.from('uat_sandbox_accounts').select('*').eq('sandbox_instance_id', (inst as any).id),
        supabase.from('uat_sandbox_actions').select('*').eq('sandbox_instance_id', (inst as any).id).order('requested_at', { ascending: false }),
        supabase.from('uat_sandbox_seeded_records').select('*').eq('sandbox_instance_id', (inst as any).id).eq('status', 'created'),
      ]);
      setAccounts(accts || []);
      setActions(acts || []);
      setSeededRecords(seeds || []);

      const jobId = (assign as any).job_id;
      if (jobId) {
        const { data: job } = await supabase.from('uat_jobs').select('project_id').eq('id', jobId).maybeSingle();
        if (job) {
          const { data: s } = await supabase.from('uat_sandbox_settings').select('*')
            .eq('project_id', (job as any).project_id).maybeSingle();
          setSettings(s);
        }
      }

      const wOnline = await checkWorkerHealth();
      setWorkerOnline(wOnline.workerOnline);

      if (wOnline.workerOnline && (inst as any).id) {
        const ws = await getWorkerSandboxStatus((inst as any).id);
        setWorkerStatus(ws);
      }
    }

    setLoading(false);
  };

  const refreshWorkerStatus = async () => {
    if (!instance) return;
    setRefreshingStatus(true);
    const wOnline = await checkWorkerHealth();
    setWorkerOnline(wOnline.workerOnline);
    if (wOnline.workerOnline) {
      const ws = await getWorkerSandboxStatus(instance.id);
      setWorkerStatus(ws);
    }
    setRefreshingStatus(false);
  };

  const handleRequestSandbox = async () => {
    setActionInProgress(true);
    setErrorMsg('');

    const { data: sessionData } = await supabase.from('uat_sessions')
      .select('id').eq('assignment_id', assignmentId).in('status', ['active', 'paused'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    const { data: result, error } = await supabase.rpc('request_uat_sandbox', {
      p_assignment_id: assignmentId,
      p_session_id: (sessionData as any)?.id || null,
    });

    if (error || !(result as any)?.success) {
      setErrorMsg((result as any)?.error || 'Failed to request sandbox');
      setActionInProgress(false);
      return;
    }

    const instanceId = (result as any).instance_id;
    setSuccessMsg('Sandbox requested. Provisioning...');

    const workerOnline = await checkWorkerHealth();
    setWorkerOnline(workerOnline.workerOnline);

    if (workerOnline.workerOnline) {
      try {
        const authRes = await supabase.auth.getSession();
        const authToken = authRes.data.session?.access_token;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uat-sandbox-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              action: 'create',
              sandbox_instance_id: instanceId,
              assignment_id: assignmentId,
              session_id: (sessionData as any)?.id,
              payload: {
                sandbox_instance_id: instanceId,
                assignment_id: assignmentId,
                session_id: (sessionData as any)?.id,
              },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (res.ok) {
          await supabase.from('uat_sandbox_instances').update({
            status: 'ready',
            health_status: 'healthy',
            updated_at: new Date().toISOString(),
          }).eq('id', instanceId);
          setSuccessMsg('Sandbox provisioned and ready');
        }
      } catch {
        await supabase.from('uat_sandbox_instances').update({
          status: 'ready',
          health_status: 'unknown',
          updated_at: new Date().toISOString(),
        }).eq('id', instanceId);
      }
    } else {
      await supabase.from('uat_sandbox_instances').update({
        status: 'ready',
        health_status: 'unknown',
        updated_at: new Date().toISOString(),
      }).eq('id', instanceId);
    }

    setTimeout(() => setSuccessMsg(''), 4000);
    loadData();
    setActionInProgress(false);
  };

  const handleWorkerAction = async (workerAction: string) => {
    if (!instance) return;
    setActionInProgress(true);
    setErrorMsg('');

    const authRes = await supabase.auth.getSession();
    const authToken = authRes.data.session?.access_token;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uat-sandbox-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            action: workerAction,
            sandbox_instance_id: instance.id,
            assignment_id: assignmentId,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        setErrorMsg(errData.message || 'Worker action failed');
        setActionInProgress(false);
        return;
      }

      const updateMap: Record<string, string> = {
        launch: 'active',
        pause: 'paused',
        resume: 'active',
        reset: 'resetting',
        destroy: 'ended',
      };

      const newStatus = updateMap[workerAction] || instance.status;
      await supabase.from('uat_sandbox_instances').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(workerAction === 'launch' ? { started_at: new Date().toISOString() } : {}),
        ...(workerAction === 'destroy' ? { ended_at: new Date().toISOString() } : {}),
      }).eq('id', instance.id);

      setSuccessMsg(`${workerAction.charAt(0).toUpperCase() + workerAction.slice(1)} completed`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err: any) {
      setErrorMsg(`Worker unavailable: ${err.message}`);
    }
    setActionInProgress(false);
  };

  const handleRpcAction = async (actionType: string) => {
    if (!instance) return;
    setActionInProgress(true);
    setErrorMsg('');

    const rpcMap: Record<string, string> = {
      extend: 'extend_uat_sandbox',
      end: 'end_uat_sandbox',
    };

    const rpcName = rpcMap[actionType];
    if (!rpcName) { setActionInProgress(false); return; }

    const { data: result, error } = await supabase.rpc(rpcName, {
      p_instance_id: instance.id,
    });

    if (error || !(result as any)?.success) {
      setErrorMsg((result as any)?.error || 'Action failed');
    } else {
      setSuccessMsg(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} completed`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    }
    setActionInProgress(false);
  };

  const handleReset = async () => {
    await handleWorkerAction('reset');
    if (instance) {
      const { data: result, error } = await supabase.rpc('reset_uat_sandbox_data', {
        p_instance_id: instance.id,
      });
    }
  };

  const handleGetAccess = async () => {
    if (!instance) return;
    setActionInProgress(true);
    setErrorMsg('');

    const { data: result, error } = await supabase.rpc('get_uat_sandbox_access', {
      p_instance_id: instance.id,
    });

    if (error || !(result as any)?.success) {
      setErrorMsg((result as any)?.error || 'Failed to get sandbox access');
    } else {
      setAccessData(result);
    }
    setActionInProgress(false);
  };

  const seedCategories = () => {
    const categories: Record<string, number> = {};
    seededRecords.forEach((r) => {
      const label = r.record_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      categories[label] = (categories[label] || 0) + 1;
    });
    return Object.entries(categories);
  };

  const isWorkerBacked = ['ready', 'active', 'paused', 'resetting'].includes(instance?.status || '');
  const isTerminal = ['ended', 'expired', 'failed'].includes(instance?.status || '');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading sandbox...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <>
        <UATPortalBreadcrumbs items={[{ label: 'My Tests', href: '/uat/my-tests' }, { label: 'Sandbox' }]} />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#17325c] mb-2">Not Available</h3>
            <p className="text-slate-500">This assignment does not exist or does not belong to you.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UATPortalBreadcrumbs items={[
        { label: 'My Tests', href: '/uat/my-tests' },
        { label: 'Test Runner', href: `/uat/my-tests/${assignmentId}` },
        { label: 'Sandbox' },
      ]} />

      <div className="mt-3">
        <button onClick={() => router.push(`/uat/my-tests/${assignmentId}`)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#2878d0] transition-colors cursor-pointer mb-4">
          <i className="ri-arrow-left-line" /> Return to Test Runner
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-600">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
          <i className="ri-check-line text-emerald-400" />
          <span className="text-sm text-emerald-600">{successMsg}</span>
        </div>
      )}

      {!instance ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 max-w-xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
              <Box className="w-8 h-8 text-cyan-500" />
            </div>
            <h2 className="text-xl font-bold text-[#17325c] mb-2">Sandbox Testing</h2>
            <p className="text-slate-500">
              {settings?.sandbox_enabled
                ? 'Request a sandbox to get a controlled test environment with temporary access.'
                : 'Sandbox testing is not enabled for this project.'}
            </p>
          </div>

          {settings?.sandbox_enabled ? (
            <button onClick={handleRequestSandbox} disabled={actionInProgress}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-sm font-semibold text-white cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap transition-colors">
              {actionInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
              Prepare Sandbox
            </button>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Contact a project admin to enable sandbox testing.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#17325c] flex items-center gap-2">
                  <Box className="w-5 h-5 text-cyan-500" /> Sandbox Status
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      color: SANDBOX_STATUS_CONFIG[instance.status as SandboxStatus]?.color,
                      backgroundColor: SANDBOX_STATUS_CONFIG[instance.status as SandboxStatus]?.bg,
                    }}>
                    {SANDBOX_STATUS_CONFIG[instance.status as SandboxStatus]?.label}
                  </span>
                  <button onClick={refreshWorkerStatus} disabled={refreshingStatus}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                    title="Refresh worker status">
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshingStatus ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-slate-500 text-xs block">Mode</span>
                  <span className="text-[#17325c] font-semibold" style={{ color: SANDBOX_MODE_CONFIG[instance.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.color }}>
                    {SANDBOX_MODE_CONFIG[instance.sandbox_mode as keyof typeof SANDBOX_MODE_CONFIG]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Time Remaining</span>
                  <span className="text-[#17325c] font-semibold">{formatTimeRemaining(instance.expires_at)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Resets</span>
                  <span className="text-[#17325c] font-semibold">{instance.reset_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Health</span>
                  <span className="text-[#17325c] font-semibold capitalize">{instance.health_status}</span>
                </div>
              </div>

              {isWorkerBacked && (
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Server className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Isolation Browser</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className={`w-2 h-2 rounded-full ${workerOnline ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={`text-xs font-medium ${workerOnline ? 'text-emerald-600' : 'text-red-500'}`}>
                        {workerOnline ? 'Worker Online' : 'Worker Offline'}
                      </span>
                    </div>
                  </div>

                  {workerStatus ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Context</span>
                        <span className={`text-xs font-semibold ${workerStatus.browser_context_present ? 'text-emerald-600' : 'text-red-500'}`}>
                          {workerStatus.browser_context_present ? 'Present' : 'Missing'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Page</span>
                        <span className={`text-xs font-semibold ${workerStatus.page_open ? 'text-emerald-600' : 'text-red-500'}`}>
                          {workerStatus.page_open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Origin Check</span>
                        <span className={`text-xs font-semibold ${workerStatus.current_origin_allowed ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {workerStatus.current_origin_allowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Worker ID</span>
                        <span className="text-xs font-semibold text-[#17325c] font-mono">{workerStatus.worker_instance_id ? workerStatus.worker_instance_id.substring(0, 8) : '—'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Isolated validation browser status unavailable</p>
                        <p className="text-xs text-amber-600 mt-0.5">The worker may be offline or the sandbox is not yet provisioned.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {accessData && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#17325c] mb-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-500" /> Access Information
                </h3>

                {accessData.sandbox_url && (
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 block mb-1">Sandbox URL</span>
                    <a href={accessData.sandbox_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:underline font-mono">
                      {accessData.sandbox_url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {accessData.accounts && accessData.accounts.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-2">Temporary Accounts</span>
                    {accessData.accounts.map((acct: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-2 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#17325c]">{acct.display_name}</span>
                          <span className="text-xs text-slate-500 capitalize">{acct.account_type}</span>
                        </div>
                        {acct.username && <p className="text-xs text-slate-500 font-mono">Username: {acct.username}</p>}
                        {acct.email && <p className="text-xs text-slate-500 font-mono">Email: {acct.email}</p>}
                        {acct.credential_reference && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setShowCredential(!showCredential)}
                                className="text-xs text-cyan-600 hover:underline flex items-center gap-1 cursor-pointer">
                                {showCredential ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {showCredential ? 'Hide' : 'Reveal'} credential
                              </button>
                            </div>
                            {showCredential && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-xs font-mono text-amber-800 break-all">{acct.credential_reference}</p>
                                <p className="text-[10px] text-amber-600 mt-1">One-time display. Do not reuse this credential elsewhere.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {accessData.settings && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`px-2 py-1 rounded-lg ${accessData.settings.downloads_allowed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        Downloads: {accessData.settings.downloads_allowed ? 'Allowed' : 'Blocked'}
                      </div>
                      <div className={`px-2 py-1 rounded-lg ${accessData.settings.uploads_allowed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        Uploads: {accessData.settings.uploads_allowed ? 'Allowed' : 'Blocked'}
                      </div>
                      <div className={`px-2 py-1 rounded-lg ${accessData.settings.payment_test_mode_required ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                        Payments: {accessData.settings.payment_test_mode_required ? 'Test Mode' : 'Live'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#17325c] mb-4">Test Data Summary</h3>
              {seededRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No seeded test data. Data is shared with the staging environment.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {seedCategories().map(([label, count]) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <span className="text-2xl font-bold text-[#17325c]">{count}</span>
                      <span className="text-xs text-slate-500 block">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#17325c] mb-4">Controls</h3>
              <div className="space-y-2">
                {instance.status === 'requested' || instance.status === 'provisioning' ? (
                  <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-sm font-semibold cursor-not-allowed whitespace-nowrap">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Provisioning...
                  </button>
                ) : instance.status === 'ready' ? (
                  <>
                    {workerOnline ? (
                      <button onClick={() => handleWorkerAction('launch')} disabled={actionInProgress}
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">
                        <Play className="w-4 h-4 inline mr-1.5" />Launch Sandbox
                      </button>
                    ) : (
                      <button onClick={handleGetAccess} disabled={actionInProgress}
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors">
                        <ExternalLink className="w-4 h-4 inline mr-1.5" />Get Sandbox Access
                      </button>
                    )}
                    <button onClick={() => handleRpcAction('end')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                      <StopCircle className="w-4 h-4 inline mr-1.5" />End Sandbox
                    </button>
                  </>
                ) : instance.status === 'active' ? (
                  <>
                    <button onClick={() => handleWorkerAction('pause')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-amber-600 cursor-pointer whitespace-nowrap transition-colors">
                      <Pause className="w-4 h-4 inline mr-1.5" />Pause
                    </button>
                    <button onClick={handleReset} disabled={actionInProgress}
                      className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-violet-600 cursor-pointer whitespace-nowrap transition-colors">
                      <RotateCcw className="w-4 h-4 inline mr-1.5" />Reset Sandbox
                    </button>
                    <button onClick={() => handleRpcAction('extend')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-indigo-600 cursor-pointer whitespace-nowrap transition-colors">
                      <Clock className="w-4 h-4 inline mr-1.5" />Extend Session
                    </button>
                    {settings?.rebuild_enabled && (
                      <button onClick={() => handleWorkerAction('reset')} disabled={actionInProgress}
                        className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-orange-600 cursor-pointer whitespace-nowrap transition-colors">
                        <RefreshCw className="w-4 h-4 inline mr-1.5" />Rebuild
                      </button>
                    )}
                    <button onClick={() => handleRpcAction('end')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                      <StopCircle className="w-4 h-4 inline mr-1.5" />End Sandbox
                    </button>
                  </>
                ) : instance.status === 'paused' ? (
                  <>
                    <button onClick={() => handleWorkerAction('resume')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-emerald-600 cursor-pointer whitespace-nowrap transition-colors">
                      <Play className="w-4 h-4 inline mr-1.5" />Resume
                    </button>
                    <button onClick={handleReset} disabled={actionInProgress}
                      className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 rounded-xl text-sm font-semibold text-violet-600 cursor-pointer whitespace-nowrap transition-colors">
                      <RotateCcw className="w-4 h-4 inline mr-1.5" />Reset Sandbox
                    </button>
                    <button onClick={() => handleRpcAction('end')} disabled={actionInProgress}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">
                      <StopCircle className="w-4 h-4 inline mr-1.5" />End Sandbox
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">
                      {isTerminal ? 'This sandbox has been completed.' : 'No actions available.'}
                    </p>
                  </div>
                )}
              </div>

              {!workerOnline && isWorkerBacked && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <WifiOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">The sandbox worker is offline. Browser isolation is unavailable but your test data and evidence are preserved.</p>
                </div>
              )}
            </div>

            {actions.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#17325c] mb-3">Recent Actions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {actions.slice(0, 8).map((act) => (
                    <div key={act.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400 w-16 shrink-0">{new Date(act.requested_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#17325c] font-medium capitalize">{act.action_type.replace(/_/g, ' ')}</span>
                      <span className={`ml-auto px-1.5 py-0 rounded ${
                        act.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                        act.status === 'failed' ? 'text-red-600 bg-red-50' :
                        'text-slate-500 bg-slate-50'
                      }`}>{act.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}