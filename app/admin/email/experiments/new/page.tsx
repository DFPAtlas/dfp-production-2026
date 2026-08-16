'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Save, ChevronRight, ChevronLeft, Check, Plus, Trash2,
  BeakerIcon, FileText, ClipboardList, Layers, Users, BarChart3, ShieldCheck, Eye,
  AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';

const STEPS = [
  { key: 'details', label: 'Details', icon: BeakerIcon },
  { key: 'source', label: 'Source', icon: FileText },
  { key: 'hypothesis', label: 'Hypothesis', icon: ClipboardList },
  { key: 'variants', label: 'Variants', icon: Layers },
  { key: 'audience', label: 'Audience', icon: Users },
  { key: 'metrics', label: 'Metrics', icon: BarChart3 },
  { key: 'safeguards', label: 'Safeguards', icon: ShieldCheck },
  { key: 'review', label: 'Review', icon: Eye },
];

type WizardStep = typeof STEPS[number]['key'];

interface VariantDef {
  id: string;
  label: string;
  type: 'control'|'variant';
  description: string;
  template_version_id?: string;
  subject_override?: string;
  preview_text_override?: string;
}

interface HypothesisData {
  changes: string;
  reason: string;
  intended_audience: string;
  primary_metric: string;
  expected_direction: string;
  min_practical_improvement: string;
  risks: string;
  decision_rule: string;
}

interface AudienceConfig {
  source_type: 'contact_list'|'saved_audience'|'segment';
  estimated_total: number;
  estimated_eligible: number;
  suppressed: number;
  unsubscribed: number;
  invalid: number;
}

interface AllocationConfig {
  type: 'equal'|'custom'|'holdout';
  holdout_percent?: number;
  variant_percentages?: Record<string, number>;
}

interface MetricsConfig {
  primary: { name: string; description: string };
  secondary: { name: string }[];
  secondary_enabled: string[];
}

interface GuardrailsConfig {
  complaint_rate: { enabled: boolean; threshold: number };
  unsubscribe_rate: { enabled: boolean; threshold: number };
  hard_bounce_rate: { enabled: boolean; threshold: number };
  delivery_rate: { enabled: boolean; threshold: number };
  failure_rate: { enabled: boolean; threshold: number };
}

interface DurationConfig {
  type: 'fixed_end'|'min_runtime'|'min_recipients'|'manual';
  end_date?: string;
  min_hours?: number;
  min_recipients?: number;
}

interface StatisticalMethodConfig {
  method: 'frequentist'|'bayesian';
  confidence_threshold: number;
  min_sample_per_variant: number;
}

interface WizardState {
  name: string;
  description: string;
  brand_kit_id: string;
  source_type: 'campaign'|'automation';
  source_campaign_id: string;
  source_automation_id: string;
  experiment_type: string;
  tags: string[];
  owner_id: string;
  decision_owner_id: string;
  hypothesis: HypothesisData;
  variants: VariantDef[];
  audience_config: AudienceConfig;
  allocation_config: AllocationConfig;
  metrics_config: MetricsConfig;
  guardrails_config: GuardrailsConfig;
  duration_config: DurationConfig;
  statistical_method: StatisticalMethodConfig;
}

const defaultHypothesis = (): HypothesisData => ({
  changes: '', reason: '', intended_audience: '', primary_metric: '', expected_direction: 'increase', min_practical_improvement: '', risks: '', decision_rule: '',
});

const defaultAudience = (): AudienceConfig => ({
  source_type: 'contact_list', estimated_total: 0, estimated_eligible: 0, suppressed: 0, unsubscribed: 0, invalid: 0,
});

const defaultAllocation = (): AllocationConfig => ({ type: 'equal' });

const defaultMetrics = (): MetricsConfig => ({
  primary: { name: 'unique_click_rate', description: 'Unique click rate' },
  secondary: [{ name: 'open_rate' }, { name: 'unsubscribe_rate' }],
  secondary_enabled: [],
});

