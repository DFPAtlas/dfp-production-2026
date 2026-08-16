'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import {
  Heart, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown,
  Globe, Database, Lock, HardDrive, Activity, CreditCard, Mail, Zap, Phone,
  Bot, Archive, Rocket, TimerOff
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  healthy: '#10B981',
  degraded: '#F59E0B',
  down: '#EF4444',
  unknown: '#64748B',
  not_configured: '#94A3B8',
  stale: '#8B5CF6',
};

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
  not_configured: 'Not configured',
  stale: 'Stale',
};

const SERVICE_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  supabase_database: Database,
  supabase_auth: Lock,
  supabase_storage: HardDrive,
  stripe: CreditCard,
  email_resend: Mail,
  n8n: Zap,
  pbx: Phone,
  uat_worker: Bot,
  backups: Archive,
  deployment: Rocket,
};

function statusIcon(status: string) {
  if (status === 'healthy') return CheckCircle2;
  if (status === 'degraded') return AlertTriangle;
  if (status === 'down') return XCircle;
  if (status === 'not_configured') return Clock;
  if (status === 'stale') return TimerOff;
  return Clock;
}

const STALE_MS = 30 * 60 * 1000;

function effectiveStatus(svc: any): string {
  if (!svc.checked_at) return 'unknown';
  if (Date.now() - new Date(svc.checked_at).getTime() > STALE_MS) {
    return svc.status === 'not_configured' ? 'not_configured' : 'stale';
  }
  return svc.status;
}

