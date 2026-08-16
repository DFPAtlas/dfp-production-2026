'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import {
  ShieldCheck, Zap, AlertTriangle, Activity, Users, Megaphone,
  Workflow, Settings, Save, Play, Pause, RotateCcw, Clock,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight,
  Eye, EyeOff, Plus, Trash2, Search, ExternalLink, BarChart3,
  RefreshCw, Ban,
} from 'lucide-react';

const STAGES = [
  { key: 'stage0', label: 'Stage 0 — Observation', description: 'Health and internal test emails only' },
  { key: 'stage1', label: 'Stage 1 — Internal', description: 'DFP staff/internal recipients. No unattended production automations' },
  { key: 'stage2', label: 'Stage 2 — Friendly', description: 'Selected external recipients. Small limits. Manual approval. Review after every send' },
  { key: 'stage3', label: 'Stage 3 — Limited Product', description: 'One approved brand. Controlled customer segment. Selected low-risk automations' },
  { key: 'stage4', label: 'Stage 4 — Controlled Expansion', description: 'Additional approved brands/users. Higher limits only after evidence' },
];

const DEFAULT_PILOT_CONFIG: PilotConfig = {
  pilot_name: 'DFP Email Studio Pilot',
  organisation_name: 'Digital Footprint',
  owners: [],
  start_date: '',
  current_stage: 'stage0',
  stage_history: [],
  approved_users: [],
  approved_brands: [],
  approved_senders: [],
  approved_recipient_groups: [],
  limits: {
    max_campaign_recipients: 10,
    max_hourly_sends: 50,
    max_daily_sends: 200,
    max_campaigns: 5,
    max_automations: 3,
    max_import_size: 100,
    max_test_recipients: 5,
  },
  allowed_modules: ['templates', 'campaigns', 'audiences', 'contacts', 'imports', 'consent', 'preferences', 'analytics', 'suppressions', 'brand-kits', 'sections', 'reports'],
  excluded_modules: ['automations', 'transactional'],
  exit_criteria: {
    no_sev1: true,
    no_blocking_sev2: true,
    healthy_provider: true,
    healthy_webhooks: true,
    suppression_verified: true,
    idempotency_verified: true,
    metrics_within_threshold: true,
    owner_approval: false,
  },
  rollback_triggers: {
    bounce_rate_exceeded: 5,
    complaint_rate_exceeded: 0.5,
    sev1_incident: true,
    provider_failure: true,
    queue_failure: true,
    data_exposure: true,
  },
  kill_switch: {
    campaigns_blocked: false,
    automations_blocked: false,
    transactional_blocked_separately: false,
    activated_at: null,
    activated_by: null,
    reason: '',
    paused_jobs: [],
  },
};

interface PilotConfig {
  pilot_name: string;
  organisation_name: string;
  owners: string[];
  start_date: string;
  current_stage: string;
  stage_history: { stage: string; date: string; approved_by: string; notes: string }[];
  approved_users: { name: string; email: string; role: string; capabilities: string; status: string; activity: string }[];
  approved_brands: string[];
  approved_senders: string[];
  approved_recipient_groups: string[];
  limits: {
    max_campaign_recipients: number;
    max_hourly_sends: number;
    max_daily_sends: number;
    max_campaigns: number;
    max_automations: number;
    max_import_size: number;
    max_test_recipients: number;
  };
  allowed_modules: string[];
  excluded_modules: string[];
  exit_criteria: Record<string, boolean>;
  rollback_triggers: Record<string, number | boolean>;
  kill_switch: {
    campaigns_blocked: boolean;
    automations_blocked: boolean;
    transactional_blocked_separately: boolean;
    activated_at: string | null;
    activated_by: string | null;
    reason: string;
    paused_jobs: string[];
  };
}

interface IncidentRecord {
  id: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  module: string;
  impact: string;
  detected_at: string;
  resolved_at: string | null;
  owner_id: string | null;
  campaign_id: string | null;
  automation_id: string | null;
  timeline: { time: string; action: string; actor: string }[];
  root_cause: string;
  resolution: string;
  follow_up: string;
}

