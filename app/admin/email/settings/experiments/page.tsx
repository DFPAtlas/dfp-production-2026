'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface ExperimentConfig {
  max_variants: number;
  min_recipients_per_variant: number;
  default_allocation: string;
  allowed_metrics: string[];
  statistical_method: string;
  decision_threshold: number;
  min_runtime_hours: number;
  guardrails_enabled: boolean;
  automatic_winner_enabled: boolean;
  max_rollout_size: number;
  excluded_transactional_categories: string[];
  approved_experiment_types: string[];
}

const DEFAULTS: ExperimentConfig = {
  max_variants: 4,
  min_recipients_per_variant: 50,
  default_allocation: 'equal',
  allowed_metrics: ['unique_click_rate','click_to_open_rate','conversion_rate','unsubscribe_rate','complaint_rate','hard_bounce_rate','delivery_rate'],
  statistical_method: 'bayesian',
  decision_threshold: 95,
  min_runtime_hours: 24,
  guardrails_enabled: true,
  automatic_winner_enabled: false,
  max_rollout_size: 10000,
  excluded_transactional_categories: ['password_reset','verification','security_alert','legal','payment','safety'],
  approved_experiment_types: ['subject_line','preview_text','sender_name','send_time','heading','introduction','cta_wording','button_style','content_section','full_content','language_variant','layout_variant'],
};

