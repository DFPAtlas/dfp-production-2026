'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Monitor, ArrowLeft, Save, Plus, X, CheckCircle2,
  AlertTriangle, Eye, Image, Play, ShieldCheck,
} from 'lucide-react';

const DEFAULT_CLIENTS = [
  { key: 'gmail_web', name: 'Gmail Web', platform: 'web', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'gmail_web_dark', name: 'Gmail Web', platform: 'web', mode: 'dark', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'outlook_web', name: 'Outlook Web', platform: 'web', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'outlook_win', name: 'Outlook Windows', platform: 'desktop', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'outlook_mac', name: 'Outlook macOS', platform: 'desktop', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'apple_mail', name: 'Apple Mail', platform: 'desktop', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'apple_mail_dark', name: 'Apple Mail', platform: 'desktop', mode: 'dark', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'thunderbird', name: 'Thunderbird', platform: 'desktop', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'yahoo_web', name: 'Yahoo Mail', platform: 'web', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'gmail_android', name: 'Gmail Android', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'gmail_ios', name: 'Gmail iOS', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'apple_iphone', name: 'Apple Mail iPhone', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'blocking', support: 'supported' },
  { key: 'apple_ipad', name: 'Apple Mail iPad', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'outlook_android', name: 'Outlook Android', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'outlook_ios', name: 'Outlook iOS', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'supported' },
  { key: 'samsung_email', name: 'Samsung Email', platform: 'mobile', mode: 'light', image_state: 'enabled', priority: 'advisory', support: 'unavailable' },
];

const PRESETS = [
  { key: 'quick', name: 'Quick Check', clients: ['gmail_web', 'outlook_win', 'apple_mail', 'gmail_ios'] },
  { key: 'core', name: 'Core Clients', clients: ['gmail_web', 'gmail_web_dark', 'outlook_web', 'outlook_win', 'outlook_mac', 'apple_mail', 'gmail_android', 'gmail_ios'] },
  { key: 'full', name: 'Full Compatibility', clients: DEFAULT_CLIENTS.filter((c) => c.support === 'supported').map((c) => c.key) },
  { key: 'mobile', name: 'Mobile Only', clients: ['gmail_android', 'gmail_ios', 'apple_iphone', 'apple_ipad', 'outlook_android', 'outlook_ios'] },
  { key: 'outlook', name: 'Outlook Focus', clients: ['outlook_win', 'outlook_mac', 'outlook_web', 'outlook_android', 'outlook_ios'] },
  { key: 'dark_mode', name: 'Dark Mode', clients: ['gmail_web_dark', 'apple_mail_dark'] },
  { key: 'images_blocked', name: 'Images Blocked', clients: ['gmail_web_images_off'] },
];

const THRESHOLD_DEFAULTS = {
  minor_warning: 1.0,
  review_required: 3.0,
  blocking_regression: 10.0,
  blank_render: 95.0,
  missing_legal: true,
  missing_cta: true,
  broken_image: true,
  horizontal_overflow: true,
};

