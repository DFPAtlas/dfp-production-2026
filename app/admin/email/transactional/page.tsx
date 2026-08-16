'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Plus, Edit3, ToggleLeft, ToggleRight, AlertTriangle,
  CheckCircle, Clock, Mail, Repeat, X,
} from 'lucide-react';
import { TransactionalMapping } from '@/components/admin/email/automations/automation-types';

const DEFAULT_EVENT_DEFINITIONS = [
  { key: 'account_verification', label: 'Account Verification', product: 'Digital Footprint', available: true },
  { key: 'password_reset', label: 'Password Reset', product: 'Digital Footprint', available: true },
  { key: 'login_alert', label: 'Login Alert', product: 'Digital Footprint', available: false },
  { key: 'welcome_email', label: 'Welcome Email', product: 'Digital Footprint', available: true },
  { key: 'invitation', label: 'Invitation', product: 'Digital Footprint', available: true },
  { key: 'payment_receipt', label: 'Payment Receipt', product: 'Digital Footprint', available: true },
  { key: 'payment_failed', label: 'Payment Failed', product: 'Digital Footprint', available: false },
  { key: 'appointment_confirmation', label: 'Appointment Confirmation', product: 'Digital Footprint', available: false },
  { key: 'appointment_reminder', label: 'Appointment Reminder', product: 'Digital Footprint', available: false },
  { key: 'project_status_update', label: 'Project Status Update', product: 'Digital Footprint', available: true },
  { key: 'support_acknowledgement', label: 'Support Acknowledgement', product: 'Digital Footprint', available: false },
  { key: 'security_alert', label: 'Security Alert', product: 'Digital Footprint', available: true },
];

export default function TransactionalPage() {
  const [mappings, setMappings] = useState<TransactionalMapping[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingMapping, setEditingMapping] = useState<TransactionalMapping | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('email_transactional_mappings').select('*').order('event_key');
    if (data) setMappings(data as TransactionalMapping[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase.from('email_templates').select('id, name').in('status', ['active', 'approved']);
      if (data) setTemplates(data);
    };
    loadTemplates();
  }, []);

  const getMappingForEvent = (eventKey: string) => mappings.find(m => m.event_key === eventKey);

  const openEditor = (eventKey: string) => {
    const existing = getMappingForEvent(eventKey);
    const def = DEFAULT_EVENT_DEFINITIONS.find(d => d.key === eventKey);
    if (!def) return;
    setEditingMapping(existing || {
      event_key: def.key,
      internal_name: def.label,
      product_name: def.product,
      trigger_source: 'system',
      template_id: null,
      template_version_id: null,
      sender_config: { from_name: 'Digital Footprint', from_email: 'noreply@digital-footprint.uk', reply_to_name: '', reply_to_email: '', verified: true },
      recipient_mapping: '{{email}}',
      required_merge_tags: [],
      plain_text_fallback: false,
      failure_policy: 'retry',
      status: 'draft',
    });
    setShowEditor(true);
  };

  const handleSaveMapping = async () => {
    if (!editingMapping) return;
    setSaving(true);

    const payload = {
      organisation_id: (await supabase.from('admin_profiles').select('organisation_id').limit(1).maybeSingle())?.data?.organisation_id,
      ...editingMapping,
      updated_at: new Date().toISOString(),
    };

    if (editingMapping.id) {
      await supabase.from('email_transactional_mappings').update(payload).eq('id', editingMapping.id);
    } else {
      await supabase.from('email_transactional_mappings').insert({ ...payload, created_at: new Date().toISOString() });
    }

    setSaving(false);
    setShowEditor(false);
    fetchMappings();
  };

  const handleToggleStatus = async (mapping: TransactionalMapping) => {
    const newStatus = mapping.status === 'active' ? 'paused' : 'active';
    await supabase.from('email_transactional_mappings').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', mapping.id);
    fetchMappings();
  };

  const filtered = DEFAULT_EVENT_DEFINITIONS.filter(d => {
    if (!search) return true;
    return d.label.toLowerCase().includes(search.toLowerCase()) || d.key.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactional Emails</h1>
          <p className="text-sm text-slate-400 mt-1">System-triggered email mappings for account, payment and notification events.</p>
        </div>
        <Link href="/admin/email/automations" className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <Repeat className="w-4 h-4" />
          Automations
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(def => {
            const map = getMappingForEvent(def.key);
            const isConfigured = map && map.template_id;
            const isActive = map?.status === 'active';
            return (
              <div key={def.key} className={`flex items-center gap-4 px-4 py-3 bg-white/[0.02] border rounded-xl transition-all ${
                isActive ? 'border-emerald-500/20' : 'border-[rgba(255,255,255,0.06)]'
              } hover:bg-white/[0.04]`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-slate-500'
                }`}>
                  {isConfigured ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{def.label}</p>
                    {!def.available && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Coming Soon</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="font-mono">{def.key}</span>
                    <span>{def.product}</span>
                    {map?.status && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        map.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                        map.status === 'paused' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {map.status}
                      </span>
                    )}
                    {isConfigured && map.template_id && (
                      <span className="text-slate-600">Template: {templates.find(t => t.id === map.template_id)?.name || map.template_id.slice(0, 8)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {def.available && (
                    <>
                      <button
                        onClick={() => openEditor(def.key)}
                        className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                        {isConfigured ? 'Edit' : 'Configure'}
                      </button>
                      {map?.id && (
                        <button
                          onClick={() => handleToggleStatus(map)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                            isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-white/[0.04]'
                          }`}
                        >
                          {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEditor && editingMapping && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-white">{editingMapping.internal_name}</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{editingMapping.event_key}</p>
              </div>
              <button onClick={() => setShowEditor(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Internal Name</label>
                <input
                  type="text"
                  value={editingMapping.internal_name}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, internal_name: e.target.value } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Key (stable)</label>
                <input
                  type="text"
                  value={editingMapping.event_key}
                  disabled
                  className="w-full px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-600 mt-0.5">Event keys cannot be changed once set.</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Product</label>
                <input
                  type="text"
                  value={editingMapping.product_name}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, product_name: e.target.value } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Template *</label>
                <select
                  value={editingMapping.template_id || ''}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, template_id: e.target.value || null } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From Email</label>
                  <input
                    type="email"
                    value={editingMapping.sender_config?.from_email || ''}
                    onChange={e => setEditingMapping(prev => prev ? { ...prev, sender_config: { ...prev.sender_config!, from_email: e.target.value } } : prev)}
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Recipient Field</label>
                  <input
                    type="text"
                    value={editingMapping.recipient_mapping || ''}
                    onChange={e => setEditingMapping(prev => prev ? { ...prev, recipient_mapping: e.target.value } : prev)}
                    placeholder="{{email}}"
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Required Merge Tags (comma separated)</label>
                <input
                  type="text"
                  value={(editingMapping.required_merge_tags || []).join(', ')}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, required_merge_tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Failure Policy</label>
                <select
                  value={editingMapping.failure_policy}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, failure_policy: e.target.value as TransactionalMapping['failure_policy'] } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                >
                  <option value="retry">Retry (up to 3 attempts)</option>
                  <option value="log_only">Log Only</option>
                  <option value="notify_admin">Notify Admin</option>
                  <option value="discard">Discard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select
                  value={editingMapping.status}
                  onChange={e => setEditingMapping(prev => prev ? { ...prev, status: e.target.value as TransactionalMapping['status'] } : prev)}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-6"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditor(false)} className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleSaveMapping} disabled={saving} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}