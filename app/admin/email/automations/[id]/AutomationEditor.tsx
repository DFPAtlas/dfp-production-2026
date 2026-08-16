'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import {
  ArrowLeft, Save, Play, Pause, Activity, AlertTriangle,
  Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronRight,
  Mail, Clock, GitBranch, StopCircle, FileText, Bell,
  Check, X, Eye, Terminal, Zap, AlertCircle
} from 'lucide-react';
import {
  AutomationData,
  AutomationStatus,
  AutomationVersionData,
  WorkflowStep,
  WorkflowStepType,
  ConditionGroup,
  AutomationCondition,
  TriggerConfig,
  SendEmailConfig,
  WaitConfig,
  ConditionBranchConfig,
  StopConfig,
  SenderConfig,
  AUTOMATION_CATEGORIES,
  AUTOMATION_STATUS_LABELS,
  AUTOMATION_STATUS_COLORS,
  TRIGGER_DEFINITIONS,
  STEP_TYPE_LABELS,
  CONDITION_OPERATOR_LABELS,
  ConditionOperator,
  blankTriggerConfig,
  blankConditionGroup,
  blankCondition,
  blankSendEmailStep,
  blankWaitStep,
  blankConditionBranchStep,
  blankStopStep,
} from '@/components/admin/email/automations/automation-types';

type WizardStep = 'details' | 'trigger' | 'conditions' | 'workflow' | 'sender' | 'test' | 'review';

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'trigger', label: 'Trigger' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'sender', label: 'Sender' },
  { key: 'test', label: 'Test' },
  { key: 'review', label: 'Review' },
];

function generateId() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15); }

