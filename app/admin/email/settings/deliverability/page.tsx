'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, ArrowLeft, Save, RefreshCw, AlertTriangle,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import { DEFAULT_DELIVERABILITY_CONFIG, type DeliverabilityConfig } from '@/components/admin/email/settings/settings-types';

export default function DeliverabilitySettingsPage() {
  const [config, setConfig] = useState<DeliverabilityConfig>(DEFAULT_DELIVERABILITY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_deliverability_settings').select('*').maybeSingle();
    if (data && data.settings) {
      setConfig({ ...DEFAULT_DELIVERABILITY_CONFIG, ...(data.settings as Partial<DeliverabilityConfig>) });
      setLastUpdated(data.updated_at);
    }
    setLoading(false);
  };

  const handleChange = (key: keyof DeliverabilityConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('email_deliverability_settings').upsert({
      organisation_id: null,
      settings: config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organisation_id' });
    if (!error) {
      setSaved(true);
      setHasChanges(false);
      setLastUpdated(new Date().toISOString());
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_DELIVERABILITY_CONFIG);
    setHasChanges(true);
    setSaved(false);
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Deliverability Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure bounce thresholds, rate limits and sending safeguards</p>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Organisation Settings</h2>
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-slate-500">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
            <div>
              <p className="text-sm text-white font-medium">Default Open/Click Tracking</p>
              <p className="text-xs text-slate-500 mt-0.5">Enable tracking for new campaigns by default</p>
            </div>
            <button
              onClick={() => handleChange('tracking_default', config.tracking_default === 'enabled' ? 'disabled' : 'enabled')}
              className={`w-12 h-7 rounded-full transition-all cursor-pointer flex items-center ${config.tracking_default === 'enabled' ? 'bg-[#06B6D4] justify-end' : 'bg-white/[0.08] justify-start'} px-1`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Hard Bounce Threshold (%)</label>
              <input
                type="number"
                min={0} max={100}
                value={config.bounce_threshold_hard}
                onChange={(e) => handleChange('bounce_threshold_hard', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Pause sending if hard bounce rate exceeds this</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Soft Bounce Threshold (%)</label>
              <input
                type="number"
                min={0} max={100}
                value={config.bounce_threshold_soft}
                onChange={(e) => handleChange('bounce_threshold_soft', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Pause sending if soft bounce rate exceeds this</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Complaint Warning Threshold (%)</label>
              <input
                type="number"
                min={0} max={100}
                step={0.1}
                value={config.complaint_warning_threshold}
                onChange={(e) => handleChange('complaint_warning_threshold', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Alert when complaint rate exceeds this threshold</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Soft Bounce Retry Limit</label>
              <input
                type="number"
                min={0} max={10}
                value={config.soft_bounce_retry_limit}
                onChange={(e) => handleChange('soft_bounce_retry_limit', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Max retries before converting to permanent suppression</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Send Limit</label>
              <input
                type="number"
                min={0}
                placeholder="Unlimited"
                value={config.daily_send_limit || ''}
                onChange={(e) => handleChange('daily_send_limit', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Leave empty for no daily limit</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Hourly Send Limit</label>
              <input
                type="number"
                min={0}
                placeholder="Unlimited"
                value={config.hourly_send_limit || ''}
                onChange={(e) => handleChange('hourly_send_limit', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
              <p className="text-[10px] text-slate-500 mt-1">Leave empty for no hourly limit</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Large Send Confirmation Threshold</label>
            <input
              type="number"
              min={1}
              value={config.large_send_confirmation_threshold}
              onChange={(e) => handleChange('large_send_confirmation_threshold', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
            />
            <p className="text-[10px] text-slate-500 mt-1">Require explicit confirmation when sending to more than this many recipients</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
            <div>
              <p className="text-sm text-white font-medium">Suppression Rules</p>
              <p className="text-xs text-slate-500 mt-0.5">Strict: never override. Standard: allow authorised overrides for manual suppressions only</p>
            </div>
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
              <button
                onClick={() => handleChange('suppression_rules', 'strict')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${config.suppression_rules === 'strict' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Strict
              </button>
              <button
                onClick={() => handleChange('suppression_rules', 'standard')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${config.suppression_rules === 'standard' ? 'bg-[#06B6D4] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Standard
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
            <div>
              <p className="text-sm text-white font-medium">Provider Fail-Closed</p>
              <p className="text-xs text-slate-500 mt-0.5">When enabled, pause sends on provider failure. When disabled, queue and retry.</p>
            </div>
            <button
              onClick={() => handleChange('provider_fail_closed', !config.provider_fail_closed)}
              className={`w-12 h-7 rounded-full transition-all cursor-pointer flex items-center ${config.provider_fail_closed ? 'bg-[#06B6D4] justify-end' : 'bg-white/[0.08] justify-start'} px-1`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Safeguards Summary</h3>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { label: 'Unverified domain blocking', active: true },
            { label: 'Unresolved merge-tag blocking', active: true },
            { label: 'Missing unsubscribe enforcement (marketing)', active: true },
            { label: 'Complaint/hard-bounce suppression', active: true },
            { label: 'Provider authentication failure pause', active: true },
            { label: `Hard bounce threshold (${config.bounce_threshold_hard}%)`, active: config.bounce_threshold_hard > 0 },
            { label: `Complaint warning threshold (${config.complaint_warning_threshold}%)`, active: config.complaint_warning_threshold > 0 },
            { label: `Large-send confirmation (${config.large_send_confirmation_threshold}+ recipients)`, active: true },
            { label: 'Supplier revalidation after sender changes', active: true },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={s.active ? 'text-slate-300' : 'text-slate-600'}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}