const defaultGuardrails = (): GuardrailsConfig => ({
  complaint_rate: { enabled: true, threshold: 0.1 },
  unsubscribe_rate: { enabled: true, threshold: 0.5 },
  hard_bounce_rate: { enabled: true, threshold: 2 },
  delivery_rate: { enabled: true, threshold: 95 },
  failure_rate: { enabled: true, threshold: 5 },
});

const defaultDuration = (): DurationConfig => ({ type: 'manual' });

const defaultStats = (): StatisticalMethodConfig => ({
  method: 'bayesian', confidence_threshold: 95, min_sample_per_variant: 100,
});

const createVariant = (type: 'control'|'variant', label: string): VariantDef => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
  label, type, description: '',
});

const EXPERIMENT_TYPES = [
  { value: 'subject_line', label: 'Subject Line' },
  { value: 'preview_text', label: 'Preview Text' },
  { value: 'sender_name', label: 'Sender Name' },
  { value: 'send_time', label: 'Send Time' },
  { value: 'heading', label: 'Heading' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'cta_wording', label: 'CTA Wording' },
  { value: 'button_style', label: 'Button Style' },
  { value: 'content_section', label: 'Content Section' },
  { value: 'full_content', label: 'Full Content' },
  { value: 'language_variant', label: 'Language Variant' },
  { value: 'layout_variant', label: 'Layout Variant' },
];

const PRIMARY_METRICS = [
  { value: 'unique_click_rate', label: 'Unique Click Rate' },
  { value: 'click_to_open_rate', label: 'Click-to-Open Rate' },
  { value: 'conversion_rate', label: 'Conversion Rate' },
  { value: 'unsubscribe_rate', label: 'Unsubscribe Rate' },
  { value: 'complaint_rate', label: 'Complaint Rate' },
  { value: 'hard_bounce_rate', label: 'Hard Bounce Rate' },
  { value: 'delivery_rate', label: 'Delivery Rate' },
  { value: 'goal_completion', label: 'Automation Goal Completion' },
];

