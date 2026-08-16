'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Key, Webhook, Clock, Globe, CheckCircle2, X, Settings, Save, Lock } from 'lucide-react';

export default function ApiSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <Link href="/admin/email/settings" className="hover:text-white transition-colors cursor-pointer">Settings</Link>
        <span>/</span>
        <span className="text-slate-300">API & Developer Settings</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">API & Developer Settings</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 ml-12">Configure API gateway, rate limits, webhook defaults, sandbox policies and security controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/settings" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#06B6D4]" /> Rate Limits
          </h2>
          {[
            { label: 'Default per-key rate limit', value: '100 req/min', locked: false },
            { label: 'Burst allowance per key', value: '20 requests', locked: false },
            { label: 'Transactional send limit', value: '50 req/min', locked: false },
            { label: 'Automation trigger limit', value: '30 req/min', locked: false },
            { label: 'Webhook replay limit', value: '10 req/min', locked: true },
            { label: 'Sandbox environment limit', value: '200 req/min', locked: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.label}</span>
                {item.locked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <span className={`text-xs font-mono ${item.locked ? 'text-slate-500' : 'text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[#06B6D4]" /> Key Management
          </h2>
          {[
            { label: 'Default key expiry', value: '12 months', locked: false },
            { label: 'Rotation overlap period', value: '48 hours', locked: false },
            { label: 'Max keys per application', value: '5', locked: false },
            { label: 'Require IP restriction for production', value: 'false', locked: false },
            { label: 'Key prefix format', value: 'dfp_{app}_{env}_', locked: true },
            { label: 'Auto-revoke expired keys', value: 'true', locked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.label}</span>
                {item.locked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <span className={`text-xs font-mono ${item.locked ? 'text-slate-500' : 'text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Webhook className="w-4 h-4 text-[#06B6D4]" /> Webhook Defaults
          </h2>
          {[
            { label: 'Default retry policy', value: 'standard (5 retries)', locked: false },
            { label: 'Default timeout', value: '10 seconds', locked: false },
            { label: 'Max timeout', value: '30 seconds', locked: true },
            { label: 'Require signing for production', value: 'true', locked: true },
            { label: 'Max endpoints per app', value: '5', locked: false },
            { label: 'Delivery log retention', value: '90 days', locked: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.label}</span>
                {item.locked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <span className={`text-xs font-mono ${item.locked ? 'text-slate-500' : 'text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#06B6D4]" /> Security & Notifications
          </h2>
          {[
            { label: 'Require HTTPS for all webhooks', value: 'true', locked: true },
            { label: 'Block private IP ranges', value: 'true', locked: true },
            { label: 'Email on key rotation', value: 'enabled', locked: false },
            { label: 'Alert on rate-limit threshold', value: '80%', locked: false },
            { label: 'Alert on webhook failures', value: '>5 in 1 hour', locked: false },
            { label: 'Suspicious activity detection', value: 'enabled', locked: false },
            { label: 'API log retention', value: '30 days', locked: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.label}</span>
                {item.locked && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <span className={`text-xs font-mono ${item.locked ? 'text-slate-500' : 'text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-400/5 border border-red-400/15 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-300 mb-1">Emergency Controls</h3>
            <p className="text-xs text-red-400/80 mb-3">Use these controls with caution. All actions are audited and require confirmation.</p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-red-500/10 border border-red-400/20 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap">
                Suspend All Production Keys
              </button>
              <button className="px-4 py-2 bg-red-500/10 border border-red-400/20 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap">
                Disable All Webhooks
              </button>
              <button className="px-4 py-2 bg-red-500/10 border border-red-400/20 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap">
                Revoke All Sandbox Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}