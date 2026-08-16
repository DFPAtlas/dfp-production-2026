'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StudioSettings {
  workspace_name: string;
  default_brand_kit_id: string | null;
  default_sender_profile_id: string | null;
  timezone: string;
  date_format: string;
  time_format: string;
  default_email_width: number;
  default_tracking_enabled: boolean;
  require_campaign_approval: boolean;
  require_automation_approval: boolean;
  large_send_threshold: number;
  footer_policy: string;
  internal_support_contact: string;
}

const DEFAULT_SETTINGS: StudioSettings = {
  workspace_name: 'Digital Footprint Email Studio',
  default_brand_kit_id: null,
  default_sender_profile_id: null,
  timezone: 'Europe/London',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  default_email_width: 600,
  default_tracking_enabled: true,
  require_campaign_approval: false,
  require_automation_approval: false,
  large_send_threshold: 1000,
  footer_policy: 'standard',
  internal_support_contact: '',
};

const TIMEZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Asia/Dubai',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [senders, setSenders] = useState<{ id: string; from_name: string; from_email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: existing } = await supabase.from('email_studio_settings').select('*').maybeSingle();
    const { data: brandData } = await supabase.from('email_brand_kits').select('id, name');
    const { data: senderData } = await supabase.from('email_sender_profiles').select('id, from_name, from_email');

    setBrands(brandData || []);
    setSenders(senderData || []);

    if (existing) {
      setSettings({
        workspace_name: existing.workspace_name || DEFAULT_SETTINGS.workspace_name,
        default_brand_kit_id: existing.default_brand_kit_id,
        default_sender_profile_id: existing.default_sender_profile_id,
        timezone: existing.timezone || DEFAULT_SETTINGS.timezone,
        date_format: existing.date_format || DEFAULT_SETTINGS.date_format,
        time_format: existing.time_format || DEFAULT_SETTINGS.time_format,
        default_email_width: existing.default_email_width || DEFAULT_SETTINGS.default_email_width,
        default_tracking_enabled: existing.default_tracking_enabled ?? DEFAULT_SETTINGS.default_tracking_enabled,
        require_campaign_approval: existing.require_campaign_approval ?? DEFAULT_SETTINGS.require_campaign_approval,
        require_automation_approval: existing.require_automation_approval ?? DEFAULT_SETTINGS.require_automation_approval,
        large_send_threshold: existing.large_send_threshold || DEFAULT_SETTINGS.large_send_threshold,
        footer_policy: existing.footer_policy || DEFAULT_SETTINGS.footer_policy,
        internal_support_contact: existing.internal_support_contact || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const { data: existing } = await supabase.from('email_studio_settings').select('id').maybeSingle();

    if (existing) {
      await supabase.from('email_studio_settings').update({
        workspace_name: settings.workspace_name,
        default_brand_kit_id: settings.default_brand_kit_id || null,
        default_sender_profile_id: settings.default_sender_profile_id || null,
        timezone: settings.timezone,
        date_format: settings.date_format,
        time_format: settings.time_format,
        default_email_width: settings.default_email_width,
        default_tracking_enabled: settings.default_tracking_enabled,
        require_campaign_approval: settings.require_campaign_approval,
        require_automation_approval: settings.require_automation_approval,
        large_send_threshold: settings.large_send_threshold,
        footer_policy: settings.footer_policy,
        internal_support_contact: settings.internal_support_contact,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('email_studio_settings').insert({
        workspace_name: settings.workspace_name,
        default_brand_kit_id: settings.default_brand_kit_id || null,
        default_sender_profile_id: settings.default_sender_profile_id || null,
        timezone: settings.timezone,
        date_format: settings.date_format,
        time_format: settings.time_format,
        default_email_width: settings.default_email_width,
        default_tracking_enabled: settings.default_tracking_enabled,
        require_campaign_approval: settings.require_campaign_approval,
        require_automation_approval: settings.require_automation_approval,
        large_send_threshold: settings.large_send_threshold,
        footer_policy: settings.footer_policy,
        internal_support_contact: settings.internal_support_contact,
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
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
            <Settings className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">General Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure workspace defaults, timezone, approval requirements and more.{' '}
          <a href="/admin/email/operations" className="text-[#06B6D4] hover:underline cursor-pointer">View operations guide</a>
        </p>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Workspace Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Workspace Display Name</label>
              <input
                type="text"
                value={settings.workspace_name}
                onChange={(e) => setSettings({ ...settings, workspace_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Internal Support Contact</label>
              <input
                type="email"
                value={settings.internal_support_contact}
                onChange={(e) => setSettings({ ...settings, internal_support_contact: e.target.value })}
                placeholder="support@example.com"
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Brand Kit</label>
              <select
                value={settings.default_brand_kit_id || ''}
                onChange={(e) => setSettings({ ...settings, default_brand_kit_id: e.target.value || null })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                <option value="">None selected</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Sender Profile</label>
              <select
                value={settings.default_sender_profile_id || ''}
                onChange={(e) => setSettings({ ...settings, default_sender_profile_id: e.target.value || null })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                <option value="">None selected</option>
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>{s.from_name} &lt;{s.from_email}&gt;</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Regional Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date Format</label>
              <select
                value={settings.date_format}
                onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                {DATE_FORMATS.map((df) => (
                  <option key={df} value={df}>{df}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Time Format</label>
              <select
                value={settings.time_format}
                onChange={(e) => setSettings({ ...settings, time_format: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Email Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Email Width (px)</label>
              <input
                type="number"
                value={settings.default_email_width}
                onChange={(e) => setSettings({ ...settings, default_email_width: parseInt(e.target.value) || 600 })}
                min={320}
                max={800}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettings({ ...settings, default_tracking_enabled: !settings.default_tracking_enabled })}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.default_tracking_enabled ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.default_tracking_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <div>
                  <p className="text-sm text-white">Default Tracking</p>
                  <p className="text-xs text-slate-500">Enable open and click tracking by default</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Footer Policy</label>
            <select
              value={settings.footer_policy}
              onChange={(e) => setSettings({ ...settings, footer_policy: e.target.value })}
              className="w-full md:w-64 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
            >
              <option value="standard">Standard (address + unsubscribe)</option>
              <option value="minimal">Minimal (unsubscribe only)</option>
              <option value="full">Full (address + unsubscribe + privacy)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Approval Requirements</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, require_campaign_approval: !settings.require_campaign_approval })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.require_campaign_approval ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.require_campaign_approval ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Require Campaign Approval</p>
                <p className="text-xs text-slate-500">Campaigns must be approved before scheduling or sending</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, require_automation_approval: !settings.require_automation_approval })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.require_automation_approval ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.require_automation_approval ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Require Automation Approval</p>
                <p className="text-xs text-slate-500">Automations must be approved before activation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Sending Safeguards</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Large-Send Confirmation Threshold</label>
            <p className="text-xs text-slate-500 mb-2">Require explicit confirmation when sending to more than this many recipients</p>
            <input
              type="number"
              value={settings.large_send_threshold}
              onChange={(e) => setSettings({ ...settings, large_send_threshold: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full md:w-48 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
            />
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Saved' : 'Save Settings'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}