'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Clock, Archive, HardDrive, AlertTriangle,
  ArrowLeft, Save, Bell, Calendar,
} from 'lucide-react';

export default function BackupSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Archive className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Backup Settings</h1>
            <Link href="/admin/email/backups" className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
              <ArrowLeft className="w-3 h-3" /> Back to Backups
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure scheduled backups, retention policies, storage quotas and restore-test cadence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" /> Scheduled Backups
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Daily — Configuration Only', freq: 'Every day at 00:00 UTC', enabled: true },
              { label: 'Weekly — Templates & Brands', freq: 'Every Monday at 00:00 UTC', enabled: true },
              { label: 'Monthly — Complete Studio', freq: '1st of every month at 02:00 UTC', enabled: true },
              { label: 'Pre-Release Auto-Snapshot', freq: 'Before each release deployment', enabled: false },
            ].map((sched, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                <div>
                  <p className="text-sm text-white">{sched.label}</p>
                  <p className="text-xs text-slate-500">{sched.freq}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={sched.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Retention Policy
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Keep Last N Snapshots</label>
              <input type="number" defaultValue={10} min={1} max={100} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Daily Retention (days)</label>
              <input type="number" defaultValue={7} min={1} max={90} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Weekly Retention (weeks)</label>
              <input type="number" defaultValue={4} min={1} max={52} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Monthly Retention (months)</label>
              <input type="number" defaultValue={12} min={1} max={60} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
              <div>
                <p className="text-sm text-white">Protect Pre-Release Snapshots</p>
                <p className="text-xs text-slate-500">Prevent automatic deletion during retention cleanup</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" /> Storage & Quotas
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Storage Quota (MB)</label>
              <div className="flex items-center gap-3">
                <input type="number" defaultValue={500} min={50} max={5000} className="flex-1 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
                <span className="text-xs text-slate-500">21.7 MB used</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Max Concurrent Backup Jobs</label>
              <input type="number" defaultValue={2} min={1} max={5} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Download Link Expiry (hours)</label>
              <input type="number" defaultValue={24} min={1} max={168} className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20" />
            </div>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" /> Verification & Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
              <div>
                <p className="text-sm text-white">Auto-Verify After Creation</p>
                <p className="text-xs text-slate-500">Validate checksums and structure after each backup</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
              <div>
                <p className="text-sm text-white">Restore Test Cadence</p>
                <p className="text-xs text-slate-500">Auto-test latest valid backup every 7 days</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
              <div>
                <p className="text-sm text-white">Failure Alerts</p>
                <p className="text-xs text-slate-500">Notify on backup or restore test failure</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
              <div>
                <p className="text-sm text-white">Quota Warning at 80%</p>
                <p className="text-xs text-slate-500">Alert when storage reaches 80% of quota</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#06B6D4] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-black text-sm font-semibold rounded-xl hover:bg-[#22D3EE] transition-all cursor-pointer whitespace-nowrap">
          <Save className="w-4 h-4" /> {saved ? 'Saved' : 'Save Settings'}
        </button>
        {saved && <span className="text-xs text-emerald-400">Settings saved successfully</span>}
      </div>
    </div>
  );
}