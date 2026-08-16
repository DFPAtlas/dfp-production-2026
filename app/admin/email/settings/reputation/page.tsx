'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, ArrowLeft, Settings, Save, Globe, Server, Thermometer,
  AlertTriangle, BarChart3, Clock, Lock, ToggleLeft, ToggleRight,
} from 'lucide-react';

export default function ReputationSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Reputation Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure thresholds, warm-up defaults, blocklist services and incident policies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-white">Deliverability Thresholds</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Delivery Rate (Warning)</label>
                <span className="text-xs font-medium text-amber-400">95%</span>
              </div>
              <input type="range" min="80" max="100" defaultValue={95} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>80%</span><span>100%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Delivery Rate (Critical)</label>
                <span className="text-xs font-medium text-red-400">90%</span>
              </div>
              <input type="range" min="80" max="100" defaultValue={90} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>80%</span><span>100%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Bounce Rate (Warning)</label>
                <span className="text-xs font-medium text-amber-400">2%</span>
              </div>
              <input type="range" min="0" max="10" defaultValue={2} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0%</span><span>10%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Bounce Rate (Critical)</label>
                <span className="text-xs font-medium text-red-400">5%</span>
              </div>
              <input type="range" min="0" max="10" defaultValue={5} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0%</span><span>10%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Complaint Rate (Warning)</label>
                <span className="text-xs font-medium text-amber-400">0.1%</span>
              </div>
              <input type="range" min="0" max="2" defaultValue={0.1} step={0.05} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0%</span><span>2%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Complaint Rate (Critical)</label>
                <span className="text-xs font-medium text-red-400">0.3%</span>
              </div>
              <input type="range" min="0" max="2" defaultValue={0.3} step={0.05} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0%</span><span>2%</span></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Unsubscribe Rate (Warning)</label>
                <span className="text-xs font-medium text-amber-400">1%</span>
              </div>
              <input type="range" min="0" max="5" defaultValue={1} className="w-full accent-[#06B6D4]" />
              <div className="flex justify-between text-[10px] text-slate-600"><span>0%</span><span>5%</span></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-[#06B6D4]" />
              <h2 className="text-sm font-bold text-white">Warm-up Defaults</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Default Stages</label>
                <select className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none cursor-pointer pr-8">
                  <option value="5">5 stages (recommended)</option>
                  <option value="4">4 stages</option>
                  <option value="3">3 stages (fast-track)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Minimum Observation Period (days)</label>
                <select className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none cursor-pointer pr-8">
                  <option value="2">2 days</option>
                  <option value="3">3 days (recommended)</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Minimum Recipients Per Stage</label>
                <input type="number" defaultValue={100} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Disable Automatic Stage Advancement</p>
                  <p className="text-[10px] text-slate-500">Requires manual review for each stage</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Require Owner Approval for Advancement</p>
                  <p className="text-[10px] text-slate-500">Warm-up owner must approve each stage transition</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#06B6D4]" />
              <h2 className="text-sm font-bold text-white">Incident Auto-Creation</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Auto-create SEV-3 on Threshold Breach</p>
                  <p className="text-[10px] text-slate-500">Create incident when any warning threshold exceeded</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Auto-create SEV-2 on Critical Breach</p>
                  <p className="text-[10px] text-slate-500">Create high-severity incident when critical threshold exceeded</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Auto-create on Blocklist Detection</p>
                  <p className="text-[10px] text-slate-500">Create incident immediately when blocklist listing detected</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs text-slate-300">Auto-contain on SEV-1</p>
                  <p className="text-[10px] text-slate-500">Automatically pause affected sender/profile on SEV-1 detection</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-white/[0.06] flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-slate-500 ml-0 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-white">Blocklist Services</h2>
          </div>

          <div className="space-y-3">
            {['Spamhaus SBL', 'Spamhaus DBL', 'Barracuda', 'SpamCop', 'SURBL', 'Invaluement', 'SORBS'].map((svc) => (
              <div key={svc} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                <div>
                  <p className="text-xs text-slate-300">{svc}</p>
                  <p className="text-[10px] text-slate-500">{svc.includes('Spamhaus') ? 'DNS-based blocklist' : svc === 'SURBL' ? 'URI blocklist' : 'Reputation blocklist'}</p>
                </div>
                <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#06B6D4]" />
            <h2 className="text-sm font-bold text-white">Usage & Cost Controls</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Max Blocklist Checks Per Day</label>
              <input type="number" defaultValue={24} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Max Concurrent Check Jobs</label>
              <input type="number" defaultValue={4} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Check Frequency (hours)</label>
              <select className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none cursor-pointer pr-8">
                <option value="4">Every 4 hours</option>
                <option value="6">Every 6 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs text-slate-300">Block Checks During Incidents</p>
                <p className="text-[10px] text-slate-500">Prevent costly checks during active SEV-1/SEV-2 incidents</p>
              </div>
              <div className="w-9 h-5 rounded-full bg-emerald-400/20 flex items-center cursor-pointer relative">
                <div className="w-4 h-4 rounded-full bg-emerald-400 ml-4 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Anomaly Detection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Sudden volume increase', desc: 'Volume spike vs 7-day baseline', enabled: true },
            { label: 'Delivery decrease', desc: 'Delivery rate drop > 3 percentage points', enabled: true },
            { label: 'Bounce increase', desc: 'Bounce rate spike vs 7-day baseline', enabled: true },
            { label: 'Complaint increase', desc: 'Complaint rate spike vs 7-day baseline', enabled: true },
            { label: 'Deferral/rejection spike', desc: 'Provider rejections or deferrals surge', enabled: true },
            { label: 'Missing provider events', desc: 'Webhook event gap > 15 minutes', enabled: true },
            { label: 'Sender profile change', desc: 'New or modified sender profile detected', enabled: false },
            { label: 'Audience source change', desc: 'Different audience composition detected', enabled: false },
            { label: 'Authentication change', desc: 'SPF/DKIM/DMARC record modification', enabled: true },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
              <div className={`w-8 h-5 rounded-full flex items-center shrink-0 mt-0.5 cursor-pointer relative ${item.enabled ? 'bg-emerald-400/20' : 'bg-white/[0.06]'}`}>
                <div className={`w-4 h-4 rounded-full transition-all ${item.enabled ? 'bg-emerald-400 ml-4' : 'bg-slate-500 ml-0'}`} />
              </div>
              <div>
                <p className="text-xs text-slate-300">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.04)]">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <Link href="/admin/email/settings" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          Cancel
        </Link>
      </div>
    </div>
  );
}