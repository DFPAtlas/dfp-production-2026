'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  UserCheck, Plus, Search, CheckCircle2, XCircle, Clock,
  ArrowLeft, MoreHorizontal, Filter, Shield, AlertTriangle,
} from 'lucide-react';
import { CLICKABLE_STATUS_LABELS, PROFILE_TYPE_LABELS, type SenderProfile } from '@/components/admin/email/settings/settings-types';

export default function SenderProfilesPage() {
  const [profiles, setProfiles] = useState<SenderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [domains, setDomains] = useState<{ id: string; domain: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    internal_name: '',
    from_name: '',
    from_local: '',
    domain_id: '',
    reply_to_name: '',
    reply_to_email: '',
    brand_kit_id: '',
    profile_type: 'marketing' as string,
  });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadProfiles();
    loadDomains();
    loadBrands();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_sender_profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all((data as SenderProfile[]).map(async (p) => {
        let brandName = '';
        let domainName = '';
        if (p.brand_kit_id) {
          const { data: bk } = await supabase.from('email_brand_kits').select('name').eq('id', p.brand_kit_id).maybeSingle();
          brandName = (bk as { name?: string })?.name || '';
        }
        if (p.sending_domain_id) {
          const { data: sd } = await supabase.from('email_sending_domains').select('domain').eq('id', p.sending_domain_id).maybeSingle();
          domainName = (sd as { domain?: string })?.domain || '';
        }
        return { ...p, brand_name: brandName, domain_name: domainName };
      }));
      setProfiles(enriched);
    }
    setLoading(false);
  };

  const loadDomains = async () => {
    const { data } = await supabase.from('email_sending_domains').select('id, domain').eq('status', 'verified').order('domain');
    setDomains((data || []) as { id: string; domain: string }[]);
  };

  const loadBrands = async () => {
    const { data } = await supabase.from('email_brand_kits').select('id, name').order('name');
    setBrands((data || []) as { id: string; name: string }[]);
  };

  const handleAdd = async () => {
    setAddError('');
    if (!formData.internal_name.trim()) { setAddError('Profile name is required'); return; }
    if (!formData.from_local.trim()) { setAddError('From email local part is required'); return; }
    if (!formData.domain_id) { setAddError('Please select a verified domain'); return; }

    const domain = domains.find((d) => d.id === formData.domain_id);
    if (!domain) { setAddError('Invalid domain selected'); return; }

    const emailRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!emailRegex.test(formData.from_local.trim())) { setAddError('Invalid email local part'); return; }

    setAdding(true);
    const { error } = await supabase.from('email_sender_profiles').insert({
      organisation_id: null,
      brand_kit_id: formData.brand_kit_id || null,
      sending_domain_id: formData.domain_id,
      internal_name: formData.internal_name.trim(),
      from_name: formData.from_name.trim() || null,
      from_email: `${formData.from_local.trim()}@${domain.domain}`,
      reply_to_name: formData.reply_to_name.trim() || null,
      reply_to_email: formData.reply_to_email.trim() || null,
      profile_type: formData.profile_type,
      verification_status: 'unverified',
    });

    if (error) { setAddError('Failed to create profile'); } else {
      setShowAddModal(false);
      setFormData({ internal_name: '', from_name: '', from_local: '', domain_id: '', reply_to_name: '', reply_to_email: '', brand_kit_id: '', profile_type: 'marketing' });
      loadProfiles();
    }
    setAdding(false);
  };

  const handleSetDefault = async (profile: SenderProfile) => {
    await supabase.from('email_sender_profiles').update({ is_default: false }).neq('id', profile.id);
    await supabase.from('email_sender_profiles').update({ is_default: true }).eq('id', profile.id);
    loadProfiles();
    setActionMenuOpen(null);
  };

  const handleToggleStatus = async (profile: SenderProfile) => {
    await supabase.from('email_sender_profiles').update({ status: profile.status === 'disabled' ? 'active' : 'disabled' }).eq('id', profile.id);
    loadProfiles();
    setActionMenuOpen(null);
  };

  const filtered = profiles.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.profile_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.internal_name.toLowerCase().includes(q) || p.from_email.toLowerCase().includes(q) || (p.from_name || '').toLowerCase().includes(q) || (p.brand_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Sender Profiles</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage From addresses, reply-to settings and verified sender identities</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-4 h-4" />
          New Profile
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          <option value="all">All Types</option>
          <option value="marketing">Marketing</option>
          <option value="transactional">Transactional</option>
          <option value="support">Support</option>
          <option value="no_reply">No Reply</option>
          <option value="internal_notification">Internal</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#121215] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No sender profiles</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Create a sender profile to define the From name and email address for your campaigns.
          </p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            New Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((profile) => {
            const verifInfo = CLICKABLE_STATUS_LABELS[profile.verification_status] || { label: profile.verification_status, color: 'text-slate-400 bg-slate-400/10' };
            const typeLabel = PROFILE_TYPE_LABELS[profile.profile_type as keyof typeof PROFILE_TYPE_LABELS] || profile.profile_type;
            return (
              <div key={profile.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${profile.verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">{profile.internal_name}</h3>
                        {profile.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] font-semibold">Default</span>}
                        {profile.is_brand_default && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-semibold">Brand Default</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {profile.from_name ? `${profile.from_name} ` : ''}
                        <span className="text-slate-300">&lt;{profile.from_email}&gt;</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${verifInfo.color}`}>
                          {profile.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {verifInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded-md bg-white/[0.02] border border-[rgba(255,255,255,0.03)]">{typeLabel}</span>
                        {profile.brand_name && <span className="text-[10px] text-slate-500">{profile.brand_name}</span>}
                        {profile.domain_name && <span className="text-[10px] text-slate-500">{profile.domain_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === profile.id ? null : profile.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionMenuOpen === profile.id && (
                      <div className="absolute right-0 top-10 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden z-50">
                        <button onClick={() => handleSetDefault(profile)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <CheckCircle2 className="w-4 h-4" /> Set as Default
                        </button>
                        <button onClick={() => handleToggleStatus(profile)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                          {profile.status === 'disabled' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          {profile.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">New Sender Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Internal Name *</label>
                <input type="text" placeholder="e.g. Marketing Team" value={formData.internal_name} onChange={(e) => setFormData({ ...formData, internal_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">From Name</label>
                  <input type="text" placeholder="Digital Footprint" value={formData.from_name} onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">From Email Local Part *</label>
                  <div className="flex items-center gap-1">
                    <input type="text" placeholder="hello" value={formData.from_local} onChange={(e) => setFormData({ ...formData, from_local: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Sending Domain *</label>
                <select value={formData.domain_id} onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
                  <option value="">Select a verified domain</option>
                  {domains.map((d) => <option key={d.id} value={d.id}>{d.domain}</option>)}
                </select>
                {domains.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">No verified domains available. Verify a domain first.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Reply-To Name</label>
                  <input type="text" placeholder="Support" value={formData.reply_to_name} onChange={(e) => setFormData({ ...formData, reply_to_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Reply-To Email</label>
                  <input type="email" placeholder="support@example.com" value={formData.reply_to_email} onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Profile Type</label>
                  <select value={formData.profile_type} onChange={(e) => setFormData({ ...formData, profile_type: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
                    <option value="marketing">Marketing</option>
                    <option value="transactional">Transactional</option>
                    <option value="support">Support</option>
                    <option value="no_reply">No Reply</option>
                    <option value="internal_notification">Internal Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Brand</label>
                  <select value={formData.brand_kit_id} onChange={(e) => setFormData({ ...formData, brand_kit_id: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
                    <option value="">No brand</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              {addError && (
                <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300">{addError}</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={adding} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap">
                  {adding ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}