export default function RenderingSettings() {
  const [thresholds, setThresholds] = useState(THRESHOLD_DEFAULTS);
  const [maxClients, setMaxClients] = useState(16);
  const [minRecipients, setMinRecipients] = useState(4);
  const [autoApprove, setAutoApprove] = useState(false);
  const [releaseGatePreset, setReleaseGatePreset] = useState('core');
  const [maxResultAge, setMaxResultAge] = useState(7);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Rendering Settings</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Configure renderer, client matrix, thresholds, presets and release gates.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-all cursor-pointer whitespace-nowrap"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-violet-400" /> Renderer Provider
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Provider</label>
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm text-white font-medium">Internal Browser Renderer</p>
                  <p className="text-xs text-slate-500">Isolated Chromium workers — approximations clearly labelled</p>
                </div>
                <span className="ml-auto px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-[10px] font-semibold rounded">Healthy</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Concurrency Limit</label>
              <input type="number" defaultValue={4} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Per-Job Timeout (seconds)</label>
              <input type="number" defaultValue={120} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" /> Visual Regression Thresholds
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Minor Warning ({thresholds.minor_warning}%)</label>
              <input type="range" min={0} max={5} step={0.1} value={thresholds.minor_warning} onChange={(e) => setThresholds({ ...thresholds, minor_warning: parseFloat(e.target.value) })} className="w-full accent-violet-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Review Required ({thresholds.review_required}%)</label>
              <input type="range" min={1} max={10} step={0.1} value={thresholds.review_required} onChange={(e) => setThresholds({ ...thresholds, review_required: parseFloat(e.target.value) })} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Blocking Regression ({thresholds.blocking_regression}%)</label>
              <input type="range" min={5} max={30} step={0.5} value={thresholds.blocking_regression} onChange={(e) => setThresholds({ ...thresholds, blocking_regression: parseFloat(e.target.value) })} className="w-full accent-red-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Blank Render Detection ({thresholds.blank_render}%)</label>
              <input type="range" min={80} max={100} step={1} value={thresholds.blank_render} onChange={(e) => setThresholds({ ...thresholds, blank_render: parseFloat(e.target.value) })} className="w-full accent-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-400" /> Client Matrix
        </h2>
        <p className="text-xs text-slate-500 mb-4">Administrator-controlled list of supported email clients and modes. Unavailable targets are labelled honestly.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mode</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Images</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Support</th>
                <th className="text-left px-4 py-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_CLIENTS.map((c) => (
                <tr key={c.key} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-600">{c.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 capitalize">{c.platform}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 capitalize">{c.mode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 capitalize">{c.image_state}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.support === 'supported' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Supported
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-400/10 text-slate-400 rounded text-[10px] font-semibold">
                        <X className="w-2.5 h-2.5" /> Unavailable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${c.priority === 'blocking' ? 'text-red-400' : 'text-slate-400'}`}>
                      {c.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-violet-400" /> Test Presets
          </h2>
          <div className="space-y-2">
            {PRESETS.map((preset) => (
              <div key={preset.key} className="flex items-center justify-between p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                <div>
                  <p className="text-sm text-white font-medium">{preset.name}</p>
                  <p className="text-[10px] text-slate-500">{preset.clients.length} clients</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{preset.key}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" /> Release Gates
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Required Preset for Activation</label>
              <select value={releaseGatePreset} onChange={(e) => setReleaseGatePreset(e.target.value)} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer pr-8">
                <option value="quick">Quick Check</option>
                <option value="core">Core Clients</option>
                <option value="full">Full Compatibility</option>
                <option value="none">None (Skip gate)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Maximum Result Age (days)</label>
              <input type="number" value={maxResultAge} onChange={(e) => setMaxResultAge(parseInt(e.target.value))} min={1} max={30} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Maximum Clients Per Test</label>
              <input type="number" value={maxClients} onChange={(e) => setMaxClients(parseInt(e.target.value))} min={1} max={30} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} className="w-4 h-4 rounded accent-violet-400" />
              <span className="text-sm text-slate-300">Auto-approve baselines on clean passes</span>
            </label>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-violet-400" /> Critical Checks
          </h2>
          <div className="space-y-3">
            {[
              { key: 'missing_legal', label: 'Missing Legal Content', desc: 'Block if legal footer or unsubscribe missing' },
              { key: 'missing_cta', label: 'Missing CTA', desc: 'Block if primary action button is absent' },
              { key: 'broken_image', label: 'Broken Images', desc: 'Block if any image fails to load' },
              { key: 'horizontal_overflow', label: 'Horizontal Overflow', desc: 'Block if content overflows viewport' },
              { key: 'dark_mode_inversion', label: 'Dark Mode Inversion', desc: 'Warn on uncontrolled color inversion' },
              { key: 'text_clipping', label: 'Text Clipping', desc: 'Warn when text is cut off' },
            ].map((check) => (
              <label key={check.key} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded mt-0.5 accent-violet-400" />
                <div>
                  <p className="text-sm text-white">{check.label}</p>
                  <p className="text-xs text-slate-500">{check.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-violet-400" /> Usage & Cost Controls
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Daily Render Limit</label>
              <input type="number" defaultValue={100} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Monthly Render Limit</label>
              <input type="number" defaultValue={2000} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Per-User Daily Limit</label>
              <input type="number" defaultValue={30} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Screenshot Retention (days)</label>
              <input type="number" defaultValue={90} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}