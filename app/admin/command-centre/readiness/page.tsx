'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Database, Rocket, DollarSign, Cpu, LifeBuoy } from 'lucide-react';



interface CheckItem {
  label: string;
  icon: any;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  detail: string;
}

export default function CommandReadinessPage() {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    setLoading(true);

    const [projectsRes, alertsRes, backupsRes, deploymentsRes, n8nRes, supportRes] = await Promise.all([
      supabase.from('digital_footprint_projects').select('*').neq('status', 'archived'),
      supabase.from('digital_footprint_alerts').select('*').eq('is_resolved', false).eq('alert_type', 'critical'),
      supabase.from('digital_footprint_backups').select('*'),
      supabase.from('digital_footprint_deployments').select('*'),
      supabase.from('digital_footprint_n8n_agents').select('*'),
      supabase.from('digital_footprint_support').select('*').in('status', ['open', 'in_progress']),
    ]);

    const dbOk = !projectsRes.error && !alertsRes.error && !backupsRes.error && !deploymentsRes.error && !n8nRes.error && !supportRes.error;

    const results: CheckItem[] = [];

    const projects = projectsRes.data || [];
    const hasProjects = projects.length > 0;
    results.push({
      label: 'Application Status',
      icon: Rocket,
      status: hasProjects ? 'pass' : 'warning',
      detail: hasProjects ? `${projects.length} project(s) configured` : 'No projects configured'
    });

    const liveProjects = projects.filter(p => p.status === 'live');
    results.push({
      label: 'Live Projects',
      icon: CheckCircle2,
      status: liveProjects.length > 0 ? 'pass' : 'warning',
      detail: `${liveProjects.length} live project(s)`
    });

    const hasFailedDeployments = (deploymentsRes.data || []).some(d => d.deployment_status === 'failed');
    results.push({
      label: 'Deployments',
      icon: Rocket,
      status: hasFailedDeployments ? 'fail' : (deploymentsRes.data || []).length === 0 ? 'pending' : 'pass',
      detail: hasFailedDeployments ? 'Failed deployments detected' : (deploymentsRes.data || []).length === 0 ? 'Awaiting deployment data' : 'All deployments healthy'
    });

    const hasFailedBackups = (backupsRes.data || []).some(b => b.status === 'failed');
    results.push({
      label: 'Backups',
      icon: Database,
      status: hasFailedBackups ? 'fail' : (backupsRes.data || []).length === 0 ? 'pending' : 'pass',
      detail: hasFailedBackups ? 'Failed backups detected' : (backupsRes.data || []).length === 0 ? 'Awaiting backup data' : 'Backups healthy'
    });

    results.push({
      label: 'Database Health',
      icon: Database,
      status: dbOk ? 'pass' : 'fail',
      detail: dbOk ? 'Supabase connected and responsive' : 'Supabase query failed'
    });

    results.push({
      label: 'RLS & Security Policies',
      icon: Shield,
      status: 'pending',
      detail: 'Not evaluated by this screen — requires manual review'
    });

    results.push({
      label: 'Stripe Integration',
      icon: DollarSign,
      status: 'pending',
      detail: 'Server-side secret — not evaluated by this screen'
    });

    const n8nAgents = n8nRes.data || [];
    const hasN8nErrors = n8nAgents.some(a => a.status === 'error');
    results.push({
      label: 'n8n Agents',
      icon: Cpu,
      status: n8nAgents.length === 0 ? 'pending' : hasN8nErrors ? 'warning' : 'pass',
      detail: n8nAgents.length === 0 ? 'No agents configured' : hasN8nErrors ? 'Some agents in error state' : `${n8nAgents.length} agent(s) active`
    });

    const criticalAlerts = (alertsRes.data || []).length;
    results.push({
      label: 'Critical Alerts',
      icon: AlertTriangle,
      status: criticalAlerts > 0 ? 'fail' : 'pass',
      detail: criticalAlerts > 0 ? `${criticalAlerts} critical alert(s)` : 'No critical alerts'
    });

    const openSupport = supportRes.data || [];
    results.push({
      label: 'Support Tickets',
      icon: LifeBuoy,
      status: openSupport.length > 0 ? 'warning' : 'pass',
      detail: openSupport.length > 0 ? `${openSupport.length} open support ticket(s)` : 'No open support tickets'
    });

    setChecks(results);

    const passCount = results.filter(r => r.status === 'pass').length;
    const warnCount = results.filter(r => r.status === 'warning').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    const total = results.length;
    const score = Math.round((passCount * 100 + warnCount * 50) / total);
    setOverallScore(score);

    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Production Ready';
    if (score >= 70) return 'Needs Review';
    return 'Not Ready';
  };

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Production Readiness</h1>
            <p className="text-sm text-slate-400">System-wide checks for production deployment readiness</p>
          </div>
          <button onClick={runChecks} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />Run Checks
          </button>
        </div>

        <div className="glass-card rounded-2xl p-8 text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="64" cy="64" r="56" fill="none" stroke={getScoreColor(overallScore)} strokeWidth="8"
                strokeDasharray={`${(overallScore / 100) * 351.86} 351.86`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: getScoreColor(overallScore) }}>{overallScore}</span>
              <span className="text-[11px] text-slate-400">/ 100</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{getScoreLabel(overallScore)}</h2>
          <p className="text-sm text-slate-400">
            {checks.filter(c => c.status === 'pass').length} passing · {checks.filter(c => c.status === 'warning').length} warnings · {checks.filter(c => c.status === 'fail').length} failures
          </p>
        </div>

        <div className="space-y-3">
          {checks.map((check, i) => (
            <motion.div key={check.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                backgroundColor: check.status === 'pass' ? '#10B98115' : check.status === 'fail' ? '#EF444415' : check.status === 'warning' ? '#F59E0B15' : '#64748B15'
              }}>
                <check.icon className="w-5 h-5" style={{
                  color: check.status === 'pass' ? '#10B981' : check.status === 'fail' ? '#EF4444' : check.status === 'warning' ? '#F59E0B' : '#64748B'
                }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white">{check.label}</h3>
                <p className="text-xs text-slate-400">{check.detail}</p>
              </div>
              <div>
                {check.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                {check.status === 'fail' && <XCircle className="w-5 h-5 text-red-400" />}
                {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {check.status === 'pending' && <Clock className="w-5 h-5 text-slate-500" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </CommandShell>
  );
}