export default function ExperimentSettingsPage() {
  const [config, setConfig] = useState<ExperimentConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(()=>{loadConfig();},[]);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_studio_settings').select('experiment_config').maybeSingle();
    if(data?.experiment_config) setConfig({ ...DEFAULTS, ...(data.experiment_config as Partial<ExperimentConfig>) });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if(existing) await supabase.from('email_studio_settings').update({ experiment_config: config, updated_at: new Date().toISOString() }).eq('id',existing.id);
    else await supabase.from('email_studio_settings').insert({ experiment_config: config });
    setSaving(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),3000);
  };

  const toggleMetric = (metric: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_metrics: prev.allowed_metrics.includes(metric)
        ? prev.allowed_metrics.filter(m=>m!==metric)
        : [...prev.allowed_metrics, metric],
    }));
  };

  const toggleExperimentType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      approved_experiment_types: prev.approved_experiment_types.includes(type)
        ? prev.approved_experiment_types.filter(t=>t!==type)
        : [...prev.approved_experiment_types, type],
    }));
  };

  if(loading) return (<div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-white/[0.04] rounded-lg" /><div className="h-96 bg-[#121215] rounded-2xl" /></div>);

  const METRIC_OPTIONS = [
    {value:'unique_click_rate',label:'Unique Click Rate'},{value:'click_to_open_rate',label:'Click-to-Open Rate'},
    {value:'conversion_rate',label:'Conversion Rate'},{value:'unsubscribe_rate',label:'Unsubscribe Rate'},
    {value:'complaint_rate',label:'Complaint Rate'},{value:'hard_bounce_rate',label:'Hard Bounce Rate'},
    {value:'delivery_rate',label:'Delivery Rate'},{value:'goal_completion',label:'Goal Completion'},
  ];

  const TYPE_OPTIONS = [
    {value:'subject_line',label:'Subject Line'},{value:'preview_text',label:'Preview Text'},
    {value:'sender_name',label:'Sender Name'},{value:'send_time',label:'Send Time'},
    {value:'heading',label:'Heading'},{value:'introduction',label:'Introduction'},
    {value:'cta_wording',label:'CTA Wording'},{value:'button_style',label:'Button Style'},
    {value:'content_section',label:'Content Section'},{value:'full_content',label:'Full Content'},
    {value:'language_variant',label:'Language Variant'},{value:'layout_variant',label:'Layout Variant'},
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Experiment Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure default experiment parameters, limits, and safety policies.
        </p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Variant Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Maximum Variants per Experiment</label>
              <input type="number" value={config.max_variants} onChange={e=>setConfig({...config,max_variants:parseInt(e.target.value)||4})} min={2} max={6} className="w-full md:w-32 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Min Recipients per Variant</label>
              <input type="number" value={config.min_recipients_per_variant} onChange={e=>setConfig({...config,min_recipients_per_variant:parseInt(e.target.value)||50})} min={10} className="w-full md:w-32 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Approved Experiment Types</h2>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(t=>(
              <button key={t.value} onClick={()=>toggleExperimentType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  config.approved_experiment_types.includes(t.value)?'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30':'bg-white/[0.03] text-slate-400 border-[rgba(255,255,255,0.06)] hover:text-white'}`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Allowed Metrics</h2>
          <div className="flex flex-wrap gap-2">
            {METRIC_OPTIONS.map(m=>(
              <button key={m.value} onClick={()=>toggleMetric(m.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  config.allowed_metrics.includes(m.value)?'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30':'bg-white/[0.03] text-slate-400 border-[rgba(255,255,255,0.06)] hover:text-white'}`}
              >{m.label}</button>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Statistical Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Method</label>
              <select value={config.statistical_method} onChange={e=>setConfig({...config,statistical_method:e.target.value})} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8">
                <option value="bayesian">Bayesian</option>
                <option value="frequentist">Frequentist</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Decision Threshold (%)</label>
              <input type="number" value={config.decision_threshold} onChange={e=>setConfig({...config,decision_threshold:parseInt(e.target.value)||95})} min={80} max={99} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Min Runtime (hours)</label>
              <input type="number" value={config.min_runtime_hours} onChange={e=>setConfig({...config,min_runtime_hours:parseInt(e.target.value)||24})} min={1} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Safety Controls</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={()=>setConfig({...config,guardrails_enabled:!config.guardrails_enabled})} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${config.guardrails_enabled?'bg-[#06B6D4]':'bg-white/[0.08]'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.guardrails_enabled?'translate-x-5':'translate-x-1'}`} />
              </button>
              <div><p className="text-sm text-white">Enable Guardrails by Default</p><p className="text-xs text-slate-500">Guardrails pause automatic rollout on safety breaches</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setConfig({...config,automatic_winner_enabled:!config.automatic_winner_enabled})} className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${config.automatic_winner_enabled?'bg-[#06B6D4]':'bg-white/[0.08]'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.automatic_winner_enabled?'translate-x-5':'translate-x-1'}`} />
              </button>
              <div><p className="text-sm text-white">Automatic Winner Selection</p><p className="text-xs text-slate-500">Disabled by default. Requires admin permission, decision threshold met, clean guardrails, approved methods</p></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Rollout Size</label>
              <input type="number" value={config.max_rollout_size} onChange={e=>setConfig({...config,max_rollout_size:parseInt(e.target.value)||10000})} min={1} className="w-full md:w-48 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
              <p className="text-[10px] text-slate-500 mt-1">Maximum recipients for a single winner rollout</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Excluded Transactional Categories</h2>
          <p className="text-xs text-slate-500 mb-3">These categories cannot be used in experiments. They are excluded from experiment source selection.</p>
          <div className="flex flex-wrap gap-2">
            {['password_reset','verification','security_alert','legal','payment','safety','appointment','billing'].map(c=>{
              const isExcluded = config.excluded_transactional_categories.includes(c);
              return (
                <button key={c} onClick={()=>setConfig({...config,excluded_transactional_categories:isExcluded?config.excluded_transactional_categories.filter(t=>t!==c):[...config.excluded_transactional_categories,c]})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                    isExcluded?'bg-red-500/10 text-red-400 border-red-500/20':'bg-white/[0.03] text-slate-400 border-[rgba(255,255,255,0.06)] hover:text-white'}`}
                >{c.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
            {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />:saved?<CheckCircle2 className="w-4 h-4" />:<Save className="w-4 h-4" />}
            {saved?'Saved':'Save Settings'}
          </button>
          <button onClick={()=>setConfig(DEFAULTS)} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}