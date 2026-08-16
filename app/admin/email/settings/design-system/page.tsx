'use client';

import { useState } from 'react';
import {
  Palette, Component, Layers, Package, GitBranch, ShieldCheck,
  Globe, Bell, Lock, AlertTriangle, Eye, Save, RotateCcw, ArrowRight,
} from 'lucide-react';

export default function DesignSystemSettings() {
  const [publishingStatus, setPublishingStatus] = useState<'saved' | 'unsaved'>('saved');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Design System Settings</h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Configure publishing workflows, governance policies, inheritance defaults and integration behaviour.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Publishing Requirements</h3>
              <p className="text-xs text-slate-500">What must be validated before a release can be published</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Validate all tokens and components', desc: 'Run token validation (colour format, contrast, email-safe fallbacks)', enabled: true, locked: true },
              { label: 'Confirm ownership and scope', desc: 'Ensure no brand-scoped items affect another brand without approval', enabled: true, locked: true },
              { label: 'Check dependency impact', desc: 'Run dependency analysis and flag breaking changes', enabled: true, locked: false },
              { label: 'Run compatibility tests', desc: 'Require recent core-client rendering evidence for changed components', enabled: true, locked: false },
              { label: 'Check accessibility compliance', desc: 'Verify contrast ratios, heading order, alt text, and language attributes', enabled: true, locked: false },
              { label: 'Check localisation impact', desc: 'Flag affected translations that need review', enabled: false, locked: false },
              { label: 'Check plain-text output', desc: 'Verify plain-text renders correctly for all affected components and patterns', enabled: true, locked: false },
              { label: 'Check legal components', desc: 'Require legal review for changes to locked legal/unsubscribe components', enabled: true, locked: true },
              { label: 'Generate migration notes', desc: 'Auto-generate migration guidance for breaking changes', enabled: true, locked: false },
              { label: 'Create rollback snapshot', desc: 'Store immutable snapshot of current published state before publishing', enabled: true, locked: true },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    {item.locked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => {}}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
                    item.enabled ? 'bg-[#06B6D4]' : 'bg-slate-700'
                  } ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={item.locked}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Update Policies</h3>
              <p className="text-xs text-slate-500">How dependencies respond to library updates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Draft Templates', desc: 'Auto-update compatible token changes', options: ['Never', 'Notify Only', 'Auto-Update (non-breaking)'], selected: 2 },
              { title: 'Active Templates', desc: 'Never change active or approved content', options: ['Never', 'Notify Only'], selected: 0, locked: true },
              { title: 'Linked Components', desc: 'Policy for linked component instances', options: ['Never', 'Notify Only', 'Require Review', 'Auto-Update Drafts'], selected: 2 },
              { title: 'Campaigns', desc: 'Update policy for campaign dependencies', options: ['Never', 'Notify Only', 'Require Review'], selected: 1 },
              { title: 'Automations', desc: 'Update policy for automation steps', options: ['Never', 'Notify Only', 'Require Review'], selected: 1 },
              { title: 'Transactional Mappings', desc: 'Critical — block on retired deps', options: ['Notify Only', 'Require Review', 'Block on Retired'], selected: 2, locked: true },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] space-y-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-white font-medium">{item.title}</p>
                    {item.locked && <Lock className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {item.options.map((opt, j) => (
                    <button
                      key={j}
                      disabled={item.locked}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        j === item.selected
                          ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20'
                          : 'bg-white/[0.03] text-slate-400 border border-[rgba(255,255,255,0.04)] hover:text-slate-300'
                      } ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Inheritance Chain</h3>
              <p className="text-xs text-slate-500">Default inheritance order for tokens and components</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { level: 1, name: 'Organisation Foundation', desc: 'Base tokens and components shared across the entire organisation' },
              { level: 2, name: 'DFP Default', desc: 'Digital Footprint product defaults — extends organisation foundation' },
              { level: 3, name: 'Brand', desc: 'Brand-specific overrides (GuardianHub, Synqoro, etc.)' },
              { level: 4, name: 'Product', desc: 'Product-level overrides within a brand' },
              { level: 5, name: 'Template / Component Override', desc: 'Individual template or component instance overrides' },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#06B6D4]">{item.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                {item.level > 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Rendering Evidence Requirements</h3>
              <p className="text-xs text-slate-500">When render-test evidence is required before publishing</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Major version releases (breaking changes)', desc: 'Full core-client matrix + mobile + dark mode + images blocked', enabled: true, locked: true },
              { label: 'Minor version releases (compatible additions)', desc: 'Quick check preset (4 core clients)', enabled: true, locked: false },
              { label: 'New components', desc: 'Full compatibility check before first publish', enabled: true, locked: true },
              { label: 'Component variants', desc: 'Core client check for the variant only', enabled: true, locked: false },
              { label: 'Token colour changes', desc: 'Dark-mode check for all affected brands', enabled: true, locked: false },
              { label: 'Legal component changes', desc: 'Full matrix — all clients, all modes', enabled: true, locked: true },
              { label: 'Evidence maximum age', desc: 'Mark evidence outdated after', enabled: true, locked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    {item.locked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                {item.label.includes('maximum age') ? (
                  <select className="ml-4 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 focus:outline-none cursor-pointer pr-8 shrink-0">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                ) : (
                  <button className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${item.enabled ? 'bg-[#06B6D4]' : 'bg-slate-700'} ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={item.locked}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'left-[22px]' : 'left-[2px]'}`} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Notifications</h3>
              <p className="text-xs text-slate-500">Who gets notified about design system changes</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Notify dependency owners on update available', enabled: true },
              { label: 'Notify brand owners on breaking changes affecting their brand', enabled: true, locked: true },
              { label: 'Notify reviewers on ready-for-review items', enabled: true },
              { label: 'Notify editors on deprecation of used components', enabled: true },
              { label: 'Notify on failed migration or bulk update', enabled: true, locked: true },
              { label: 'Notify on new release published', enabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2">
                  {item.locked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                  <p className="text-sm text-white">{item.label}</p>
                </div>
                <button className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${item.enabled ? 'bg-[#06B6D4]' : 'bg-slate-700'} ${item.locked ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={item.locked}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved' : 'Save Settings'}
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}