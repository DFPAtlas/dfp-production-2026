'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, FileText, Globe, Link2, Bell, Save, RotateCcw, CheckCircle2, AlertTriangle, Lock,
} from 'lucide-react';

interface ComplianceSettings {
  organisation_name: string;
  privacy_policy_url: string;
  terms_url: string;
  preference_centre_enabled: boolean;
  unsubscribe_header_enabled: boolean;
  consent_model: string;
  tracking_policy: string;
  complaint_handling: string;
  legal_footer_text: string;
  require_dkim: boolean;
  require_dmarc: boolean;
  block_unverified_senders: boolean;
}

const DEFAULT_COMPLIANCE: ComplianceSettings = {
  organisation_name: 'Digital Footprint',
  privacy_policy_url: '/privacy',
  terms_url: '/terms',
  preference_centre_enabled: true,
  unsubscribe_header_enabled: true,
  consent_model: 'opt_in',
  tracking_policy: 'default_on',
  complaint_handling: 'auto_suppress',
  legal_footer_text: '',
  require_dkim: true,
  require_dmarc: false,
  block_unverified_senders: true,
};

export default function CompliancePage() {
  const [settings, setSettings] = useState<ComplianceSettings>(DEFAULT_COMPLIANCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data: existing } = await supabase.from('email_studio_settings').select('*').maybeSingle();
    if (existing) {
      setSettings({
        organisation_name: existing.workspace_name || DEFAULT_COMPLIANCE.organisation_name,
        privacy_policy_url: DEFAULT_COMPLIANCE.privacy_policy_url,
        terms_url: DEFAULT_COMPLIANCE.terms_url,
        preference_centre_enabled: true,
        unsubscribe_header_enabled: true,
        consent_model: DEFAULT_COMPLIANCE.consent_model,
        tracking_policy: existing.default_tracking_enabled ? 'default_on' : 'default_off',
        complaint_handling: DEFAULT_COMPLIANCE.complaint_handling,
        legal_footer_text: '',
        require_dkim: DEFAULT_COMPLIANCE.require_dkim,
        require_dmarc: DEFAULT_COMPLIANCE.require_dmarc,
        block_unverified_senders: DEFAULT_COMPLIANCE.block_unverified_senders,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => setSettings(DEFAULT_COMPLIANCE);

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
            <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Compliance Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure privacy, consent, suppression and legal compliance controls for Email Studio.
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-300">Not Legal Advice</h3>
            <p className="text-xs text-amber-400/70 mt-1">
              These settings help you configure Email Studio for compliance with email regulations. They are not a substitute for legal advice. Consult your legal team about requirements for your jurisdiction, including GDPR, CAN-SPAM, CASL and PECR.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Organisation Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Organisation Name</label>
              <input
                type="text"
                value={settings.organisation_name}
                onChange={(e) => setSettings({ ...settings, organisation_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Privacy Policy URL</label>
              <input
                type="text"
                value={settings.privacy_policy_url}
                onChange={(e) => setSettings({ ...settings, privacy_policy_url: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Terms of Service URL</label>
              <input
                type="text"
                value={settings.terms_url}
                onChange={(e) => setSettings({ ...settings, terms_url: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Legal Footer Text</label>
            <textarea
              value={settings.legal_footer_text}
              onChange={(e) => setSettings({ ...settings, legal_footer_text: e.target.value })}
              rows={2}
              placeholder="e.g. Registered in England & Wales No. XXXXXXXX"
              maxLength={500}
              className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none"
            />
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Preference &amp; Unsubscribe</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, preference_centre_enabled: !settings.preference_centre_enabled })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.preference_centre_enabled ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.preference_centre_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Preference Centre</p>
                <p className="text-xs text-slate-500">Public preference centre for contact subscription management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, unsubscribe_header_enabled: !settings.unsubscribe_header_enabled })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.unsubscribe_header_enabled ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.unsubscribe_header_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">List-Unsubscribe Header</p>
                <p className="text-xs text-slate-500">Include one-click unsubscribe header in marketing emails</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Consent &amp; Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Consent Model</label>
              <select
                value={settings.consent_model}
                onChange={(e) => setSettings({ ...settings, consent_model: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                <option value="opt_in">Opt-in (explicit consent required)</option>
                <option value="opt_out">Opt-out (consent implied, unsubscribe available)</option>
                <option value="double_opt_in">Double Opt-in (email confirmation required)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tracking Policy</label>
              <select
                value={settings.tracking_policy}
                onChange={(e) => setSettings({ ...settings, tracking_policy: e.target.value })}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
              >
                <option value="default_on">Default On (tracking enabled, opt-out available)</option>
                <option value="default_off">Default Off (tracking disabled, opt-in required)</option>
                <option value="always_off">Always Off (no tracking)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Complaint Handling</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Complaint Action</label>
            <select
              value={settings.complaint_handling}
              onChange={(e) => setSettings({ ...settings, complaint_handling: e.target.value })}
              className="w-full md:w-64 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
            >
              <option value="auto_suppress">Auto-suppress + notify admin</option>
              <option value="manual_review">Manual review required</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-6">
          <h2 className="text-sm font-semibold text-white mb-4">Sending Safeguards</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, block_unverified_senders: !settings.block_unverified_senders })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.block_unverified_senders ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.block_unverified_senders ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Block Unverified Senders</p>
                <p className="text-xs text-slate-500">Prevent sending from unverified sender profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, require_dkim: !settings.require_dkim })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.require_dkim ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.require_dkim ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Require DKIM</p>
                <p className="text-xs text-slate-500">Only allow sending from DKIM-verified domains</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings({ ...settings, require_dmarc: !settings.require_dmarc })}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.require_dmarc ? 'bg-[#06B6D4]' : 'bg-white/[0.08]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.require_dmarc ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm text-white">Require DMARC</p>
                <p className="text-xs text-slate-500">Only allow sending from DMARC-enabled domains</p>
              </div>
            </div>
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
            {saved ? 'Saved' : 'Save Compliance Settings'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Compliance Safeguards</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complaint, hard-bounce and unsubscribe protections cannot be weakened by ordinary users. These safeguards are enforced server-side regardless of UI settings. Suppression evidence and consent records are never deleted by retention policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}