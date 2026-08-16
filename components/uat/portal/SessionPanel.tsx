'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Bug, Clock, Monitor, Play, Pause, RotateCcw, CheckCircle, Loader2, Shield } from 'lucide-react';
import UATMonitoringNotice from '@/components/uat/portal/UATMonitoringNotice';
import { NOTICE_VERSION } from '@/lib/uat-monitoring-definitions';

interface SessionData {
  id: string;
  status: string;
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  active_seconds: number;
  pause_seconds: number;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  project_id: string | null;
}

interface SessionPanelProps {
  assignmentId: string;
  assignmentStatus: string;
  accessExpiresAt: string | null;
  deadline: string | null;
  totalCases: number;
  completedCases: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  onSessionChange: () => void;
}

export default function SessionPanel({
  assignmentId, assignmentStatus, accessExpiresAt, deadline,
  totalCases, completedCases, passedCount, failedCount, blockedCount,
  onSessionChange,
}: SessionPanelProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [finishModal, setFinishModal] = useState(false);
  const [finishWarning, setFinishWarning] = useState('');
  const [showMonitoringNotice, setShowMonitoringNotice] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [assignmentId]);

  useEffect(() => {
    updateTimer();
    if (session?.status === 'active') {
      timerRef.current = setInterval(updateTimer, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      updateTimer();
    }
  }, [session]);

  const updateTimer = () => {
    if (!session) { setElapsedDisplay('00:00:00'); return; }
    let totalSec = session.active_seconds;
    if (session.status === 'active') {
      const startedAt = new Date(session.started_at).getTime();
      totalSec += Math.floor((Date.now() - startedAt) / 1000) - session.pause_seconds;
    }
    totalSec = Math.max(0, totalSec);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    setElapsedDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  };

  const loadSession = async () => {
    setLoading(true);
    const { data } = await supabase.from('uat_sessions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .in('status', ['active', 'paused', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sess = data as SessionData | null;
    setSession(sess);

    if (sess?.project_id) {
      setProjectId(sess.project_id);
      checkMonitoring(sess.project_id, assignmentId);
    } else if (data) {
      const { data: job } = await supabase.from('uat_assignments')
        .select('uat_jobs(project_id)')
        .eq('id', assignmentId)
        .maybeSingle();
      const pid = (job as any)?.uat_jobs?.project_id;
      if (pid) {
        setProjectId(pid);
        checkMonitoring(pid, assignmentId);
      }
    }
    setLoading(false);
  };

  const checkMonitoring = async (pid: string, aid: string) => {
    const { data: settings } = await supabase
      .from('uat_monitoring_settings')
      .select('monitoring_enabled')
      .eq('project_id', pid)
      .maybeSingle();

    if (!(settings as any)?.monitoring_enabled) {
      setMonitoringEnabled(false);
      return;
    }

    setMonitoringEnabled(true);
  };

  const getBrowserMetadata = () => {
    if (typeof window === 'undefined') return {};
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = '';
    let os = 'Unknown';
    if (ua.includes('Firefox/')) { browserName = 'Firefox'; browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || ''; }
    else if (ua.includes('Edg/')) { browserName = 'Edge'; browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || ''; }
    else if (ua.includes('Chrome/')) { browserName = 'Chrome'; browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || ''; }
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) { browserName = 'Safari'; browserVersion = ua.split('Version/')[1]?.split(' ')[0] || ''; }
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    return {
      browserName, browserVersion, os,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: ua,
    };
  };

  const handleStartSession = async () => {
    setActionLoading(true);
    setError('');
    const meta = getBrowserMetadata();
    const { data, error: rpcErr } = await supabase.rpc('start_uat_session', {
      p_assignment_id: assignmentId,
      p_browser_name: meta.browserName || null,
      p_browser_version: meta.browserVersion || null,
      p_operating_system: meta.os || null,
      p_viewport_width: meta.viewportWidth || null,
      p_viewport_height: meta.viewportHeight || null,
      p_user_agent: meta.userAgent || null,
    });
    setActionLoading(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    const result = data as any;
    if (!result?.success) { setError(result?.message || 'Failed to start session.'); return; }
    await loadSession();

    if (monitoringEnabled && projectId) {
      const { data: ack } = await supabase
        .from('uat_monitoring_acknowledgements')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('notice_version', NOTICE_VERSION)
        .is('withdrawn_at', null)
        .maybeSingle();

      if (!ack) {
        setShowMonitoringNotice(true);
        onSessionChange();
        return;
      }
    }

    onSessionChange();
  };

  const handleMonitoringAcknowledged = () => {
    setShowMonitoringNotice(false);
  };

  const handleMonitoringCancel = () => {
    setShowMonitoringNotice(false);
  };

  const handlePauseSession = async () => {
    if (!session) return;
    setActionLoading(true); setError('');
    const { data, error: rpcErr } = await supabase.rpc('pause_uat_session', { p_session_id: session.id });
    setActionLoading(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    const result = data as any;
    if (!result?.success) { setError(result?.message || 'Failed to pause.'); return; }
    await loadSession();
    onSessionChange();
  };

  const handleResumeSession = async () => {
    if (!session) return;
    setActionLoading(true); setError('');
    const { data, error: rpcErr } = await supabase.rpc('resume_uat_session', { p_session_id: session.id });
    setActionLoading(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    const result = data as any;
    if (!result?.success) { setError(result?.message || 'Failed to resume.'); return; }
    await loadSession();
    onSessionChange();
  };

  const handleFinishClick = async () => {
    if (!session) return;
    setError('');
    setActionLoading(true);
    const { data } = await supabase.rpc('finish_uat_session', { p_session_id: session.id });
    setActionLoading(false);
    const result = data as any;
    if (!result?.success) {
      setFinishWarning(result?.message || 'Cannot finish session.');
      setFinishModal(false);
      setError(result?.message || '');
      return;
    }
    await loadSession();
    onSessionChange();
    setFinishModal(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
      </div>
    );
  }

  const skippedCount = completedCases - passedCount - failedCount - blockedCount;
  const progressPct = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#17325c]">Session</h3>
            {monitoringEnabled && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">
                Monitoring
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                session?.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                session?.status === 'paused' ? 'bg-amber-500' :
                session?.status === 'completed' ? 'bg-slate-400' : 'bg-slate-300'
              }`} />
              <span className="text-sm font-semibold capitalize text-[#17325c]">
                {session?.status || 'No Session'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Elapsed Time</div>
            <p className="text-2xl font-bold text-[#17325c] font-mono tracking-tight">{elapsedDisplay}</p>
            {session?.status === 'active' && <p className="text-xs text-emerald-500 mt-0.5">Recording active time</p>}
            {session?.status === 'paused' && <p className="text-xs text-amber-500 mt-0.5">Paused</p>}
          </div>

          {session && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Started</span>
                <span className="text-slate-600 font-medium">{new Date(session.started_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
              </div>
              {session.browser_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser</span>
                  <span className="text-slate-600 font-medium">{session.browser_name}{session.browser_version ? ` ${session.browser_version}` : ''}</span>
                </div>
              )}
              {session.operating_system && (
                <div className="flex justify-between">
                  <span className="text-slate-400">OS</span>
                  <span className="text-slate-600 font-medium">{session.operating_system}</span>
                </div>
              )}
              {(session.viewport_width && session.viewport_height) && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Viewport</span>
                  <span className="text-slate-600 font-medium">{session.viewport_width} x {session.viewport_height}</span>
                </div>
              )}
            </div>
          )}

          {accessExpiresAt && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                Due {new Date(accessExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Progress</div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3">
              <div className="bg-[#2878d0] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Passed:</span>
                <span className="font-semibold text-[#17325c] ml-auto">{passedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-500">Failed:</span>
                <span className="font-semibold text-[#17325c] ml-auto">{failedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-500">Blocked:</span>
                <span className="font-semibold text-[#17325c] ml-auto">{blockedCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-500">Skipped:</span>
                <span className="font-semibold text-[#17325c] ml-auto">{skippedCount}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400 text-center">
              {completedCases} of {totalCases} completed
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
          {!session || session.status === 'completed' ? (
            <button onClick={handleStartSession} disabled={actionLoading || session?.status === 'completed'}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {session?.status === 'completed' ? 'Session Complete' : 'Start Session'}
            </button>
          ) : (
            <>
              {session.status === 'active' && (
                <button onClick={handlePauseSession} disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />} Pause Session
                </button>
              )}
              {session.status === 'paused' && (
                <button onClick={handleResumeSession} disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Resume Session
                </button>
              )}
              <button onClick={() => setFinishModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap">
                <CheckCircle className="w-3.5 h-3.5" /> Finish Session
              </button>
            </>
          )}

          {monitoringEnabled && session?.status === 'active' && projectId && (
            <button
              onClick={() => setShowMonitoringNotice(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-semibold text-purple-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Shield className="w-3 h-3" /> View Monitoring Notice
            </button>
          )}
        </div>

        {finishModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setFinishModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#17325c] mb-2">Finish Session?</h3>
              <p className="text-sm text-slate-500 mb-4">
                {completedCases < totalCases
                  ? `Warning: ${totalCases - completedCases} test case(s) are not yet completed.`
                  : `Summary: ${passedCount} passed, ${failedCount} failed, ${blockedCount} blocked, ${skippedCount} skipped.`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setFinishModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer transition-colors whitespace-nowrap">Cancel</button>
                <button onClick={handleFinishClick} disabled={completedCases < totalCases}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors whitespace-nowrap"
                  title={completedCases < totalCases ? 'Complete all cases first' : ''}>
                  Finish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showMonitoringNotice && projectId && (
        <UATMonitoringNotice
          assignmentId={assignmentId}
          sessionId={session?.id || null}
          projectId={projectId}
          open={showMonitoringNotice}
          onAcknowledged={handleMonitoringAcknowledged}
          onCancel={handleMonitoringCancel}
        />
      )}
    </>
  );
}