export default function NewExperimentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [automations, setAutomations] = useState<{ id: string; name: string }[]>([]);
  const [brandKits, setBrandKits] = useState<{ id: string; name: string }[]>([]);

  const [state, setState] = useState<WizardState>({
    name: '', description: '', brand_kit_id: '', source_type: 'campaign', source_campaign_id: '', source_automation_id: '',
    experiment_type: 'subject_line', tags: [], owner_id: '', decision_owner_id: '',
    hypothesis: defaultHypothesis(),
    variants: [createVariant('control','Control A'), createVariant('variant','Variant B')],
    audience_config: defaultAudience(),
    allocation_config: defaultAllocation(),
    metrics_config: defaultMetrics(),
    guardrails_config: defaultGuardrails(),
    duration_config: defaultDuration(),
    statistical_method: defaultStats(),
  });

  const update = useCallback((patch: Partial<WizardState>) => setState(p=>({...p,...patch})),[]);

  useEffect(() => {
    (async () => {
      const [{data:c},{data:a},{data:b}] = await Promise.all([
        supabase.from('email_campaigns').select('id,name').order('name'),
        supabase.from('email_automations').select('id,name').order('name'),
        supabase.from('email_brand_kits').select('id,name').order('name'),
      ]);
      if(c)setCampaigns(c); if(a)setAutomations(a); if(b)setBrandKits(b);
    })();
  }, []);

  const estimateAudience = async () => {
    const { count: total } = await supabase.from('leads').select('*',{count:'exact',head:true});
    const { count: unsub } = await supabase.from('leads').select('*',{count:'exact',head:true}).eq('do_not_contact',true);
    const { count: invalid } = await supabase.from('leads').select('*',{count:'exact',head:true}).or('email.is.null,email.eq.');
    const t = total||0, u = unsub||0, inv = invalid||0;
    update({ audience_config: { ...state.audience_config, estimated_total:t, suppressed:0, unsubscribed:u, invalid:inv, estimated_eligible:Math.max(0,t-u-inv) } });
  };

  const addVariant = () => {
    if (state.variants.length >= 4) return;
    update({ variants: [...state.variants, createVariant('variant',`Variant ${String.fromCharCode(66+state.variants.length-1)}`)] });
  };

  const removeVariant = (id: string) => {
    if (state.variants.length <= 2) return;
    update({ variants: state.variants.filter(v=>v.id!==id) });
  };

  const updateVariant = (id: string, patch: Partial<VariantDef>) => {
    update({ variants: state.variants.map(v=>v.id===id?{...v,...patch}:v) });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    let orgId: string|null = null;
    if (userId) {
      const { data: profile } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle();
      orgId = profile?.organisation_id||null;
    }
    const payload = {
      name: state.name.trim(),
      description: state.description,
      brand_kit_id: state.brand_kit_id||null,
      source_type: state.source_type,
      source_campaign_id: state.source_campaign_id||null,
      source_automation_id: state.source_automation_id||null,
      experiment_type: state.experiment_type,
      hypothesis: state.hypothesis,
      variants: state.variants,
      audience_config: state.audience_config,
      allocation_config: state.allocation_config,
      metrics_config: state.metrics_config,
      guardrails_config: state.guardrails_config,
      duration_config: state.duration_config,
      statistical_method: state.statistical_method,
      status: 'draft',
      tags: state.tags,
      owner_id: state.owner_id||userId,
      decision_owner_id: state.decision_owner_id||null,
      organisation_id: orgId,
      created_by: userId,
      updated_by: userId,
    };
    const { data, error: insertError } = await supabase.from('email_experiments').insert(payload).select('id').single();
    if (insertError) { setError('Save failed: '+insertError.message); setSaving(false); return; }
    setSaving(false);
    if (data) router.push(`/admin/email/experiments/${data.id}`);
  };

  const stepIndex = STEPS.findIndex(s=>s.key===currentStep);

  const goToStep = (step: WizardStep) => { setCurrentStep(step); setError(''); };

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-3 flex items-center gap-4">
        <Link href="/admin/email/experiments" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Experiments
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-medium text-white truncate">{state.name||'New Experiment'}</span>
        <div className="ml-auto">
          <button onClick={handleSave} disabled={saving||!state.name.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap">
            <Save className="w-3.5 h-3.5" /> {saving?'Saving...':'Save Draft'}
          </button>
        </div>
      </div>

      <div className="border-b border-[rgba(255,255,255,0.06)] px-5">
        <div className="flex items-center gap-0 overflow-x-auto">
          {STEPS.map((s,i)=>{
            const Icon=s.icon;
            const isActive=s.key===currentStep;
            const isDone=i<stepIndex;
            return (
              <button key={s.key} onClick={()=>goToStep(s.key as WizardStep)}
                className={`flex items-center gap-2 px-3 py-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-[1px] ${
                  isActive?'text-[#06B6D4] border-[#06B6D4]':isDone?'text-emerald-400 border-emerald-500/30':'text-slate-500 border-transparent hover:text-slate-300'
                }`}>{isDone?<CheckCircle2 className="w-3.5 h-3.5" />:<Icon className="w-3.5 h-3.5" />}<span className="hidden sm:inline">{s.label}</span></button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>}

        {currentStep==='details'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Experiment Details</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Experiment Name *</label>
              <input type="text" value={state.name} onChange={e=>update({name:e.target.value})} placeholder="e.g. July Subject Line Test" maxLength={100} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={state.description} onChange={e=>update({description:e.target.value})} rows={3} placeholder="Internal description..." maxLength={500} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Brand Kit</label>
                <select value={state.brand_kit_id} onChange={e=>update({brand_kit_id:e.target.value})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  <option value="">DFP Default</option>
                  {brandKits.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Experiment Type</label>
                <select value={state.experiment_type} onChange={e=>update({experiment_type:e.target.value})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  {EXPERIMENT_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
              <input type="text" value={state.tags.join(', ')} onChange={e=>update({tags:e.target.value.split(',').map(t=>t.trim()).filter(Boolean)})} placeholder="e.g. subject-test, q3" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
            </div>
          </div>
        )}

        {currentStep==='source'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Source Campaign or Automation</h2>
            <div className="flex gap-3">
              <button onClick={()=>update({source_type:'campaign'})} className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${state.source_type==='campaign'?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>Campaign</button>
              <button onClick={()=>update({source_type:'automation'})} className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${state.source_type==='automation'?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>Automation</button>
            </div>
            {state.source_type==='campaign'?(
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Campaign</label>
                <select value={state.source_campaign_id} onChange={e=>update({source_campaign_id:e.target.value})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  <option value="">Select a campaign...</option>
                  {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ):(
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Automation</label>
                <select value={state.source_automation_id} onChange={e=>update({source_automation_id:e.target.value})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  <option value="">Select an automation...</option>
                  {automations.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-400/70">For automation experiments, only low-risk send steps are supported. Transactional security emails are excluded.</p>
            </div>
          </div>
        )}

        {currentStep==='hypothesis'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Hypothesis</h2>
            <p className="text-sm text-slate-400">Define what you&apos;re testing and why. All fields help ensure methodological rigour.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What changes? *</label>
              <textarea value={state.hypothesis.changes} onChange={e=>update({hypothesis:{...state.hypothesis,changes:e.target.value}})} rows={2} placeholder="e.g. Testing an urgent subject line versus a calm one" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Why it may improve the result *</label>
              <textarea value={state.hypothesis.reason} onChange={e=>update({hypothesis:{...state.hypothesis,reason:e.target.value}})} rows={2} placeholder="e.g. Urgency creates a sense of immediate action" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Intended Audience</label>
                <input type="text" value={state.hypothesis.intended_audience} onChange={e=>update({hypothesis:{...state.hypothesis,intended_audience:e.target.value}})} placeholder="e.g. All active subscribers" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expected Direction</label>
                <select value={state.hypothesis.expected_direction} onChange={e=>update({hypothesis:{...state.hypothesis,expected_direction:e.target.value}})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                  <option value="any">Either Direction</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Minimum Practical Improvement (%)</label>
              <input type="text" value={state.hypothesis.min_practical_improvement} onChange={e=>update({hypothesis:{...state.hypothesis,min_practical_improvement:e.target.value}})} placeholder="e.g. 2" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Risks</label>
              <textarea value={state.hypothesis.risks} onChange={e=>update({hypothesis:{...state.hypothesis,risks:e.target.value}})} rows={2} placeholder="e.g. Mixed messaging if subject doesn't match body" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Decision Rule *</label>
              <textarea value={state.hypothesis.decision_rule} onChange={e=>update({hypothesis:{...state.hypothesis,decision_rule:e.target.value}})} rows={2} placeholder="e.g. Select variant if probability to be best exceeds 95% and guardrails are clean" className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-y" />
            </div>
          </div>
        )}

        {currentStep==='variants'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Variants</h2>
                <p className="text-sm text-slate-400">{state.variants.length} variant{state.variants.length!==1?'s':''} defined (max 4)</p>
              </div>
              {state.variants.length<4&&<button onClick={addVariant} className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"><Plus className="w-3.5 h-3.5" /> Add Variant</button>}
            </div>
            {state.variants.map((v,i)=>(
              <div key={v.id} className="bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${v.type==='control'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-violet-500/10 text-violet-400 border-violet-500/20'}`}>{v.type==='control'?'Control':'Variant'}</span>
                    <span className="text-sm font-medium text-white">Variant {String.fromCharCode(65+i)}</span>
                  </div>
                  {state.variants.length>2&&<button onClick={()=>removeVariant(v.id)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"><Trash2 className="w-3 h-3" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Label</label>
                    <input type="text" value={v.label} onChange={e=>updateVariant(v.id,{label:e.target.value})} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Description</label>
                    <input type="text" value={v.description} onChange={e=>updateVariant(v.id,{description:e.target.value})} placeholder="What differs" className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  </div>
                  {state.experiment_type==='subject_line'&&(
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-1">Subject Line</label>
                      <input type="text" value={v.subject_override||''} onChange={e=>updateVariant(v.id,{subject_override:e.target.value})} placeholder="Subject line for this variant" maxLength={150} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                    </div>
                  )}
                  {state.experiment_type==='preview_text'&&(
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-1">Preview Text</label>
                      <input type="text" value={v.preview_text_override||''} onChange={e=>updateVariant(v.id,{preview_text_override:e.target.value})} placeholder="Preview text for this variant" maxLength={150} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div><p className="text-sm font-medium text-amber-300">Immutable Snapshots</p><p className="text-xs text-amber-400/70 mt-0.5">When the experiment is approved, all variants become immutable snapshots. They cannot be modified during the experiment.</p></div>
            </div>
          </div>
        )}

        {currentStep==='audience'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Audience & Allocation</h2>
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Audience Estimate</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{label:'Total Contacts',value:state.audience_config.estimated_total},{label:'Eligible',value:state.audience_config.estimated_eligible,color:'text-emerald-400'},{label:'Suppressed',value:state.audience_config.suppressed},{label:'Unsubscribed',value:state.audience_config.unsubscribed}].map(s=>(
                  <div key={s.label} className="bg-white/[0.02] rounded-xl p-3"><p className={`text-xl font-bold ${s.color||'text-white'}`}>{s.value}</p><p className="text-[10px] text-slate-500">{s.label}</p></div>
                ))}
              </div>
              <button onClick={estimateAudience} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Refresh estimate from contacts</button>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Allocation</h3>
              <div className="flex gap-3">
                {[{value:'equal',label:'Equal Split'},{value:'custom',label:'Custom %'},{value:'holdout',label:'Holdout Group'}].map(o=>(
                  <button key={o.value} onClick={()=>update({allocation_config:{...state.allocation_config,type:o.value as AllocationConfig['type']}})} className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${state.allocation_config.type===o.value?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>{o.label}</button>
                ))}
              </div>
              {state.allocation_config.type==='holdout'&&(
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Holdout Percentage</label>
                  <input type="number" value={state.allocation_config.holdout_percent||10} onChange={e=>update({allocation_config:{...state.allocation_config,holdout_percent:parseInt(e.target.value)||0}})} min={0} max={50} className="w-32 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                  <span className="text-xs text-slate-500 ml-2">% held out</span>
                </div>
              )}
              <div className="text-xs text-slate-400 space-y-1">
                {state.allocation_config.type==='equal'&&<p>Each variant: {Math.floor(100/state.variants.length)}% ({Math.floor(state.audience_config.estimated_eligible/state.variants.length)} estimated per variant)</p>}
                <p className="text-[10px] text-slate-600">Assignment is deterministic and stable per experiment. Recipients stay in the same variant.</p>
              </div>
            </div>

            {state.audience_config.estimated_eligible>0&&state.audience_config.estimated_eligible<state.variants.length*50&&(
              <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div><p className="text-sm font-medium text-amber-300">Small Audience Warning</p><p className="text-xs text-amber-400/70 mt-0.5">The eligible audience is small for {state.variants.length} variants. Results may be inconclusive. Consider fewer variants.</p></div>
              </div>
            )}
          </div>
        )}

        {currentStep==='metrics'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Metrics & Duration</h2>
            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Primary Metric *</h3>
              <select value={state.metrics_config.primary.name} onChange={e=>update({metrics_config:{...state.metrics_config,primary:{name:e.target.value,description:PRIMARY_METRICS.find(m=>m.value===e.target.value)?.label||''}}})} className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                {PRIMARY_METRICS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-400/70">Open rate may be distorted by privacy features (Apple Mail Privacy Protection). Use click rate or conversion rate for more reliable results.</p>
              </div>
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Secondary Metrics</h3>
              {state.metrics_config.secondary.map((sec,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <button onClick={()=>{const e=state.metrics_config.secondary_enabled.includes(sec.name)?state.metrics_config.secondary_enabled.filter(n=>n!==sec.name):[...state.metrics_config.secondary_enabled,sec.name];update({metrics_config:{...state.metrics_config,secondary_enabled:e}});}} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${state.metrics_config.secondary_enabled.includes(sec.name)?'bg-[#06B6D4] border-[#06B6D4]':'border-[rgba(255,255,255,0.1)]'}`}>
                    {state.metrics_config.secondary_enabled.includes(sec.name)&&<Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-sm text-slate-300">{sec.name.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Duration</h3>
              <div className="flex gap-3 flex-wrap">
                {[{value:'manual',label:'Manual Stop'},{value:'fixed_end',label:'Fixed End Date'},{value:'min_runtime',label:'Min Runtime'},{value:'min_recipients',label:'Min Recipients'}].map(o=>(
                  <button key={o.value} onClick={()=>update({duration_config:{...state.duration_config,type:o.value as DurationConfig['type']}})} className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${state.duration_config.type===o.value?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>{o.label}</button>
                ))}
              </div>
              {state.duration_config.type==='fixed_end'&&<div><label className="block text-xs text-slate-400 mb-1">End Date</label><input type="date" value={state.duration_config.end_date||''} onChange={e=>update({duration_config:{...state.duration_config,end_date:e.target.value}})} className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" /></div>}
              {state.duration_config.type==='min_runtime'&&<div><label className="block text-xs text-slate-400 mb-1">Minimum Hours</label><input type="number" value={state.duration_config.min_hours||24} onChange={e=>update({duration_config:{...state.duration_config,min_hours:parseInt(e.target.value)||0}})} className="w-32 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" /></div>}
              {state.duration_config.type==='min_recipients'&&<div><label className="block text-xs text-slate-400 mb-1">Min Recipients per Variant</label><input type="number" value={state.duration_config.min_recipients||100} onChange={e=>update({duration_config:{...state.duration_config,min_recipients:parseInt(e.target.value)||0}})} className="w-32 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" /></div>}
            </div>

            <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Statistical Method</h3>
              <div className="flex gap-3">
                <button onClick={()=>update({statistical_method:{...state.statistical_method,method:'bayesian'}})} className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${state.statistical_method.method==='bayesian'?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>Bayesian</button>
                <button onClick={()=>update({statistical_method:{...state.statistical_method,method:'frequentist'}})} className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${state.statistical_method.method==='frequentist'?'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]':'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}>Frequentist</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Confidence Threshold (%)</label>
                  <input type="number" value={state.statistical_method.confidence_threshold} onChange={e=>update({statistical_method:{...state.statistical_method,confidence_threshold:parseInt(e.target.value)||95}})} min={80} max={99} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Min Sample/Variant</label>
                  <input type="number" value={state.statistical_method.min_sample_per_variant} onChange={e=>update({statistical_method:{...state.statistical_method,min_sample_per_variant:parseInt(e.target.value)||100}})} min={30} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep==='safeguards'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Guardrails</h2>
            <p className="text-sm text-slate-400">Configure safety thresholds. If any guardrail is breached, the experiment pauses automatic rollout and alerts operators.</p>
            {[
              {key:'complaint_rate' as const,label:'Complaint Rate',desc:'Spam complaint rate per variant'},
              {key:'unsubscribe_rate' as const,label:'Unsubscribe Rate',desc:'Unsubscribe rate per variant'},
              {key:'hard_bounce_rate' as const,label:'Hard Bounce Rate',desc:'Hard bounce rate per variant'},
              {key:'delivery_rate' as const,label:'Delivery Rate',desc:'Minimum delivery rate per variant'},
              {key:'failure_rate' as const,label:'Failure Rate',desc:'Maximum send failure rate'},
            ].map(g=>(
              <div key={g.key} className="flex items-center gap-4 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <button onClick={()=>update({guardrails_config:{...state.guardrails_config,[g.key]:{...state.guardrails_config[g.key],enabled:!state.guardrails_config[g.key].enabled}}})} className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer shrink-0 ${state.guardrails_config[g.key].enabled?'bg-[#06B6D4] border-[#06B6D4]':'border-[rgba(255,255,255,0.1)]'}`}>
                  {state.guardrails_config[g.key].enabled&&<Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{g.label}</p>
                  <p className="text-[11px] text-slate-500">{g.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={state.guardrails_config[g.key].threshold} onChange={e=>update({guardrails_config:{...state.guardrails_config,[g.key]:{...state.guardrails_config[g.key],threshold:parseFloat(e.target.value)||0}}})} disabled={!state.guardrails_config[g.key].enabled} step="0.1" min={0} max={100} className="w-20 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 disabled:opacity-30" />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            ))}
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-400/70">Guardrail breaches pause automatic rollout, require review, create audit events, and preserve already-submitted sends. Sent emails cannot be recalled.</p>
            </div>
          </div>
        )}

        {currentStep==='review'&&(
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-lg font-bold text-white">Review & Save</h2>
            <p className="text-sm text-slate-400">Review all settings before saving the experiment draft.</p>

            {['Details','Hypothesis','Variants','Audience','Metrics','Safeguards'].map(section=>{
              const missingChecks: string[] = [];
              if (section==='Details' && !state.name.trim()) missingChecks.push('Name required');
              if (section==='Hypothesis' && !state.hypothesis.changes.trim()) missingChecks.push('Changes description required');
              if (section==='Hypothesis' && !state.hypothesis.decision_rule.trim()) missingChecks.push('Decision rule required');
              if (section==='Variants' && state.variants.length<2) missingChecks.push('Minimum 2 variants required');
              const isOk = missingChecks.length === 0;
              return (
                <div key={section} className={`border rounded-xl p-4 ${isOk?'bg-white/[0.02] border-[rgba(255,255,255,0.06)]':'bg-amber-500/[0.04] border-amber-500/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{section}</span>
                    {isOk?<CheckCircle2 className="w-4 h-4 text-emerald-400" />:<AlertTriangle className="w-4 h-4 text-amber-400" />}
                  </div>
                  {section==='Details'&&<p className="text-xs text-slate-500 mt-1">Name: {state.name||'(empty)'} · Type: {EXPERIMENT_TYPES.find(t=>t.value===state.experiment_type)?.label} · Source: {state.source_type}</p>}
                  {section==='Hypothesis'&&<p className="text-xs text-slate-500 mt-1">Changes: {state.hypothesis.changes?.slice(0,60)||'(empty)'} · Decision: {state.hypothesis.decision_rule?.slice(0,60)||'(empty)'}</p>}
                  {section==='Variants'&&<p className="text-xs text-slate-500 mt-1">{state.variants.length} variant(s): {state.variants.map(v=>v.label).join(', ')}</p>}
                  {section==='Audience'&&<p className="text-xs text-slate-500 mt-1">Eligible: {state.audience_config.estimated_eligible} · Allocation: {state.allocation_config.type}</p>}
                  {section==='Metrics'&&<p className="text-xs text-slate-500 mt-1">Primary: {PRIMARY_METRICS.find(m=>m.value===state.metrics_config.primary.name)?.label} · Method: {state.statistical_method.method} · Confidence: {state.statistical_method.confidence_threshold}%</p>}
                  {section==='Safeguards'&&<p className="text-xs text-slate-500 mt-1">{Object.entries(state.guardrails_config).filter(([,v])=>v.enabled).length} guardrails enabled</p>}
                  {missingChecks.map(m=><p key={m} className="text-[10px] text-amber-500 mt-1">· {m}</p>)}
                </div>
              );
            })}

            <button onClick={handleSave} disabled={saving||!state.name.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving?'Saving...':'Save Experiment Draft'}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-3 flex items-center justify-between">
        <button onClick={()=>goToStep(STEPS[Math.max(0,stepIndex-1)].key as WizardStep)} disabled={stepIndex===0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] text-slate-400 text-sm font-medium hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {stepIndex<STEPS.length-1&&(
          <button onClick={()=>goToStep(STEPS[stepIndex+1].key as WizardStep)} className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}