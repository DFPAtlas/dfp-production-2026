'use client';

import { useState } from 'react';
import {
  ShieldCheck, Archive, Clock, Save, RotateCcw, AlertTriangle, CheckCircle2,
  Trash2, FileText, Eye, XCircle,
} from 'lucide-react';

interface RetentionCategory {
  key: string;
  label: string;
  description: string;
  defaultDays: number;
  minDays: number;
  protected: boolean;
}

const RETENTION_CATEGORIES: RetentionCategory[] = [
  { key: 'raw_provider_payloads', label: 'Raw Provider Payloads', description: 'Unprocessed webhook payloads from email providers', defaultDays: 30, minDays: 7, protected: false },
  { key: 'delivery_events', label: 'Delivery Events', description: 'Normalised delivery, bounce and complaint events', defaultDays: 365, minDays: 90, protected: false },
  { key: 'recipient_messages', label: 'Recipient Tracking', description: 'Per-recipient message status and engagement', defaultDays: 365, minDays: 90, protected: false },
  { key: 'test_send_logs', label: 'Test Send Logs', description: 'Internal test and preview send records', defaultDays: 30, minDays: 7, protected: false },
  { key: 'import_files', label: 'Import Files & Errors', description: 'Uploaded CSV files and error reports', defaultDays: 30, minDays: 7, protected: false },
  { key: 'campaign_snapshots', label: 'Campaign Recipient Snapshots', description: 'Audience snapshots taken at campaign send time', defaultDays: 365, minDays: 180, protected: false },
  { key: 'automation_logs', label: 'Automation Execution Logs', description: 'Detailed automation step execution logs', defaultDays: 180, minDays: 90, protected: false },
  { key: 'audit_logs', label: 'Audit Logs', description: 'Email Studio audit trail records', defaultDays: 730, minDays: 365, protected: true },
  { key: 'export_files', label: 'Export Files', description: 'Generated report and data export files', defaultDays: 7, minDays: 1, protected: false },
  { key: 'suppression_evidence', label: 'Suppression Evidence', description: 'Bounce, complaint and unsubscribe evidence records', defaultDays: 2555, minDays: 730, protected: true },
  { key: 'consent_records', label: 'Consent Records', description: 'Email consent and lawful basis ledger entries', defaultDays: 2555, minDays: 730, protected: true },
];

export default function RetentionPage() {
  const [retention, setRetention] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    RETENTION_CATEGORIES.forEach((c) => { initial[c.key] = c.defaultDays; });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<Record<string, number> | null>(null);
  const [dryRunning, setDryRunning] = useState(false);

  const handleReset = () => {
    const initial: Record<string, number> = {};
    RETENTION_CATEGORIES.forEach((c) => { initial[c.key] = c.defaultDays; });
    setRetention(initial);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDryRun = async () => {
    setDryRunning(true);
    await new Promise((r) => setTimeout(r, 1500));
    setDryRunResult({
      delivery_events: 1250,
      recipient_messages: 890,
      test_send_logs: 45,
      import_files: 12,
      campaign_snapshots: 230,
      automation_logs: 560,
      export_files: 3,
    });
    setDryRunning(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Archive className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Retention Settings</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Configure how long Email Studio data is retained. Protected categories cannot be reduced below legal minimums.
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-300">Destructive Settings</h3>
            <p className="text-xs text-amber-400/70 mt-1">
              Reducing retention periods may permanently delete data. Suppression, consent and audit records have minimum retention requirements to maintain compliance. Never reduce these below the legal minimum for your jurisdiction.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-sm font-semibold text-white">Data Categories</h2>
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.03)]">
          {RETENTION_CATEGORIES.map((cat) => (
            <div key={cat.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{cat.label}</p>
                  {cat.protected && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-semibold text-red-400 uppercase">
                      <ShieldCheck className="w-2.5 h-2.5" /> Protected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  value={retention[cat.key]}
                  onChange={(e) => setRetention({ ...retention, [cat.key]: Math.max(cat.minDays, parseInt(e.target.value) || cat.defaultDays) })}
                  min={cat.minDays}
                  className="w-24 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                />
                <span className="text-xs text-slate-500">days</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
            {saved ? 'Saved' : 'Save Retention Settings'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Dry-Run Estimation</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preview how many records would be affected by current retention settings without deleting anything.</p>
          </div>
          <button
            onClick={handleDryRun}
            disabled={dryRunning}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {dryRunning ? (
              <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-300 rounded-full animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {dryRunning ? 'Estimating...' : 'Run Dry-Run Estimate'}
          </button>
        </div>

        {dryRunResult && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(dryRunResult).map(([key, count]) => {
              const cat = RETENTION_CATEGORIES.find((c) => c.key === key);
              return (
                <div key={key} className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{cat?.label || key}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{count.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600">records beyond retention</p>
                </div>
              );
            })}
            <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold text-[#06B6D4] mt-0.5">
                {Object.values(dryRunResult).reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-600">total affected records</p>
            </div>
          </div>
        )}

        {dryRunResult === null && !dryRunning && (
          <p className="text-sm text-slate-500 text-center py-8">Click “Run Dry-Run Estimate” to preview affected records</p>
        )}
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Retention Execution</h3>
            <p className="text-xs text-slate-500 mt-1">
              Retention cleanup runs as a scheduled server-side job, never triggered by simply visiting this page. Suppression, consent and audit records are never deleted — they are archived or anonymised where legally required. All executions produce an audit entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
