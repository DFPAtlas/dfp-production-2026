'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Eye, RefreshCw, Monitor, Smartphone, AlertTriangle,
  CheckCircle2, XCircle, HelpCircle, ShieldCheck, Search,
  User, Settings, Globe, FileText, Layers,
} from 'lucide-react';

interface PersonalisationField {
  id: string;
  display_name: string;
  stable_key: string;
  data_type: string;
  test_value: string;
  fallback_value: string;
  fallback_policy: string;
  status: string;
  sensitivity: string;
}

interface TestProfile {
  name: string;
  values: Record<string, string>;
}

const BUILT_IN_PROFILES: TestProfile[] = [
  { name: 'Default Sample', values: {} },
  { name: 'Missing Data', values: {} },
  { name: 'New Client', values: { first_name: 'Alex', company_name: '', project_name: '', invoice_amount: '0' } },
  { name: 'Enterprise Client', values: { first_name: 'Victoria', company_name: 'Acme Corporation', project_name: 'Platform Migration', invoice_amount: '45000' } },
  { name: 'International (fr-FR locale)', values: { first_name: 'Camille', company_name: 'Société Générale', locale: 'fr-FR' } },
];

const RESOLUTION_LABELS: Record<string, string> = {
  resolved: 'Resolved',
  fallback_used: 'Fallback Used',
  hidden: 'Block Hidden',
  missing_required: 'Missing Required',
  blocked: 'Blocked (Restricted)',
  not_configured: 'Not Configured',
};

