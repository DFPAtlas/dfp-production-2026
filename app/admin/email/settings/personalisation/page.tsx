'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Save, Wrench, ShieldCheck, Plus, Trash2, X, Check, AlertTriangle,
  RefreshCw, Search, Filter,
} from 'lucide-react';

interface FieldForm {
  display_name: string;
  stable_key: string;
  source_system: string;
  data_type: string;
  description: string;
  sensitivity: string;
  fallback_policy: string;
  fallback_value: string;
  test_value: string;
  status: string;
  purpose_requirement: string;
}

const emptyForm: FieldForm = {
  display_name: '', stable_key: '', source_system: 'leads', data_type: 'text',
  description: '', sensitivity: 'low', fallback_policy: 'static',
  fallback_value: '', test_value: '', status: 'approved', purpose_requirement: '',
};

export default function PersonalisationSettings() {
  const [form, setForm] = useState<FieldForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!form.display_name.trim() || !form.stable_key.trim()) {
      setError('Display name and stable key are required'); return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(form.stable_key)) {
      setError('Stable key must be lowercase alphanumeric with underscores, starting with a letter'); return;
    }

    setSaving(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userId || '').maybeSingle();

    const { error: insertError } = await supabase.from('email_personalisation_fields').upsert({
      display_name: form.display_name.trim(),
      stable_key: form.stable_key.trim(),
      source_system: form.source_system,
      data_type: form.data_type,
      description: form.description,
      sensitivity: form.sensitivity,
      fallback_policy: form.fallback_policy,
      fallback_value: form.fallback_value || null,
      test_value: form.test_value || null,
      status: form.status,
      purpose_requirement: form.purpose_requirement || null,
      organisation_id: profileData?.organisation_id || null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organisation_id, stable_key' });

    if (insertError) { setError(insertError.message); setSaving(false); return; }

    setSaving(false);
    setStatusMsg('Field registered successfully');
    setTimeout(() => { setStatusMsg(''); setShowForm(false); setForm({ ...emptyForm }); }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/personalisation" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Personalisation
        </Link>
        <span className="text-slate-600">/</span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Personalisation Settings</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {statusMsg && <span className="text-[11px] text-emerald-400">{statusMsg}</span>}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Register Field
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>
      )}

      {showForm && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Register Approved Field</h2>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Display Name *</label>
              <input type="text" value={form.display_name} onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="e.g. First Name"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Stable Key *</label>
              <input type="text" value={form.stable_key} onChange={(e) => setForm(prev => ({ ...prev, stable_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                placeholder="e.g. first_name"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source System</label>
              <select value={form.source_system} onChange={(e) => setForm(prev => ({ ...prev, source_system: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                <option value="leads">Leads / Contacts</option>
                <option value="crm">CRM</option>
                <option value="brand">Brand Kit</option>
                <option value="system">System</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data Type</label>
              <select value={form.data_type} onChange={(e) => setForm(prev => ({ ...prev, data_type: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">True/False</option>
                <option value="datetime">Date/Time</option>
                <option value="currency">Currency</option>
                <option value="enum">Choice List</option>
                <option value="list">List</option>
                <option value="url">URL</option>
                <option value="locale">Locale</option>
                <option value="product_ref">Product Reference</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Sensitivity</label>
              <select value={form.sensitivity} onChange={(e) => setForm(prev => ({ ...prev, sensitivity: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                <option value="low">Low — Safe for all emails</option>
                <option value="medium">Medium — Marketing and approved transactional</option>
                <option value="high">High — Transactional only with approval</option>
                <option value="restricted">Restricted — Requires explicit permission</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fallback Policy</label>
              <select value={form.fallback_policy} onChange={(e) => setForm(prev => ({ ...prev, fallback_policy: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                <option value="static">Static fallback text</option>
                <option value="omit_phrase">Omit the containing phrase</option>
                <option value="omit_block">Omit the containing block</option>
                <option value="default_brand">Use brand default</option>
                <option value="required">Required — block rendering if missing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fallback Value</label>
              <input type="text" value={form.fallback_value} onChange={(e) => setForm(prev => ({ ...prev, fallback_value: e.target.value }))}
                placeholder="e.g. Valued customer"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Test Value</label>
              <input type="text" value={form.test_value} onChange={(e) => setForm(prev => ({ ...prev, test_value: e.target.value }))}
                placeholder="e.g. Emily"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
                <option value="approved">Approved</option>
                <option value="needs_review">Needs Review</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Purpose / Consent Requirement</label>
              <input type="text" value={form.purpose_requirement} onChange={(e) => setForm(prev => ({ ...prev, purpose_requirement: e.target.value }))}
                placeholder="e.g. Requires marketing consent"
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description (for internal use)</label>
              <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What this field represents and where it comes from..."
                rows={2} maxLength={300}
                className="w-full px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap"
            >Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? 'Registering...' : 'Register Field'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Restricted Field Types</h3>
          <p className="text-xs text-slate-400 mb-4">The following data categories are blocked or heavily restricted from email personalisation. Fields of these types cannot be registered for use in email content.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Passwords & security answers', 'Authentication tokens',
              'Payment card data', 'Bank account numbers',
              'Government identifiers', 'Medical information',
              'Exact location (GPS)', 'Private support notes',
              'Internal risk scores', 'Protected characteristics',
              'Inferred traits', 'Criminal records',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[11px] text-red-400/80">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Configuration Notes</h3>
          <div className="text-xs text-slate-400 space-y-2">
            <p>1. Register source fields that exist in your CRM, leads table, or brand kit before using them in templates.</p>
            <p>2. Fields are organisation-scoped and will appear in the merge-tag selector once approved.</p>
            <p>3. Each field must have a fallback policy — blank greetings and broken sentences are never acceptable.</p>
            <p>4. Restricted and high-sensitivity fields require additional approval before appearing in outgoing emails.</p>
            <p>5. Changing a field&apos;s status to Deprecated will warn existing content without breaking it.</p>
            <p>6. Dynamic rules are evaluated server-side at send time using immutable approved versions.</p>
            <p>7. Never vary legal, consent, unsubscribe or suppression content through personalisation rules.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/admin/email/personalisation" className="flex items-center gap-2 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Back to Personalisation
        </Link>
        <Link href="/admin/email/personalisation/rules" className="flex items-center gap-2 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          Rule Builder
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 ml-auto rotate-180" />
        </Link>
      </div>
    </div>
  );
}