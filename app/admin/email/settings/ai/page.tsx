'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, RotateCcw, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, Activity } from 'lucide-react';

interface AIConfig {
  ai_enabled: boolean;
  provider: string;
  model: string;
  base_url: string;
  max_input_tokens: number;
  max_output_tokens: number;
  temperature: number;
  request_timeout_ms: number;
  daily_org_limit: number;
  daily_user_limit: number;
  max_generations_per_action: number;
  max_brief_size: number;
  max_selected_text_size: number;
  warning_threshold_pct: number;
  allowed_modules: string[];
  logging_policy: 'full' | 'summary' | 'metadata';
  data_retention_days: number;
}

const DEFAULT_AI_CONFIG: AIConfig = {
  ai_enabled: false,
  provider: 'openai',
  model: 'gpt-4o-mini',
  base_url: 'https://api.openai.com/v1',
  max_input_tokens: 8000,
  max_output_tokens: 4000,
  temperature: 0.7,
  request_timeout_ms: 30000,
  daily_org_limit: 500,
  daily_user_limit: 100,
  max_generations_per_action: 10,
  max_brief_size: 4000,
  max_selected_text_size: 2000,
  warning_threshold_pct: 80,
  allowed_modules: ['subject_lines', 'preview_text', 'rewrite_text', 'draft_from_brief', 'cta_suggestions', 'content_review', 'accessibility_suggestions', 'tone_consistency', 'content_variation', 'content_adaptation', 'plain_text', 'simplify_language', 'make_professional', 'make_friendlier', 'shorten', 'expand'],
  logging_policy: 'summary',
  data_retention_days: 90,
};