export default function PersonalisationTestData() {
  const [fields, setFields] = useState<PersonalisationField[]>([]);
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [trace, setTrace] = useState<{ field: string; value: string; resolution: string; fallbackUsed: boolean }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('email_personalisation_fields').select('*').order('display_name');
      if (data) {
        setFields(data as PersonalisationField[]);
        const initValues: Record<string, string> = {};
        (data as PersonalisationField[]).forEach(f => {
          initValues[f.stable_key] = f.test_value || '';
        });
        setCustomValues(initValues);
      }
      setLoading(false);
    };
    load();
  }, []);

  const applyProfile = (profileIdx: number) => {
    setSelectedProfile(profileIdx);
    const profile = BUILT_IN_PROFILES[profileIdx];
    if (profileIdx === 1) {
      const empty: Record<string, string> = {};
      fields.forEach(f => { empty[f.stable_key] = ''; });
      setCustomValues(empty);
    } else {
      const merged = { ...customValues, ...profile.values };
      setCustomValues(merged);
    }
  };

  const runTrace = useCallback(() => {
    const results: { field: string; value: string; resolution: string; fallbackUsed: boolean }[] = [];
    fields.forEach(f => {
      const val = customValues[f.stable_key] || '';
      if (f.sensitivity === 'restricted') {
        results.push({ field: f.stable_key, value: '[BLOCKED]', resolution: 'blocked', fallbackUsed: true });
      } else if (f.status !== 'approved') {
        results.push({ field: f.stable_key, value: '', resolution: 'not_configured', fallbackUsed: true });
      } else if (val) {
        results.push({ field: f.stable_key, value: val, resolution: 'resolved', fallbackUsed: false });
      } else if (f.fallback_policy === 'required') {
        results.push({ field: f.stable_key, value: '', resolution: 'missing_required', fallbackUsed: true });
      } else if (f.fallback_policy === 'omit_block') {
        results.push({ field: f.stable_key, value: '', resolution: 'hidden', fallbackUsed: true });
      } else if (f.fallback_value) {
        results.push({ field: f.stable_key, value: f.fallback_value, resolution: 'fallback_used', fallbackUsed: true });
      } else {
        results.push({ field: f.stable_key, value: '', resolution: 'fallback_used', fallbackUsed: false });
      }
    });
    setTrace(results);
  }, [fields, customValues]);

  useEffect(() => { runTrace(); }, [runTrace]);

  const updateCustomValue = (key: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-64 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  const approvedFields = fields.filter(f => f.status === 'approved');
  const restrictedFields = fields.filter(f => f.sensitivity === 'restricted');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/personalisation" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" /> Personalisation
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">Test Preview</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreviewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${previewMode === 'desktop' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
          ><Monitor className="w-3.5 h-3.5" /> Desktop</button>
          <button onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${previewMode === 'mobile' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}
          ><Smartphone className="w-3.5 h-3.5" /> Mobile</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Test Profile</h3>
            <div className="space-y-2">
              {BUILT_IN_PROFILES.map((profile, idx) => (
                <button key={idx} onClick={() => applyProfile(idx)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${selectedProfile === idx ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/[0.02] border border-[rgba(255,255,255,0.04)] text-slate-300 hover:border-[rgba(255,255,255,0.1)]'}`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {profile.name}
                  </div>
                  {idx === 1 && <p className="text-[10px] text-slate-500 mt-1 ml-6">All fields empty — tests fallback behaviour</p>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Custom Values</h3>
            <p className="text-xs text-slate-500 mb-3">Override individual field values for testing. Changes reflect immediately in the trace.</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {approvedFields.map(f => (
                <div key={f.id}>
                  <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    {f.display_name}
                    <span className="text-[9px] text-slate-600 font-mono">{`{{${f.stable_key}}}`}</span>
                  </label>
                  <input type="text" value={customValues[f.stable_key] || ''} onChange={(e) => updateCustomValue(f.stable_key, e.target.value)}
                    placeholder={f.test_value || 'Enter test value...'}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {restrictedFields.length > 0 && (
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-300">{restrictedFields.length} restricted field(s)</p>
                  <p className="text-[10px] text-red-400/70 mt-1">Restricted fields are blocked from personalisation and will always show fallback content.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Inline Preview</h3>
            <div className={`bg-white rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
              <div className="bg-slate-100 px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="ml-2">Subject: {customValues['subject_line'] || 'Your update from Digital Footprint'}</span>
              </div>
              <div className="p-6 space-y-4 min-h-[300px]">
                <p className="text-lg font-bold text-slate-900">
                  {customValues['greeting'] ? `Hi ${customValues['greeting']},` : approvedFields.find(f => f.stable_key === 'first_name')
                    ? `Hi ${customValues['first_name'] || (approvedFields.find(f => f.stable_key === 'first_name')?.fallback_value || 'there')},`
                    : 'Hello,'}
                </p>
                <p className="text-sm text-slate-600">
                  {customValues['project_name'] ? `Your project "${customValues['project_name']}" ` : ''}
                  {customValues['project_status'] ? `is currently: ${customValues['project_status']}.` : 'is progressing well.'}
                </p>
                {customValues['company_name'] && (
                  <p className="text-sm text-slate-500">Company: {customValues['company_name']}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <span className="px-5 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold inline-block">View Details</span>
                  {customValues['invoice_amount'] && parseFloat(customValues['invoice_amount']) > 0 && (
                    <span className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold inline-block">
                      Pay £{parseFloat(customValues['invoice_amount']).toLocaleString()}
                    </span>
                  )}
                </div>
                {approvedFields.filter(f => f.stable_key === 'appointment_date' && customValues[f.stable_key]).length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                    Your appointment: {customValues['appointment_date']}
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <p className="text-[10px] text-slate-400">Digital Footprint Ltd · Registered in England · <span className="text-sky-500 underline">Unsubscribe</span> · <span className="text-sky-500 underline">Preferences</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Resolution Trace</h3>
              <span className="text-[10px] text-slate-500">Internal only — never appears in outgoing email</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.04)]">
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Test Value</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Resolution</th>
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fallback</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.map((t, idx) => (
                    <tr key={idx} className="border-b border-[rgba(255,255,255,0.02)]">
                      <td className="px-3 py-2 text-xs text-slate-300 font-mono">{t.field}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">{t.value || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                          t.resolution === 'resolved' ? 'text-emerald-400' :
                          t.resolution === 'fallback_used' ? 'text-amber-400' :
                          t.resolution === 'missing_required' || t.resolution === 'blocked' ? 'text-red-400' :
                          'text-slate-500'
                        }`}>
                          {t.resolution === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {t.resolution === 'missing_required' && <AlertTriangle className="w-3 h-3" />}
                          {t.resolution === 'blocked' && <XCircle className="w-3 h-3" />}
                          {RESOLUTION_LABELS[t.resolution] || t.resolution}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {t.fallbackUsed ? (
                          <span className="text-[10px] text-amber-400">Yes</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}