function readTriggerConfigValue(config: TriggerConfig | null, key: string): string {
  if (!config) return '';
  const value = Reflect.get(config, key);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export default function AutomationEditor({ automationId }: { automationId: string | null }) {
  const router = useRouter();
  const { profile, sessionUser } = useAdminProfile();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string }[]>([]);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [showTestSend, setShowTestSend] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState<AutomationData>({
    name: '',
    description: '',
    brand_kit_id: null,
    product_name: '',
    category: 'other',
    trigger_type: '',
    trigger_config: blankTriggerConfig(),
    condition_groups: [blankConditionGroup(generateId())],
    workflow_steps: [blankSendEmailStep(generateId(), 0)],
    active_version_id: null,
    status: 'draft',
    tags: [],
    owner_id: null,
  });

  const [senderConfig, setSenderConfig] = useState<SenderConfig>({
    from_name: 'Digital Footprint',
    from_email: 'noreply@digital-footprint.uk',
    reply_to_name: '',
    reply_to_email: '',
    verified: true,
  });

  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    if (automationId) loadAutomation();
    else setLoading(false);
  }, [automationId]);

  const loadAutomation = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_automations').select('*').eq('id', automationId).maybeSingle();
    if (data) {
      const a = data as AutomationData;
      setForm({
        ...a,
        trigger_config: a.trigger_config || blankTriggerConfig(),
        condition_groups: a.condition_groups || [blankConditionGroup(generateId())],
        workflow_steps: a.workflow_steps || [blankSendEmailStep(generateId(), 0)],
      });
      const { data: versions } = await supabase.from('email_automation_versions').select('*').eq('automation_id', a.id).order('version_number', { ascending: false }).limit(1);
      if (versions && versions.length > 0) {
        const v = versions[0] as AutomationVersionData;
        if (v.sender_config) setSenderConfig(v.sender_config);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase.from('email_templates').select('id, name, subject').in('status', ['active', 'approved']);
      if (data) setTemplates(data);
    };
    loadTemplates();
  }, []);

  const handleSave = async (newStatus?: AutomationStatus) => {
    setSaving(true);
    const payload: Partial<AutomationData> = {
      name: form.name,
      description: form.description,
      brand_kit_id: form.brand_kit_id,
      product_name: form.product_name,
      category: form.category,
      trigger_type: form.trigger_type,
      trigger_config: form.trigger_config,
      condition_groups: form.condition_groups,
      workflow_steps: form.workflow_steps,
      status: newStatus || form.status,
      tags: form.tags,
      owner_id: form.owner_id || sessionUser?.id || null,
      updated_at: new Date().toISOString(),
    };

    if (automationId) {
      const { error } = await supabase.from('email_automations').update(payload).eq('id', automationId);
      if (error) { alert('Save failed: ' + error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('email_automations').insert({
        ...payload,
        organisation_id: profile?.organisation_id || null,
        created_by: sessionUser?.id || null,
        updated_by: sessionUser?.id || null,
      }).select('id').single();
      if (error) { alert('Create failed: ' + error.message); setSaving(false); return; }
      if (data) router.replace(`/admin/email/automations/${(data as AutomationData).id}`);
    }
    setSaving(false);
  };

  const handleActivate = async () => {
    const { data: settings } = await supabase.from('email_studio_settings').select('pilot_config').maybeSingle();
    const pilotConfig = settings?.pilot_config as Record<string, unknown> | null;
    const killSwitch = pilotConfig?.kill_switch as Record<string, unknown> | null;
    if (killSwitch?.automations_blocked) {
      alert('Automation activation is blocked by the pilot kill switch. Contact the pilot owner to resume.');
      setConfirmActivate(false);
      return;
    }

    const svResult = await saveVersion();
    if (!svResult) return;

    setSaving(true);
    await supabase.from('email_automations').update({
      status: 'active',
      active_version_id: svResult,
      updated_at: new Date().toISOString(),
    }).eq('id', automationId);
    setForm(prev => ({ ...prev, status: 'active', active_version_id: svResult }));
    setSaving(false);
    setConfirmActivate(false);
  };

  const saveVersion = async (): Promise<string | null> => {
    if (!automationId) return null;
    const { data: existing } = await supabase.from('email_automation_versions').select('version_number').eq('automation_id', automationId).order('version_number', { ascending: false }).limit(1);
    const nextVersion = existing && existing.length > 0 ? (existing[0] as AutomationVersionData).version_number + 1 : 1;

    const { data, error } = await supabase.from('email_automation_versions').insert({
      organisation_id: profile?.organisation_id || null,
      automation_id: automationId,
      version_number: nextVersion,
      trigger_type: form.trigger_type,
      trigger_config: form.trigger_config,
      condition_groups: form.condition_groups,
      workflow_steps: form.workflow_steps,
      sender_config: senderConfig,
      status: 'active',
      created_by: sessionUser?.id || null,
      internal_note: `Version ${nextVersion} activated`,
    }).select('id').single();

    if (error) { alert('Version save failed: ' + error.message); return null; }
    return (data as AutomationVersionData).id!;
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimulationLog([]);
    const log: string[] = [];
    const addLog = (msg: string) => { log.push(msg); setSimulationLog([...log]); };

    setTimeout(() => {
      addLog('--- Simulation Started ---');
      setTimeout(() => {
        addLog(`Trigger: ${TRIGGER_DEFINITIONS.find(t => t.type === form.trigger_type)?.label || form.trigger_type || 'Not set'}`);
        addLog(`Trigger source: ${form.trigger_config?.source || 'N/A'}`);

        if (form.condition_groups && form.condition_groups.length > 0) {
          const activeGroup = form.condition_groups[0];
          if (activeGroup.conditions.length > 0) {
            addLog(`Evaluating conditions (${activeGroup.logic})...`);
            activeGroup.conditions.forEach((c, i) => {
              addLog(`  Condition ${i + 1}: ${c.field} ${CONDITION_OPERATOR_LABELS[c.operator]} ${c.value} → PASSED (simulated)`);
            });
          } else {
            addLog('No conditions defined — all events pass through.');
          }
        }

        if (form.workflow_steps && form.workflow_steps.length > 0) {
          addLog(`Workflow: ${form.workflow_steps.length} step(s)`);
          form.workflow_steps.forEach((s, i) => {
            const wouldRun = true;
            const icon = wouldRun ? '✓' : '✗';
            addLog(`  Step ${i + 1}: [${STEP_TYPE_LABELS[s.type]}] ${s.label} → ${wouldRun ? 'WOULD RUN' : 'SKIPPED'}`);
          });
        } else {
          addLog('WARNING: No workflow steps defined.');
        }

        addLog('--- Simulation Complete (no emails sent) ---');
        setSimulating(false);
      }, 400);
    }, 200);
  };

  const handleTestSend = async () => {
    if (!testRecipient) return;
    setTestSending(true);
    setTestResult(null);

    const sendStep = form.workflow_steps?.find(s => s.type === 'send_email');
    if (!sendStep) { setTestResult({ success: false, message: 'No Send Email step in workflow.' }); setTestSending(false); return; }
    const cfg = sendStep.config as SendEmailConfig;
    if (!cfg.template_id) { setTestResult({ success: false, message: 'No template selected in Send Email step.' }); setTestSending(false); return; }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-template-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template_id: cfg.template_id,
          to: testRecipient,
          variables: cfg.merge_fields || {},
          from: cfg.from_email || `${senderConfig.from_name} <${senderConfig.from_email}>`,
          reply_to: cfg.reply_to_email || undefined,
          subject_prefix: '[TEST] ',
        }),
      });
      const result = await res.json();
      setTestResult({ success: result.success, message: result.success ? 'Test email sent successfully.' : (result.error || 'Failed to send.') });
    } catch {
      setTestResult({ success: false, message: 'Network error sending test.' });
    }
    setTestSending(false);
  };

  const updateTriggerField = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, trigger_config: { ...prev.trigger_config!, [key]: value } }));
  };

  const selectedTrigger = TRIGGER_DEFINITIONS.find(t => t.type === form.trigger_type);

  const addConditionGroup = () => {
    setForm(prev => ({
      ...prev,
      condition_groups: [...(prev.condition_groups || []), blankConditionGroup(generateId())],
    }));
  };

  const removeConditionGroup = (groupId: string) => {
    setForm(prev => ({
      ...prev,
      condition_groups: (prev.condition_groups || []).filter(g => g.id !== groupId),
    }));
  };

  const updateConditionGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
    setForm(prev => ({
      ...prev,
      condition_groups: (prev.condition_groups || []).map(g => g.id === groupId ? { ...g, ...updates } : g),
    }));
  };

  const addCondition = (groupId: string) => {
    setForm(prev => ({
      ...prev,
      condition_groups: (prev.condition_groups || []).map(g => g.id === groupId ? { ...g, conditions: [...g.conditions, blankCondition(generateId())] } : g),
    }));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setForm(prev => ({
      ...prev,
      condition_groups: (prev.condition_groups || []).map(g => g.id === groupId ? { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) } : g),
    }));
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<AutomationCondition>) => {
    setForm(prev => ({
      ...prev,
      condition_groups: (prev.condition_groups || []).map(g =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c) }
          : g
      ),
    }));
  };

  const addWorkflowStep = (type: WorkflowStepType) => {
    const order = (form.workflow_steps || []).length;
    let step: WorkflowStep;
    switch (type) {
      case 'wait': step = blankWaitStep(generateId(), order); break;
      case 'condition_branch': step = blankConditionBranchStep(generateId(), order); break;
      case 'stop': step = blankStopStep(generateId(), order); break;
      default: step = blankSendEmailStep(generateId(), order);
    }
    setForm(prev => ({ ...prev, workflow_steps: [...(prev.workflow_steps || []), step] }));
  };

  const removeWorkflowStep = (stepId: string) => {
    setForm(prev => ({
      ...prev,
      workflow_steps: (prev.workflow_steps || []).filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i })),
    }));
  };

  const updateWorkflowStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setForm(prev => ({
      ...prev,
      workflow_steps: (prev.workflow_steps || []).map(s => s.id === stepId ? { ...s, ...updates } : s),
    }));
  };

  const updateSendEmailConfig = (stepId: string, updates: Partial<SendEmailConfig>) => {
    setForm(prev => ({
      ...prev,
      workflow_steps: (prev.workflow_steps || []).map(s =>
        s.id === stepId && s.type === 'send_email'
          ? { ...s, config: { ...s.config as SendEmailConfig, ...updates } }
          : s
      ),
    }));
  };

  const updateWaitConfig = (stepId: string, updates: Partial<WaitConfig>) => {
    setForm(prev => ({
      ...prev,
      workflow_steps: (prev.workflow_steps || []).map(s =>
        s.id === stepId && s.type === 'wait'
          ? { ...s, config: { ...s.config as WaitConfig, ...updates } }
          : s
      ),
    }));
  };

  const updateBranchConfig = (stepId: string, updates: Partial<ConditionBranchConfig>) => {
    setForm(prev => ({
      ...prev,
      workflow_steps: (prev.workflow_steps || []).map(s =>
        s.id === stepId && s.type === 'condition_branch'
          ? { ...s, config: { ...s.config as ConditionBranchConfig, ...updates } }
          : s
      ),
    }));
  };

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);

  const renderStepIndicator = () => (
    <div className="flex items-center gap-1 mb-8 flex-wrap">
      {WIZARD_STEPS.map((s, i) => {
        const isActive = s.key === currentStep;
        const isDone = i < currentStepIndex;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <button
              onClick={() => setCurrentStep(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                  : isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.03] text-slate-500 border border-[rgba(255,255,255,0.06)] hover:text-slate-300'
              }`}
            >
              {isDone ? <Check className="w-3 h-3" /> : <span className="text-[10px] w-4 h-4 rounded-full border border-current flex items-center justify-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < WIZARD_STEPS.length - 1 && <span className="w-3 h-px bg-[rgba(255,255,255,0.08)]" />}
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/email/automations')} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Automation name"
              className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-[rgba(255,255,255,0.1)] focus:border-[#06B6D4] focus:outline-none pb-0.5 placeholder:text-slate-600"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${AUTOMATION_STATUS_COLORS[form.status as AutomationStatus]}`}>
                {AUTOMATION_STATUS_LABELS[form.status as AutomationStatus]}
              </span>
              {automationId && <span className="text-[11px] text-slate-600">ID: {automationId.slice(0, 8)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {form.status === 'draft' && automationId && (
            <button
              onClick={() => setConfirmActivate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-4 h-4" />
              Activate
            </button>
          )}
          {form.status === 'active' && (
            <button
              onClick={() => handleSave('paused')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded-xl text-sm font-semibold hover:bg-orange-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {form.status === 'paused' && (
            <button
              onClick={() => handleSave('active')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          )}
        </div>
      </div>

      {renderStepIndicator()}

      <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
        {currentStep === 'details' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-semibold text-white">Campaign Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5">Automation Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. New Client Welcome Sequence" className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} placeholder="What does this automation do?" className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                <select value={form.category} onChange={e => {
                  const category = AUTOMATION_CATEGORIES.find(({ value }) => value === e.target.value)?.value || 'other';
                  setForm(prev => ({ ...prev, category }));
                }} className="w-full px-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none">
                  {AUTOMATION_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Product / Brand</label>
                <input type="text" value={form.product_name} onChange={e => setForm(prev => ({ ...prev, product_name: e.target.value }))} placeholder="e.g. Digital Footprint" className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5">Tags (comma separated)</label>
                <input type="text" value={(form.tags || []).join(', ')} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} placeholder="e.g. onboarding, client, welcome" className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'trigger' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-semibold text-white">Trigger Configuration</h3>
            <p className="text-sm text-slate-400">Choose what event starts this automation. Only triggers backed by real project events are listed.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRIGGER_DEFINITIONS.map(t => (
                <button
                  key={t.type}
                  onClick={() => { setForm(prev => ({ ...prev, trigger_type: t.type, trigger_config: { ...blankTriggerConfig(), source: t.source, event: t.type } })); }}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    form.trigger_type === t.type
                      ? 'border-[#06B6D4]/40 bg-[#06B6D4]/5'
                      : 'border-[rgba(255,255,255,0.08)] bg-white/[0.02] hover:border-[rgba(255,255,255,0.15)]'
                  } ${!t.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!t.available}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${form.trigger_type === t.type ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/[0.04] text-slate-400'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${form.trigger_type === t.type ? 'text-[#06B6D4]' : 'text-white'}`}>{t.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 capitalize">via {t.source}</p>
                    {!t.available && <p className="text-[10px] text-amber-500 mt-0.5">Not yet available</p>}
                  </div>
                </button>
              ))}
            </div>

            {selectedTrigger && selectedTrigger.available && selectedTrigger.configFields.length > 0 && (
              <div className="mt-4 p-4 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl space-y-3">
                <h4 className="text-sm font-medium text-white">Trigger Settings</h4>
                {selectedTrigger.configFields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-400 mb-1">{f.label} {f.required && '*'}</label>
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={readTriggerConfigValue(form.trigger_config, f.key)}
                      onChange={e => updateTriggerField(f.key, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                    />
                  </div>
                ))}
              </div>
            )}

            {form.trigger_type === 'webhook_event' && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Security Notice</p>
                    <p className="text-xs text-amber-400/70 mt-1">Webhook secrets are stored securely and never displayed. Rotate regularly and use signed requests.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'conditions' && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Conditions</h3>
                <p className="text-sm text-slate-400 mt-1">Filter which trigger events should continue through the workflow.</p>
              </div>
              <button onClick={addConditionGroup} className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
                <Plus className="w-3.5 h-3.5" /> Add Group
              </button>
            </div>

            {(form.condition_groups || []).length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">No conditions — all trigger events will proceed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(form.condition_groups || []).map((group, gi) => (
                  <div key={group.id} className="bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-medium">Group {gi + 1}</span>
                        <div className="flex bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
                          <button onClick={() => updateConditionGroup(group.id, { logic: 'AND' })} className={`px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer ${group.logic === 'AND' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>AND</button>
                          <button onClick={() => updateConditionGroup(group.id, { logic: 'OR' })} className={`px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer ${group.logic === 'OR' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>OR</button>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => addCondition(group.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-500 hover:text-[#06B6D4] transition-all cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeConditionGroup(group.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.conditions.map((cond, ci) => (
                        <div key={cond.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cond.field}
                            onChange={e => updateCondition(group.id, cond.id, { field: e.target.value })}
                            placeholder="Field"
                            className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                          <select
                            value={cond.operator}
                            onChange={e => updateCondition(group.id, cond.id, { operator: e.target.value as ConditionOperator })}
                            className="w-40 px-2 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                          >
                            {Object.entries(CONDITION_OPERATOR_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={cond.value}
                            onChange={e => updateCondition(group.id, cond.id, { value: e.target.value })}
                            placeholder="Value"
                            className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                          <button onClick={() => removeCondition(group.id, cond.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                    {group.conditions.length === 0 && (
                      <p className="text-xs text-slate-500 mt-2">No conditions in this group — add one above.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'workflow' && (
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Workflow Steps</h3>
                <p className="text-sm text-slate-400 mt-1">Build the sequence executed when this automation triggers.</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => addWorkflowStep('send_email')} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
                  <Mail className="w-3 h-3" /> Email
                </button>
                <button onClick={() => addWorkflowStep('wait')} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg text-[11px] font-medium hover:bg-violet-500/20 transition-all cursor-pointer whitespace-nowrap">
                  <Clock className="w-3 h-3" /> Wait
                </button>
                <button onClick={() => addWorkflowStep('condition_branch')} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] font-medium hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap">
                  <GitBranch className="w-3 h-3" /> Branch
                </button>
                <button onClick={() => addWorkflowStep('stop')} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-medium hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap">
                  <StopCircle className="w-3 h-3" /> Stop
                </button>
              </div>
            </div>

            {(form.workflow_steps || []).length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl">
                <p className="text-sm text-slate-500 mb-3">No steps yet. Add your first step above.</p>
                <button onClick={() => addWorkflowStep('send_email')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
                  <Plus className="w-4 h-4" /> Send Email
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(form.workflow_steps || []).map((step, si) => (
                  <div key={step.id} className="border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-slate-600" />
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        step.type === 'send_email' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                        step.type === 'wait' ? 'bg-violet-500/10 text-violet-400' :
                        step.type === 'condition_branch' ? 'bg-amber-500/10 text-amber-400' :
                        step.type === 'stop' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/[0.04] text-slate-400'
                      }`}>
                        {step.type === 'send_email' && <Mail className="w-3.5 h-3.5" />}
                        {step.type === 'wait' && <Clock className="w-3.5 h-3.5" />}
                        {step.type === 'condition_branch' && <GitBranch className="w-3.5 h-3.5" />}
                        {step.type === 'stop' && <StopCircle className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-white">{step.label || STEP_TYPE_LABELS[step.type]}</p>
                        <p className="text-[11px] text-slate-500">Step {si + 1} — {STEP_TYPE_LABELS[step.type]}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {expandedStep === step.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeWorkflowStep(step.id); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </button>

                    {expandedStep === step.id && (
                      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-white/[0.01] space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Step Label</label>
                          <input
                            type="text"
                            value={step.label}
                            onChange={e => updateWorkflowStep(step.id, { label: e.target.value })}
                            className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                          />
                        </div>

                        {step.type === 'send_email' && (() => {
                          const cfg = step.config as SendEmailConfig;
                          return (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Template *</label>
                                <select
                                  value={cfg.template_id || ''}
                                  onChange={e => updateSendEmailConfig(step.id, { template_id: e.target.value || null })}
                                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                                >
                                  <option value="">Select a template...</option>
                                  {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Subject Override</label>
                                  <input type="text" value={cfg.subject_override || ''} onChange={e => updateSendEmailConfig(step.id, { subject_override: e.target.value })} placeholder="Leave empty for template subject" className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Recipient Field</label>
                                  <input type="text" value={cfg.recipient_field || ''} onChange={e => updateSendEmailConfig(step.id, { recipient_field: e.target.value })} placeholder="{{email}}" className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                  <input type="checkbox" checked={cfg.track_opens} onChange={e => updateSendEmailConfig(step.id, { track_opens: e.target.checked })} className="rounded accent-[#06B6D4]" />
                                  Track opens
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                  <input type="checkbox" checked={cfg.track_clicks} onChange={e => updateSendEmailConfig(step.id, { track_clicks: e.target.checked })} className="rounded accent-[#06B6D4]" />
                                  Track clicks
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                  <input type="checkbox" checked={cfg.respect_suppression} onChange={e => updateSendEmailConfig(step.id, { respect_suppression: e.target.checked })} className="rounded accent-[#06B6D4]" />
                                  Respect suppression
                                </label>
                              </div>
                            </div>
                          );
                        })()}

                        {step.type === 'wait' && (() => {
                          const cfg = step.config as WaitConfig;
                          return (
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Duration</label>
                                <input type="number" value={cfg.duration} onChange={e => updateWaitConfig(step.id, { duration: parseInt(e.target.value) || 0 })} min={1} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Unit</label>
                                <select value={cfg.unit} onChange={e => updateWaitConfig(step.id, { unit: e.target.value as 'minutes' | 'hours' | 'days' })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6">
                                  <option value="minutes">Minutes</option>
                                  <option value="hours">Hours</option>
                                  <option value="days">Days</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Timezone</label>
                                <input type="text" value={cfg.timezone || ''} onChange={e => updateWaitConfig(step.id, { timezone: e.target.value })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                              </div>
                            </div>
                          );
                        })()}

                        {step.type === 'condition_branch' && (() => {
                          const cfg = step.config as ConditionBranchConfig;
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Field</label>
                                  <input type="text" value={cfg.field} onChange={e => updateBranchConfig(step.id, { field: e.target.value })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Operator</label>
                                  <select value={cfg.operator} onChange={e => updateBranchConfig(step.id, { operator: e.target.value as ConditionOperator })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6">
                                    {Object.entries(CONDITION_OPERATOR_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-1">Value</label>
                                  <input type="text" value={cfg.value} onChange={e => updateBranchConfig(step.id, { value: e.target.value })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500">Yes/No branches are represented within the workflow step. Steps after this will continue on the Yes path.</p>
                            </div>
                          );
                        })()}

                        {step.type === 'stop' && (() => {
                          const cfg = step.config as StopConfig;
                          return (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Stop Condition</label>
                                <select value={cfg.stop_condition} onChange={e => updateWorkflowStep(step.id, { config: { ...cfg, stop_condition: e.target.value } })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6">
                                  <option value="goal_completed">Goal Completed</option>
                                  <option value="unsubscribed">Recipient Unsubscribed</option>
                                  <option value="suppressed">Email Suppressed</option>
                                  <option value="status_changed">Record Status Changed</option>
                                  <option value="account_deleted">Account Deleted</option>
                                  <option value="max_steps">Max Steps Reached</option>
                                  <option value="max_time">Max Time Reached</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 mb-1">Reason Note</label>
                                <input type="text" value={cfg.reason} onChange={e => updateWorkflowStep(step.id, { config: { ...cfg, reason: e.target.value } })} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'sender' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-semibold text-white">Sender &amp; Tracking</h3>
            <p className="text-sm text-slate-400">Configure the sender profile and tracking settings for emails sent by this automation.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">From Name *</label>
                <input type="text" value={senderConfig.from_name} onChange={e => setSenderConfig(prev => ({ ...prev, from_name: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">From Email *</label>
                <input type="email" value={senderConfig.from_email} onChange={e => setSenderConfig(prev => ({ ...prev, from_email: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Reply-to Name</label>
                <input type="text" value={senderConfig.reply_to_name} onChange={e => setSenderConfig(prev => ({ ...prev, reply_to_name: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Reply-to Email</label>
                <input type="email" value={senderConfig.reply_to_email} onChange={e => setSenderConfig(prev => ({ ...prev, reply_to_email: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl">
              <p className="text-xs font-medium text-slate-300 mb-2">Verification Status</p>
              <p className={`text-xs ${senderConfig.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                {senderConfig.verified ? 'Sender domain verified' : 'Pending verification'}
              </p>
            </div>
          </div>
        )}

        {currentStep === 'test' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-semibold text-white">Test &amp; Simulation</h3>
            <p className="text-sm text-slate-400">Test your automation before activation. No real emails are sent during simulation.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="flex flex-col items-center gap-3 p-6 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-white/[0.05] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  {simulating ? <div className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Terminal className="w-5 h-5 text-violet-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Run Simulation</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dry-run with sample data</p>
                </div>
              </button>

              <button
                onClick={() => setShowTestSend(true)}
                className="flex flex-col items-center gap-3 p-6 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-white/[0.05] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Send Test Email</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Send to authorised recipients</p>
                </div>
              </button>
            </div>

            {simulationLog.length > 0 && (
              <div className="bg-[#0a0a0c] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 font-mono text-xs text-slate-300 space-y-0.5 max-h-64 overflow-y-auto">
                {simulationLog.map((line, i) => (
                  <p key={i} className={line.startsWith('  ') ? 'pl-4' : ''}>{line}</p>
                ))}
              </div>
            )}

            {showTestSend && (
              <div className="bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Send Test Email</h4>
                  <button onClick={() => { setShowTestSend(false); setTestResult(null); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-all cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Recipient Email *</label>
                  <input type="email" value={testRecipient} onChange={e => setTestRecipient(e.target.value)} placeholder="test@example.com" className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>
                {testResult && (
                  <div className={`p-3 rounded-lg ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className={`text-xs ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>{testResult.message}</p>
                  </div>
                )}
                <button
                  onClick={handleTestSend}
                  disabled={testSending || !testRecipient}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                  {testSending ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-semibold text-white">Review &amp; Activate</h3>
            <p className="text-sm text-slate-400">Review all settings before activation.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Name</span>
                <span className="text-xs font-medium text-white">{form.name || '(not set)'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Category</span>
                <span className="text-xs font-medium text-white capitalize">{AUTOMATION_CATEGORIES.find(c => c.value === form.category)?.label || form.category}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Trigger</span>
                <span className="text-xs font-medium text-white">{TRIGGER_DEFINITIONS.find(t => t.type === form.trigger_type)?.label || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Conditions</span>
                <span className="text-xs font-medium text-white">
                  {form.condition_groups?.reduce((sum, g) => sum + g.conditions.length, 0) || 0} condition(s)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Workflow Steps</span>
                <span className="text-xs font-medium text-white">{form.workflow_steps?.length || 0} step(s)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-400">Sender</span>
                <span className="text-xs font-medium text-white">{senderConfig.from_name} &lt;{senderConfig.from_email}&gt;</span>
              </div>
            </div>

            {!form.name && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">Automation name is required before activation.</p>
              </div>
            )}
            {!form.trigger_type && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">No trigger selected. The automation will never run.</p>
              </div>
            )}
            {(form.workflow_steps || []).length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">No workflow steps defined.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {currentStepIndex > 0 && (
            <button
              onClick={() => setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].key)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
          {currentStepIndex < WIZARD_STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].key)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setConfirmActivate(true)}
              disabled={!form.name || !form.trigger_type}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-4 h-4" /> Activate
            </button>
          )}
        </div>
      </div>

      {confirmActivate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Activate Automation</h3>
                <p className="text-sm text-slate-400 mt-1">
                  This will create an immutable version snapshot and activate the automation. It will process live trigger events immediately.
                </p>
              </div>
            </div>
            <div className="p-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl mb-4">
              <p className="text-xs text-slate-400 mb-1">Automation: <span className="text-white font-medium">{form.name || 'Unnamed'}</span></p>
              <p className="text-xs text-slate-400">Trigger: <span className="text-white">{TRIGGER_DEFINITIONS.find(t => t.type === form.trigger_type)?.label || 'Not set'}</span></p>
            </div>
            <p className="text-xs text-amber-400 mb-4">Activation will not process historical records. No backfill will occur.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmActivate(false)} className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleActivate} disabled={saving} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">
                {saving ? 'Activating...' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
