'use client';

import { useState } from 'react';
import { ArrowLeft, ShieldCheck, Link2, Clock, Eye, Ban, Download, Bell } from 'lucide-react';
import Link from 'next/link';

export default function ExternalReviewsSettings() {
  const [linkExpiryDays, setLinkExpiryDays] = useState(14);
  const [maxViews, setMaxViews] = useState(5);
  const [requireVerification, setRequireVerification] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [revokeOnDecision, setRevokeOnDecision] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(false);
  const [nameConfirmation, setNameConfirmation] = useState(false);
  const [rateLimit, setRateLimit] = useState(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">External Review Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure secure review links, access controls, approval policies and portal behaviour</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h2 className="text-base font-semibold text-white">Link & Token Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Link Expiry (days)</label>
                <span className="text-sm font-bold text-[#06B6D4]">{linkExpiryDays}</span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                value={linkExpiryDays}
                onChange={(e) => setLinkExpiryDays(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#06B6D4] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Maximum Views Per Link</label>
                <span className="text-sm font-bold text-[#06B6D4]">{maxViews === 50 ? 'Unlimited' : maxViews}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={maxViews}
                onChange={(e) => setMaxViews(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#06B6D4] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300">Rate Limit (requests/min)</label>
                <span className="text-sm font-bold text-[#06B6D4]">{rateLimit}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full h-2 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#06B6D4] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Security & Access Controls</h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'requireVerification', label: 'Email Verification for Legal/Compliance', desc: 'Require one-time verification code for sensitive review types', value: requireVerification, setter: setRequireVerification },
              { key: 'nameConfirmation', label: 'Name Confirmation on First View', desc: 'Prompt reviewers to confirm their display name before viewing', value: nameConfirmation, setter: setNameConfirmation },
              { key: 'watermarkEnabled', label: 'Watermark Previews', desc: 'Overlay reviewer name, date and Confidential label on previews', value: watermarkEnabled, setter: setWatermarkEnabled },
              { key: 'revokeOnDecision', label: 'Revoke Link on Decision', desc: 'Automatically revoke access when reviewer submits their decision', value: revokeOnDecision, setter: setRevokeOnDecision },
              { key: 'allowDownloads', label: 'Allow Evidence Downloads', desc: 'Permit reviewers to download PDF evidence of the review', value: allowDownloads, setter: setAllowDownloads },
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl cursor-pointer hover:border-[rgba(255,255,255,0.08)] transition-colors">
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-white/[0.06] border-[rgba(255,255,255,0.15)] text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer"
                />
                <div>
                  <span className="text-sm text-white block">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Notification Defaults</h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Notify owner on first view', enabled: true },
              { label: 'Notify owner on decision submitted', enabled: true },
              { label: 'Notify owner on comment added', enabled: true },
              { label: 'Send reminder 48h before due date', enabled: true },
              { label: 'Send reminder 24h before due date', enabled: true },
              { label: 'Auto-escalate overdue reviews to owner', enabled: false },
            ].map((n) => (
              <label key={n.label} className="flex items-center gap-3 p-2.5 hover:bg-white/[0.02] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={n.enabled}
                  className="w-4 h-4 rounded bg-white/[0.06] border-[rgba(255,255,255,0.15)] text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer"
                />
                <span className="text-sm text-slate-300">{n.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Default Approval Policies</h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Any one required reviewer (default)', desc: 'Single approval from any required reviewer is sufficient', policy: 'any_one' },
              { label: 'All required reviewers', desc: 'Every required reviewer must approve', policy: 'all_required' },
              { label: 'One per reviewer group', desc: 'One approval needed from each designated group', policy: 'one_per_group' },
              { label: 'Legal + product owner', desc: 'Both legal counsel and product owner must approve', policy: 'legal_plus_product' },
              { label: 'External then internal final sign-off', desc: 'External approval required before internal release', policy: 'external_then_internal' },
            ].map((p) => (
              <label key={p.policy} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl cursor-pointer hover:border-[rgba(255,255,255,0.08)] transition-colors">
                <input
                  type="radio"
                  name="defaultPolicy"
                  defaultChecked={p.policy === 'any_one'}
                  className="mt-0.5 w-4 h-4 text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer"
                />
                <div>
                  <span className="text-sm text-white block">{p.label}</span>
                  <span className="text-xs text-slate-500">{p.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button className="px-5 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          Cancel
        </button>
        <button className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10">
          Save Settings
        </button>
      </div>
    </div>
  );
}