const ALL_MODULES = [
  { key: 'subject_lines', label: 'Subject Line Generation' },
  { key: 'preview_text', label: 'Preview Text Generation' },
  { key: 'rewrite_text', label: 'Text Rewrite' },
  { key: 'draft_from_brief', label: 'Draft from Brief' },
  { key: 'cta_suggestions', label: 'CTA Suggestions' },
  { key: 'content_review', label: 'Content Review' },
  { key: 'accessibility_suggestions', label: 'Accessibility Suggestions' },
  { key: 'tone_consistency', label: 'Tone Consistency Check' },
  { key: 'content_variation', label: 'A/B Content Variations' },
  { key: 'content_adaptation', label: 'Content Adaptation' },
  { key: 'plain_text', label: 'Plain Text Conversion' },
  { key: 'simplify_language', label: 'Simplify Language' },
  { key: 'make_professional', label: 'Make Professional' },
  { key: 'make_friendlier', label: 'Make Friendlier' },
  { key: 'shorten', label: 'Shorten' },
  { key: 'expand', label: 'Expand' },
];

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<'unknown' | 'configured' | 'missing'>('unknown');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('email_studio_settings').select('ai_config').maybeSingle();
    if (settings?.ai_config && typeof settings.ai_config === 'object') {
      setConfig({ ...DEFAULT_AI_CONFIG, ...(settings.ai_config as Partial<AIConfig>) });
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-ai-assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ capability: 'test', payload: { test: true } }),
        });
        if (res.status === 500) {
          const data = await res.json();
          if (data.error?.includes('AI_PROVIDER_API_KEY')) setCredentialStatus('missing');
          else setCredentialStatus('configured');
        } else {
          setCredentialStatus('configured');
        }
      } catch { setCredentialStatus('unknown'); }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();
    if (existing) {
      await supabase.from('email_studio_settings').update({
        ai_config: config as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({
        ai_config: config as unknown as Record<string, unknown>,
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleModule = (key: string) => {
    setConfig(prev => {
      const next = prev.allowed_modules.includes(key)
        ? prev.allowed_modules.filter(m => m !== key)
        : [...prev.allowed_modules, key];
      return { ...prev, allowed_modules: next };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">AI Assistant Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure the AI writing assistant. API keys are stored as Supabase Edge Function secrets and never exposed to the browser.
        </p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Enable AI Assistant</h2>
              <p className="text-xs text-slate-500 mt-0.5">When disabled, all AI features are hidden or show a configuration-required state</p>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, ai_enabled: !prev.ai_enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${config.ai_enabled ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.ai_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {credentialStatus === 'missing' && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-300">API Key Not Configured</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Add <code className="bg-amber-500/10 px-1 rounded">AI_PROVIDER_API_KEY</code> in the Supabase Dashboard under Edge Function Secrets for the email-ai-assistant function. Optionally set <code className="bg-amber-500/10 px-1 rounded">AI_PROVIDER</code>, <code className="bg-amber-500/10 px-1 rounded">AI_MODEL</code>, and <code className="bg-amber-500/10 px-1 rounded">AI_BASE_URL</code>.
                </p>
              </div>
            </div>
          )}

          {credentialStatus === 'configured' && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-300">API Key Configured</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">The AI provider is reachable and ready to use.</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Provider Configuration</h2>
          <p className="text-xs text-slate-500 -mt-3 mb-4">These values can be overridden per organisation. Set defaults via Edge Function secrets.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Provider</label>
              <input type="text" value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
              <input type="text" value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Base URL</label>
              <input type="text" value={config.base_url} onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Input Tokens</label>
              <input type="number" value={config.max_input_tokens} onChange={(e) => setConfig({ ...config, max_input_tokens: parseInt(e.target.value) || 8000 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Output Tokens</label>
              <input type="number" value={config.max_output_tokens} onChange={(e) => setConfig({ ...config, max_output_tokens: parseInt(e.target.value) || 4000 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Temperature (0-2)</label>
              <input type="number" value={config.temperature} onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
                min={0} max={2} step={0.1}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Request Timeout (ms)</label>
              <input type="number" value={config.request_timeout_ms} onChange={(e) => setConfig({ ...config, request_timeout_ms: parseInt(e.target.value) || 30000 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Usage Limits & Cost Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Organisation Limit</label>
              <input type="number" value={config.daily_org_limit} onChange={(e) => setConfig({ ...config, daily_org_limit: parseInt(e.target.value) || 500 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Per-User Limit</label>
              <input type="number" value={config.daily_user_limit} onChange={(e) => setConfig({ ...config, daily_user_limit: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Generations Per Action</label>
              <input type="number" value={config.max_generations_per_action} onChange={(e) => setConfig({ ...config, max_generations_per_action: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Warning Threshold (%)</label>
              <input type="number" value={config.warning_threshold_pct} onChange={(e) => setConfig({ ...config, warning_threshold_pct: parseInt(e.target.value) || 80 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Brief Size (chars)</label>
              <input type="number" value={config.max_brief_size} onChange={(e) => setConfig({ ...config, max_brief_size: parseInt(e.target.value) || 4000 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Selected Text Size (chars)</label>
              <input type="number" value={config.max_selected_text_size} onChange={(e) => setConfig({ ...config, max_selected_text_size: parseInt(e.target.value) || 2000 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Allowed AI Capabilities</h2>
          <p className="text-xs text-slate-500 -mt-3 mb-4">Select which AI actions are available to users. Disabled actions are hidden from the UI.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ALL_MODULES.map(mod => (
              <label key={mod.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allowed_modules.includes(mod.key)}
                  onChange={() => toggleModule(mod.key)}
                  className="w-4 h-4 rounded border-[rgba(255,255,255,0.15)] bg-transparent text-[#06B6D4] focus:ring-[#06B6D4]/20"
                />
                <span className="text-sm text-slate-300">{mod.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Privacy & Data Handling</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Logging Policy</label>
              <select value={config.logging_policy} onChange={(e) => setConfig({ ...config, logging_policy: e.target.value as AIConfig['logging_policy'] })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
              >
                <option value="full">Full — log prompts and responses</option>
                <option value="summary">Summary — log metadata only (recommended)</option>
                <option value="metadata">Metadata — request counts only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Data Retention (days)</label>
              <input type="number" value={config.data_retention_days} onChange={(e) => setConfig({ ...config, data_retention_days: parseInt(e.target.value) || 90 })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
          </div>
          <div className="mt-4 bg-[#06B6D4]/[0.04] border border-[#06B6D4]/10 rounded-xl p-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#06B6D4]">Data Minimisation</p>
                <p className="text-xs text-[#06B6D4]/70 mt-0.5">
                  AI requests automatically exclude recipient lists, email addresses, provider credentials, hidden editor metadata, private comments, and audit history. Only the selected email content or brief is sent.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save Settings'}
          </button>
          <button onClick={() => setConfig(DEFAULT_AI_CONFIG)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}