export default function CommandHealthPage() {
  const [services, setServices] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [scheduler, setScheduler] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [svcRes, checkRes, projRes, schedRes] = await Promise.all([
      supabase.from('dfp_service_health').select('*').order('category').order('service'),
      supabase.from('dfp_health_checks').select('*').order('checked_at', { ascending: false }).limit(30),
      supabase.from('digital_footprint_projects').select('*').neq('status', 'archived').order('health_score', { ascending: true }),
      supabase.from('dfp_health_scheduler_state').select('*').maybeSingle(),
    ]);
    if (svcRes.data) setServices(svcRes.data);
    if (checkRes.data) setChecks(checkRes.data);
    if (projRes.data) setProjects(projRes.data);
    if (schedRes.data) setScheduler(schedRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const runCheck = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dfp-health-probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || 'Health check failed');
      }
      await fetchAll();
    } catch (e: any) {
      setRunError(e?.message || 'Health check failed');
    } finally {
      setRunning(false);
    }
  };

  const checkedCount = services.filter((s) => s.checked_at).length;
  const downCount = services.filter((s) => effectiveStatus(s) === 'down').length;
  const degradedCount = services.filter((s) => effectiveStatus(s) === 'degraded').length;
  const healthyCount = services.filter((s) => effectiveStatus(s) === 'healthy').length;
  const staleCount = services.filter((s) => effectiveStatus(s) === 'stale').length;
  const unconfiguredCount = services.filter((s) => effectiveStatus(s) === 'not_configured').length;
  const overall = downCount > 0
    ? 'down'
    : degradedCount > 0
      ? 'degraded'
      : staleCount > 0
        ? 'stale'
        : healthyCount + unconfiguredCount === services.length && services.length > 0
          ? 'healthy'
          : 'unknown';

  const overallColor = STATUS_COLORS[overall] || '#64748B';
  const overallLabel = overall === 'down'
    ? 'Service outage detected'
    : overall === 'degraded'
      ? 'Degraded performance'
      : overall === 'stale'
        ? 'Monitoring stale'
        : overall === 'healthy'
          ? 'All services operational'
          : 'Awaiting first health check';

  const latestChecked = services.length > 0
    ? services.reduce((max, s) => (s.checked_at && (!max || s.checked_at > max) ? s.checked_at : max), null)
    : null;

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 50) return 'Warning';
    if (score > 0) return 'Critical';
    return 'No Data';
  };

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">Health Monitoring</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">{services[0]?.environment || 'Production'}</span>
            </div>
            <p className="text-sm text-slate-400">Measured availability from the DFP health probe — not assumed status</p>
            <p className="text-xs text-slate-500 mt-1">
              Scheduler: {scheduler?.enabled ? `auto every ${scheduler.interval_minutes} min` : 'manual only'}
              {scheduler?.last_auto_run_at ? ` · last auto run ${new Date(scheduler.last_auto_run_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Checking…' : 'Run Check Now'}
          </button>
        </div>

        {runError && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {runError}
          </div>
        )}

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="28" cy="28" r="24" fill="none" stroke={overallColor} strokeWidth="3" strokeDasharray={`${(checkedCount / Math.max(services.length, 1)) * 150.8} 150.8`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6" style={{ color: overallColor }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: overallColor }}>{overallLabel}</span>
                {overall !== 'unknown' && (
                  <span className="text-xs text-slate-500">
                    {healthyCount}/{services.length} healthy · {degradedCount} degraded · {downCount} down
                    {staleCount > 0 && ` · ${staleCount} stale`}
                    {unconfiguredCount > 0 && ` · ${unconfiguredCount} not configured`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {latestChecked
                  ? `Last checked ${new Date(latestChecked).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                  : 'No checks have run yet — click "Run Check Now" to measure real availability'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {services.map((svc, i) => {
            const Icon = SERVICE_ICONS[svc.service] || Activity;
            const eff = effectiveStatus(svc);
            const StatusIcon = statusIcon(eff);
            const color = STATUS_COLORS[eff] || '#64748B';
            return (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{svc.display_name}</h3>
                      <span className="flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap" style={{ color }}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {STATUS_LABELS[eff] || eff}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {eff === 'stale' ? 'No recent check — result may be outdated. ' : ''}
                      {svc.message || 'No result yet'}
                      {svc.response_time_ms != null && eff !== 'down' && ` · ${svc.response_time_ms}ms`}
                    </p>
                    {svc.status_code != null && (
                      <p className="text-[10px] text-slate-600 mt-0.5 font-mono">HTTP {svc.status_code}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white text-sm">Recent Checks</h2>
            <span className="text-[11px] text-slate-500">last 30 results</span>
          </div>
          {checks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No check history yet. Run a check to start recording real measurements.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {checks.map((c) => {
                const StatusIcon = statusIcon(c.status);
                const color = STATUS_COLORS[c.status] || '#64748B';
                return (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02]">
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <span className="text-xs text-slate-300 flex-1 truncate">{c.message || c.service}</span>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(c.checked_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-bold text-white text-sm">Project Health Scores</h2>
          <p className="text-xs text-slate-500 mt-0.5">Set manually per project in the Projects module (separate from measured service availability above)</p>
        </div>

        {projects.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Heart className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Projects to Monitor</h3>
            <p className="text-sm text-slate-400">Add projects in the Projects module to start tracking health</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                  className="w-full p-5 flex items-center gap-4 text-left cursor-pointer">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="28" cy="28" r="22" fill="none" stroke={getHealthColor(project.health_score || 0)} strokeWidth="3"
                        strokeDasharray={`${((project.health_score || 0) / 100) * 138.23} 138.23`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: getHealthColor(project.health_score || 0) }}>
                        {project.health_score || '--'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate">{project.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{
                        backgroundColor: getHealthColor(project.health_score || 0) + '20',
                        color: getHealthColor(project.health_score || 0)
                      }}>{getHealthLabel(project.health_score || 0)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {project.deployment_status === 'failed' ? 'Failed deployment'
                        : project.backup_status === 'failed' ? 'Failed backup'
                          : project.last_heartbeat ? 'Last updated ' + new Date(project.last_heartbeat).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'No recent heartbeat'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400">Last Check</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {project.last_heartbeat ? new Date(project.last_heartbeat).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedId === project.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedId === project.id && (
                  <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Uptime</div>
                        <div className="text-sm font-bold text-white">{project.uptime || '--'}%</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Users</div>
                        <div className="text-sm font-bold text-white">{project.user_count || 0}</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Deployment</div>
                        <div className="text-sm font-bold text-white capitalize">{project.deployment_status || 'Awaiting'}</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-3">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Backup</div>
                        <div className="text-sm font-bold text-white capitalize">{project.backup_status || 'Awaiting'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </CommandShell>
  );
}