interface MetricData {
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_complaints: number;
  total_unsubscribes: number;
  total_failed: number;
  queue_backlog: number;
  active_campaigns: number;
  active_automations: number;
  webhook_healthy: boolean;
  provider_healthy: boolean;
}

const SEVERITY_STYLES: Record<string, string> = {
  'SEV-1': 'bg-red-500/10 text-red-400 border-red-500/20',
  'SEV-2': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'SEV-3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'SEV-4': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_STYLES: Record<string, string> = {
  investigating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  contained: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  monitoring: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  false_alarm: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function PilotControlPage() {
  const { profile, sessionUser } = useAdminProfile();
  const [config, setConfig] = useState<PilotConfig>(DEFAULT_PILOT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'dashboard' | 'incidents' | 'review'>('control');
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [newIncident, setNewIncident] = useState({ severity: 'SEV-3', title: '', description: '', module: '', impact: '' });
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [killSwitchConfirm, setKillSwitchConfirm] = useState<'campaigns' | 'automations' | 'transactional' | null>(null);
  const [killReason, setKillReason] = useState('');
  const [stageAdvanceConfirm, setStageAdvanceConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPilotConfig();
    loadIncidents();
    loadMetrics();
  }, []);

  const loadPilotConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_studio_settings').select('pilot_config').maybeSingle();
    if (data?.pilot_config && typeof data.pilot_config === 'object' && Object.keys(data.pilot_config as Record<string, unknown>).length > 0) {
      setConfig({ ...DEFAULT_PILOT_CONFIG, ...(data.pilot_config as Partial<PilotConfig>) });
    }
    setLoading(false);
  };

  const loadIncidents = async () => {
    const { data } = await supabase.from('email_pilot_incidents').select('*').order('detected_at', { ascending: false }).limit(50);
    if (data) setIncidents(data as IncidentRecord[]);
  };

  const loadMetrics = async () => {
    setMetricsLoading(true);
    const { count: sentCount } = await supabase.from('email_campaign_send_jobs').select('*', { count: 'exact', head: true }).not('status', 'eq', 'test');
    const { count: failedCount } = await supabase.from('email_campaign_send_jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed');
    const { count: activeCampaigns } = await supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: activeAutomations } = await supabase.from('email_automations').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { data: lastEvent } = await supabase.from('email_delivery_events').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: provider } = await supabase.from('email_provider_connections').select('status').eq('provider', 'resend').maybeSingle();

    setMetrics({
      total_sent: sentCount || 0,
      total_delivered: (sentCount || 0) - (failedCount || 0),
      total_bounced: 0,
      total_complaints: 0,
      total_unsubscribes: 0,
      total_failed: failedCount || 0,
      queue_backlog: 0,
      active_campaigns: activeCampaigns || 0,
      active_automations: activeAutomations || 0,
      webhook_healthy: !!lastEvent,
      provider_healthy: provider?.status === 'active',
    });
    setMetricsLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('email_studio_settings').update({ pilot_config: config as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({ pilot_config: config as unknown as Record<string, unknown> });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const activateKillSwitch = async (target: 'campaigns' | 'automations' | 'transactional') => {
    const updated = { ...config };
    if (target === 'campaigns') updated.kill_switch.campaigns_blocked = true;
    if (target === 'automations') updated.kill_switch.automations_blocked = true;
    if (target === 'transactional') updated.kill_switch.transactional_blocked_separately = true;
    updated.kill_switch.activated_at = new Date().toISOString();
    updated.kill_switch.activated_by = sessionUser?.id || null;
    updated.kill_switch.reason = killReason;
    setConfig(updated);
    setKillSwitchConfirm(null);
    setKillReason('');
    await saveConfigWithValue(updated);
  };

  const deactivateKillSwitch = async (target: 'campaigns' | 'automations' | 'transactional' | 'all') => {
    const updated = { ...config };
    if (target === 'campaigns' || target === 'all') updated.kill_switch.campaigns_blocked = false;
    if (target === 'automations' || target === 'all') updated.kill_switch.automations_blocked = false;
    if (target === 'transactional' || target === 'all') updated.kill_switch.transactional_blocked_separately = false;
    if (target === 'all') {
      updated.kill_switch.activated_at = null;
      updated.kill_switch.activated_by = null;
      updated.kill_switch.reason = '';
    }
    setConfig(updated);
    await saveConfigWithValue(updated);
  };

  const saveConfigWithValue = async (value: PilotConfig) => {
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('email_studio_settings').update({ pilot_config: value as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({ pilot_config: value as unknown as Record<string, unknown> });
    }
  };

  const advanceStage = async () => {
    const currentIdx = STAGES.findIndex(s => s.key === config.current_stage);
    if (currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];
    const updated = { ...config };
    updated.stage_history = [...updated.stage_history, {
      stage: config.current_stage,
      date: new Date().toISOString(),
      approved_by: sessionUser?.email || 'unknown',
      notes: `Advancing to ${nextStage.label}`,
    }];
    updated.current_stage = nextStage.key;
    setConfig(updated);
    setStageAdvanceConfirm(false);
    await saveConfigWithValue(updated);
  };

  const createIncident = async () => {
    if (!newIncident.title.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data } = await supabase.from('email_pilot_incidents').insert({
      organisation_id: profile?.organisation_id || null,
      severity: newIncident.severity,
      status: 'investigating',
      title: newIncident.title,
      description: newIncident.description,
      module: newIncident.module,
      impact: newIncident.impact,
      detected_at: new Date().toISOString(),
      owner_id: userId,
      timeline: [{ time: new Date().toISOString(), action: 'Incident created', actor: sessionUser?.email || 'unknown' }],
    }).select('id').single();
    if (data) {
      setShowNewIncident(false);
      setNewIncident({ severity: 'SEV-3', title: '', description: '', module: '', impact: '' });
      loadIncidents();
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string, note?: string) => {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return;
    const updatedTimeline = [...(inc.timeline || []), {
      time: new Date().toISOString(),
      action: `Status changed to ${newStatus}${note ? ': ' + note : ''}`,
      actor: sessionUser?.email || 'unknown',
    }];
    const updates: Record<string, unknown> = { status: newStatus, timeline: updatedTimeline, updated_at: new Date().toISOString() };
    if (newStatus === 'resolved' || newStatus === 'closed') updates.resolved_at = new Date().toISOString();
    await supabase.from('email_pilot_incidents').update(updates).eq('id', incidentId);
    loadIncidents();
    setSelectedIncident(null);
  };

  const addParticipant = () => {
    setConfig(prev => ({
      ...prev,
      approved_users: [...prev.approved_users, { name: '', email: '', role: 'viewer', capabilities: '', status: 'active', activity: '' }],
    }));
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    setConfig(prev => {
      const users = [...prev.approved_users];
      users[index] = { ...users[index], [field]: value };
      return { ...prev, approved_users: users };
    });
  };

  const removeParticipant = (index: number) => {
    setConfig(prev => ({
      ...prev,
      approved_users: prev.approved_users.filter((_, i) => i !== index),
    }));
  };

  const toggleModule = (moduleName: string) => {
    setConfig(prev => {
      const isAllowed = prev.allowed_modules.includes(moduleName);
      return {
        ...prev,
        allowed_modules: isAllowed
          ? prev.allowed_modules.filter(m => m !== moduleName)
          : [...prev.allowed_modules, moduleName],
        excluded_modules: isAllowed
          ? [...prev.excluded_modules, moduleName]
          : prev.excluded_modules.filter(m => m !== moduleName),
      };
    });
  };

  const currentStageIdx = STAGES.findIndex(s => s.key === config.current_stage);
  const killActive = config.kill_switch.campaigns_blocked || config.kill_switch.automations_blocked || config.kill_switch.transactional_blocked_separately;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${killActive ? 'bg-red-500/10' : 'bg-[#06B6D4]/10'}`}>
              <ShieldCheck className={`w-4 h-4 ${killActive ? 'text-red-400' : 'text-[#06B6D4]'}`} />
            </div>
            <h1 className="text-xl font-bold text-white">Pilot Control</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            {config.pilot_name} — {STAGES.find(s => s.key === config.current_stage)?.label || config.current_stage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {killActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-red-400">KILL SWITCH ACTIVE</span>
            </div>
          )}
          <button onClick={saveConfig} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save Config'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)]">
        {([
          { key: 'control' as const, label: 'Control Panel', icon: Settings },
          { key: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
          { key: 'incidents' as const, label: 'Incidents', icon: AlertTriangle },
          { key: 'review' as const, label: 'Daily Review', icon: Eye },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.key ? 'text-[#06B6D4] border-[#06B6D4]' : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'incidents' && incidents.filter(i => i.status === 'investigating').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{incidents.filter(i => i.status === 'investigating').length}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>
      )}

      {activeTab === 'control' && (
        <div className="space-y-6">
          {/* Kill Switch Section */}
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Kill Switch</h2>
                <p className="text-xs text-slate-500 mt-0.5">Emergency stop for campaigns and automations. Data is preserved.</p>
              </div>
              {killActive && (
                <button onClick={() => deactivateKillSwitch('all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" /> Deactivate All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 ${config.kill_switch.campaigns_blocked ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className={`w-4 h-4 ${config.kill_switch.campaigns_blocked ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-white">Campaigns</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${config.kill_switch.campaigns_blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {config.kill_switch.campaigns_blocked ? 'BLOCKED' : 'Running'}
                  </span>
                </div>
                {config.kill_switch.campaigns_blocked ? (
                  <button onClick={() => deactivateKillSwitch('campaigns')}
                    className="w-full mt-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
                  >Resume Campaigns</button>
                ) : (
                  <button onClick={() => setKillSwitchConfirm('campaigns')}
                    className="w-full mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >Block New Campaigns</button>
                )}
              </div>
              <div className={`rounded-xl border p-4 ${config.kill_switch.automations_blocked ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Workflow className={`w-4 h-4 ${config.kill_switch.automations_blocked ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-white">Automations</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${config.kill_switch.automations_blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {config.kill_switch.automations_blocked ? 'BLOCKED' : 'Running'}
                  </span>
                </div>
                {config.kill_switch.automations_blocked ? (
                  <button onClick={() => deactivateKillSwitch('automations')}
                    className="w-full mt-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
                  >Resume Automations</button>
                ) : (
                  <button onClick={() => setKillSwitchConfirm('automations')}
                    className="w-full mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >Block New Automations</button>
                )}
              </div>
              <div className={`rounded-xl border p-4 ${config.kill_switch.transactional_blocked_separately ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${config.kill_switch.transactional_blocked_separately ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-white">Transactional</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${config.kill_switch.transactional_blocked_separately ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {config.kill_switch.transactional_blocked_separately ? 'BLOCKED' : 'Running'}
                  </span>
                </div>
                {config.kill_switch.transactional_blocked_separately ? (
                  <button onClick={() => deactivateKillSwitch('transactional')}
                    className="w-full mt-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/30 transition-all cursor-pointer whitespace-nowrap"
                  >Resume Transactional</button>
                ) : (
                  <button onClick={() => setKillSwitchConfirm('transactional')}
                    className="w-full mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >Block Transactional</button>
                )}
              </div>
            </div>
            {config.kill_switch.reason && (
              <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400"><strong>Reason:</strong> {config.kill_switch.reason}</p>
                {config.kill_switch.activated_at && (
                  <p className="text-[10px] text-red-400/70 mt-1">Activated: {new Date(config.kill_switch.activated_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Stage Control */}
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Pilot Stage</h2>
            <div className="space-y-2">
              {STAGES.map((stage, i) => {
                const isCurrent = stage.key === config.current_stage;
                const isPast = i < currentStageIdx;
                const isFuture = i > currentStageIdx;
                return (
                  <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isCurrent ? 'bg-[#06B6D4]/5 border-[#06B6D4]/20' :
                    isPast ? 'bg-emerald-500/[0.02] border-emerald-500/10' :
                    'bg-white/[0.01] border-[rgba(255,255,255,0.04)] opacity-50'
                  }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isPast ? 'bg-emerald-500/20 text-emerald-400' :
                      isCurrent ? 'bg-[#06B6D4]/20 text-[#06B6D4]' :
                      'bg-white/[0.04] text-slate-600'
                    }`}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isPast ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'}`}>{stage.label}</p>
                      <p className="text-[11px] text-slate-500">{stage.description}</p>
                    </div>
                    {isCurrent && currentStageIdx < STAGES.length - 1 && (
                      <button onClick={() => setStageAdvanceConfirm(true)}
                        className="px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                      >Advance</button>
                    )}
                  </div>
                );
              })}
            </div>
            {config.stage_history.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Stage History</p>
                {config.stage_history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(h.date).toLocaleDateString()}</span>
                    <span className="text-slate-600">—</span>
                    <span>{STAGES.find(s => s.key === h.stage)?.label || h.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Limits */}
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Pilot Limits</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(config.limits).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</label>
                  <input type="number" value={value} onChange={e => setConfig(prev => ({
                    ...prev, limits: { ...prev.limits, [key]: parseInt(e.target.value) || 0 }
                  }))} min={0}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Pilot Participants</h2>
              <button onClick={addParticipant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              ><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {config.approved_users.map((user, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl">
                  <input type="text" value={user.name} onChange={e => updateParticipant(i, 'name', e.target.value)} placeholder="Name"
                    className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  <input type="email" value={user.email} onChange={e => updateParticipant(i, 'email', e.target.value)} placeholder="Email"
                    className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  <select value={user.role} onChange={e => updateParticipant(i, 'role', e.target.value)}
                    className="w-28 px-2 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="approver">Approver</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input type="text" value={user.capabilities} onChange={e => updateParticipant(i, 'capabilities', e.target.value)} placeholder="Capabilities"
                    className="w-32 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {user.status}
                  </span>
                  <button onClick={() => removeParticipant(i)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                  ><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Module Toggles */}
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Allowed Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['templates', 'campaigns', 'automations', 'transactional', 'contacts', 'audiences', 'imports', 'consent', 'preferences', 'brand-kits', 'sections', 'analytics', 'suppressions', 'reports', 'settings'].map(mod => (
                <label key={mod} className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl cursor-pointer hover:border-[rgba(255,255,255,0.12)] transition-all">
                  <input type="checkbox" checked={config.allowed_modules.includes(mod)} onChange={() => toggleModule(mod)}
                    className="w-3.5 h-3.5 rounded border-[rgba(255,255,255,0.1)] bg-white/[0.04] text-[#06B6D4] focus:ring-[#06B6D4]/20"
                  />
                  <span className="text-xs text-slate-300 capitalize">{mod.replace(/-/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Stage</p>
              <p className="text-lg font-bold text-white mt-1">{STAGES.find(s => s.key === config.current_stage)?.label.split(' — ')[0] || config.current_stage}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{config.pilot_name}</p>
            </div>
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Sent</p>
              <p className="text-lg font-bold text-white mt-1">{metricsLoading ? '...' : metrics?.total_sent || 0}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{metrics?.total_delivered || 0} delivered</p>
            </div>
            <div className={`bg-[#121215] border rounded-2xl p-4 ${metrics?.provider_healthy ? 'border-emerald-500/10' : 'border-red-500/10'}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Provider</p>
              <p className={`text-lg font-bold mt-1 ${metrics?.provider_healthy ? 'text-emerald-400' : 'text-red-400'}`}>{metrics?.provider_healthy ? 'Healthy' : 'Issue'}</p>
            </div>
            <div className={`bg-[#121215] border rounded-2xl p-4 ${metrics?.webhook_healthy ? 'border-emerald-500/10' : 'border-amber-500/10'}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Webhooks</p>
              <p className={`text-lg font-bold mt-1 ${metrics?.webhook_healthy ? 'text-emerald-400' : 'text-amber-400'}`}>{metrics?.webhook_healthy ? 'Active' : 'No Events'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Bounced', value: metrics?.total_bounced || 0, color: 'text-red-400' },
              { label: 'Complaints', value: metrics?.total_complaints || 0, color: 'text-orange-400' },
              { label: 'Unsubscribes', value: metrics?.total_unsubscribes || 0, color: 'text-amber-400' },
              { label: 'Failed Jobs', value: metrics?.total_failed || 0, color: 'text-red-400' },
              { label: 'Queue Backlog', value: metrics?.queue_backlog || 0, color: 'text-slate-400' },
            ].map(m => (
              <div key={m.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
                <p className="text-[10px] text-slate-500">{m.label}</p>
                <p className={`text-xl font-bold ${m.color} mt-1`}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Exit Criteria</h3>
              {Object.entries(config.exit_criteria).map(([key, met]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                  <span className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={met ? 'text-emerald-400' : 'text-slate-600'}>
                    {met ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Rollback Triggers</h3>
              {Object.entries(config.rollback_triggers).map(([key, threshold]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                  <span className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-mono text-slate-500">{typeof threshold === 'boolean' ? (threshold ? 'Enabled' : 'Off') : `${threshold}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Incident Log</h2>
            <button onClick={() => setShowNewIncident(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
            ><Plus className="w-3.5 h-3.5" /> Report Incident</button>
          </div>

          {incidents.length === 0 ? (
            <div className="text-center py-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No incidents recorded</p>
              <p className="text-xs text-slate-600 mt-1">The pilot is running clean</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map(inc => (
                <div key={inc.id} className={`bg-[#121215] border rounded-2xl p-4 ${SEVERITY_STYLES[inc.severity]?.split(' ')[1] || 'border-[rgba(255,255,255,0.06)]'} ${inc.status === 'investigating' ? 'border-l-2 border-l-red-500' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${SEVERITY_STYLES[inc.severity]}`}>{inc.severity}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${STATUS_STYLES[inc.status]}`}>{inc.status.replace('_', ' ')}</span>
                      <h3 className="text-sm font-semibold text-white">{inc.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{new Date(inc.detected_at).toLocaleDateString()}</span>
                      <button onClick={() => setSelectedIncident(inc)}
                        className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-[10px] text-slate-400 hover:text-white transition-all cursor-pointer"
                      ><Eye className="w-3 h-3" /> Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Incident Modal */}
          {showNewIncident && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewIncident(false)}>
              <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-bold text-white mb-4">Report New Incident</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Severity</label>
                    <select value={newIncident.severity} onChange={e => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                    >
                      <option value="SEV-1">SEV-1 — Critical (security/leak/send)</option>
                      <option value="SEV-2">SEV-2 — Major (queue/failure/spike)</option>
                      <option value="SEV-3">SEV-3 — Minor (partial issue)</option>
                      <option value="SEV-4">SEV-4 — Cosmetic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title *</label>
                    <input type="text" value={newIncident.title} onChange={e => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Module</label>
                    <input type="text" value={newIncident.module} onChange={e => setNewIncident(prev => ({ ...prev, module: e.target.value }))} placeholder="e.g. campaigns"
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Impact</label>
                    <input type="text" value={newIncident.impact} onChange={e => setNewIncident(prev => ({ ...prev, impact: e.target.value }))} placeholder="e.g. 5 recipients affected"
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Description</label>
                    <textarea value={newIncident.description} onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))} rows={3} maxLength={500}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowNewIncident(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
                  >Cancel</button>
                  <button onClick={createIncident}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all cursor-pointer whitespace-nowrap"
                  >Report Incident</button>
                </div>
              </div>
            </div>
          )}

          {/* Incident Detail Modal */}
          {selectedIncident && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedIncident(null)}>
              <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${SEVERITY_STYLES[selectedIncident.severity]} mr-2`}>{selectedIncident.severity}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${STATUS_STYLES[selectedIncident.status]}`}>{selectedIncident.status.replace('_', ' ')}</span>
                  </div>
                  <button onClick={() => setSelectedIncident(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] cursor-pointer"
                  ><XCircle className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">{selectedIncident.title}</h3>
                  {selectedIncident.description && <p className="text-xs text-slate-400">{selectedIncident.description}</p>}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Module:</span> <span className="text-white ml-1">{selectedIncident.module || '—'}</span></div>
                    <div><span className="text-slate-500">Impact:</span> <span className="text-white ml-1">{selectedIncident.impact || '—'}</span></div>
                    <div><span className="text-slate-500">Detected:</span> <span className="text-white ml-1">{new Date(selectedIncident.detected_at).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Resolved:</span> <span className="text-white ml-1">{selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : '—'}</span></div>
                  </div>
                  {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Timeline</p>
                      {selectedIncident.timeline.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400 py-0.5">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className="text-slate-500">{new Date(t.time).toLocaleString()}</span>
                          <span>— {t.action} by {t.actor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {selectedIncident.status !== 'resolved' && selectedIncident.status !== 'closed' && (
                      <button onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                        className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                      >Mark Resolved</button>
                    )}
                    {selectedIncident.status !== 'closed' && (
                      <button onClick={() => updateIncidentStatus(selectedIncident.id, 'closed')}
                        className="flex-1 px-3 py-2 bg-slate-500/10 border border-slate-500/20 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-500/20 transition-all cursor-pointer whitespace-nowrap"
                      >Close Incident</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Daily Pilot Review</h2>
            <p className="text-xs text-slate-400 mb-4">Current stage: <strong className="text-white">{STAGES.find(s => s.key === config.current_stage)?.label || config.current_stage}</strong></p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Sending Health</h3>
                {[
                  { label: 'Total Sent', value: metrics?.total_sent || 0 },
                  { label: 'Delivered', value: metrics?.total_delivered || 0 },
                  { label: 'Bounced', value: metrics?.total_bounced || 0, warn: (metrics?.total_bounced || 0) > 0 },
                  { label: 'Complaints', value: metrics?.total_complaints || 0, warn: (metrics?.total_complaints || 0) > 0 },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between py-1.5 px-3 bg-white/[0.02] rounded-lg">
                    <span className="text-xs text-slate-400">{m.label}</span>
                    <span className={`text-xs font-medium ${m.warn ? 'text-red-400' : 'text-white'}`}>{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">System Health</h3>
                {[
                  { label: 'Provider', status: metrics?.provider_healthy },
                  { label: 'Webhooks', status: metrics?.webhook_healthy },
                  { label: 'Active Campaigns', value: metrics?.active_campaigns || 0 },
                  { label: 'Active Automations', value: metrics?.active_automations || 0 },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between py-1.5 px-3 bg-white/[0.02] rounded-lg">
                    <span className="text-xs text-slate-400">{m.label}</span>
                    {m.status !== undefined ? (
                      <span className={`text-xs font-medium ${m.status ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.status ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <XCircle className="w-3.5 h-3.5 inline" />}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-white">{m.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white mb-2">Recommendation</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <button className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-emerald-500/[0.08] transition-all">
                  <Play className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-emerald-400">Continue</p>
                </button>
                <button className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-amber-500/[0.08] transition-all">
                  <Pause className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-amber-400">Hold</p>
                </button>
                <button className="bg-orange-500/[0.04] border border-orange-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-orange-500/[0.08] transition-all">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-orange-400">Reduce Scope</p>
                </button>
                <button className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-red-500/[0.08] transition-all">
                  <Ban className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-red-400">Roll Back</p>
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-500/[0.02] border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400/70">
                Do not auto-advance stages. Each stage requires previous completion, no unresolved critical incident,
                acceptable metrics, support/technical/business approval, and recorded decision.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Kill Switch Confirmation Modal */}
      {killSwitchConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setKillSwitchConfirm(null)}>
          <div className="bg-[#1a1a1e] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Activate Kill Switch</h3>
                <p className="text-xs text-red-400">Block {killSwitchConfirm} submissions immediately</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reason *</label>
                <input type="text" value={killReason} onChange={e => setKillReason(e.target.value)}
                  placeholder="Why is the kill switch being activated?"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <p className="text-xs text-slate-500">Drafts and data are preserved. Diagnostics remain available. Queued work is paused safely.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setKillSwitchConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
              >Cancel</button>
              <button onClick={() => activateKillSwitch(killSwitchConfirm)} disabled={!killReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >Activate Kill Switch</button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Advance Confirmation */}
      {stageAdvanceConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setStageAdvanceConfirm(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Advance Pilot Stage</h3>
                <p className="text-xs text-slate-400">
                  From: {STAGES.find(s => s.key === config.current_stage)?.label}
                  <br />
                  To: {STAGES[currentStageIdx + 1]?.label}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-400 mb-4">Ensure previous stage criteria are met. This action is recorded in audit.</p>
            <div className="flex gap-3">
              <button onClick={() => setStageAdvanceConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
              >Cancel</button>
              <button onClick={advanceStage}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap"
              >Confirm Advance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}