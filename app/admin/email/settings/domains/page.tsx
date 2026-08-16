'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Globe, Plus, Search, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertTriangle, ArrowLeft, Copy, ExternalLink, Eye, EyeOff,
  MoreHorizontal, ChevronDown, Ban, Archive, Filter,
} from 'lucide-react';
import { CLICKABLE_STATUS_LABELS, type SendingDomain, type DnsRecord } from '@/components/admin/email/settings/settings-types';

const DOMAIN_NAME_REGEX = /^(?!.*https?:\/\/)(?!.*@)(?!^\d+\.\d+\.\d+\.\d+$)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export default function SendingDomainsPage() {
  const [domains, setDomains] = useState<SendingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<SendingDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [newBrandId, setNewBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
    loadBrands();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_sending_domains').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const enriched = await Promise.all((data as SendingDomain[]).map(async (d) => {
        let brandName = '';
        let senderCount = 0;
        if (d.brand_kit_id) {
          const { data: bk } = await supabase.from('email_brand_kits').select('name').eq('id', d.brand_kit_id).maybeSingle();
          brandName = (bk as { name?: string })?.name || '';
        }
        const { count } = await supabase.from('email_sender_profiles').select('*', { count: 'exact', head: true }).eq('sending_domain_id', d.id);
        senderCount = count || 0;
        return { ...d, brand_name: brandName, sender_count: senderCount };
      }));
      setDomains(enriched);
    }
    setLoading(false);
  };

  const loadBrands = async () => {
    const { data } = await supabase.from('email_brand_kits').select('id, name').order('name');
    setBrands((data || []) as { id: string; name: string }[]);
  };

  const handleAddDomain = async () => {
    setAddError('');
    const clean = newDomain.trim().toLowerCase();
    if (!clean) { setAddError('Domain is required'); return; }
    if (!DOMAIN_NAME_REGEX.test(clean)) { setAddError('Invalid domain format. Enter a plain domain like example.com'); return; }

    const { data: existing } = await supabase.from('email_sending_domains').select('id').eq('domain', clean).maybeSingle();
    if (existing) { setAddError('This domain already exists'); return; }

    setAdding(true);
    const dnsRecords: DnsRecord[] = [
      { type: 'TXT', host: clean, value: `resend-verification=${generateVerificationToken()}`, purpose: 'Domain verification', status: 'pending', ttl: '3600' },
      { type: 'MX', host: clean, value: 'feedback-smtp.us-east-1.amazonses.com', priority: 10, purpose: 'Return path / bounce handling', status: 'pending', ttl: '3600' },
      { type: 'TXT', host: clean, value: 'v=spf1 include:amazonses.com ~all', purpose: 'SPF record for Resend', status: 'pending', ttl: '3600' },
      { type: 'CNAME', host: `resend._domainkey.${clean}`, value: `resend.dkim.${clean.split('.')[0]}.dkim.amazonses.com`, purpose: 'DKIM signature', status: 'pending', ttl: '3600' },
      { type: 'TXT', host: `_dmarc.${clean}`, value: `v=DMARC1; p=none; rua=mailto:dmarc@${clean}`, purpose: 'DMARC policy', status: 'pending', ttl: '3600' },
    ];

    const { error } = await supabase.from('email_sending_domains').insert({
      organisation_id: null,
      brand_kit_id: newBrandId,
      provider_connection_id: null,
      domain: clean,
      status: 'dns_pending',
      dns_records: dnsRecords,
    });

    if (error) { setAddError('Failed to add domain'); } else {
      setShowAddModal(false);
      setNewDomain('');
      setNewBrandId(null);
      loadDomains();
    }
    setAdding(false);
  };

  const handleCheckDns = async (domain: SendingDomain) => {
    setChecking((prev) => ({ ...prev, [domain.id]: true }));
    const now = new Date().toISOString();
    await supabase.from('email_sending_domains').update({
      last_checked_at: now,
      status: 'verified',
    }).eq('id', domain.id);
    await loadDomains();
    setChecking((prev) => ({ ...prev, [domain.id]: false }));
  };

  const handleToggleStatus = async (domain: SendingDomain) => {
    const newStatus = domain.status === 'disabled' ? 'verified' : 'disabled';
    await supabase.from('email_sending_domains').update({ status: newStatus }).eq('id', domain.id);
    loadDomains();
    setActionMenuOpen(null);
  };

  const handleSetDefault = async (domain: SendingDomain) => {
    await supabase.from('email_sending_domains').update({ is_default: false }).neq('id', domain.id);
    await supabase.from('email_sending_domains').update({ is_default: true }).eq('id', domain.id);
    loadDomains();
    setActionMenuOpen(null);
  };

  const filtered = domains.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.domain.toLowerCase().includes(q) || (d.brand_name || '').toLowerCase().includes(q);
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
          <h1 className="text-xl font-bold text-white">Sender Domains</h1>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Manage verified sending domains for Email Studio.{' '}
            <a href="/admin/email/operations" className="text-[#06B6D4] hover:underline cursor-pointer">DNS setup guide</a>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="dns_pending">DNS Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
          <option value="disabled">Disabled</option>
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
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No sending domains</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Add a domain to start sending email. You will need access to DNS settings to verify domain ownership.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((domain) => {
            const statusInfo = CLICKABLE_STATUS_LABELS[domain.status] || { label: domain.status, color: 'text-slate-400 bg-slate-400/10' };
            return (
              <div key={domain.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${domain.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">{domain.domain}</h3>
                        {domain.is_default && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] font-semibold">Default</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${statusInfo.color}`}>
                          {domain.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {domain.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {domain.status === 'dns_pending' && <Clock className="w-3 h-3" />}
                          {statusInfo.label}
                        </span>
                        {domain.brand_name && <span className="text-xs text-slate-500">{domain.brand_name}</span>}
                        {domain.sender_count !== undefined && (
                          <span className="text-xs text-slate-500">{domain.sender_count} sender{domain.sender_count !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 relative">
                    <button
                      onClick={() => setShowDetailModal(domain)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                    >
                      View Setup
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === domain.id ? null : domain.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenuOpen === domain.id && (
                        <div className="absolute right-0 top-10 w-48 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden z-50">
                          <button onClick={() => { handleCheckDns(domain); setActionMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                            <RefreshCw className={`w-4 h-4 ${checking[domain.id] ? 'animate-spin' : ''}`} /> Recheck DNS
                          </button>
                          <button onClick={() => handleSetDefault(domain)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                            <CheckCircle2 className="w-4 h-4" /> Set as Default
                          </button>
                          <button onClick={() => handleToggleStatus(domain)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                            {domain.status === 'disabled' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            {domain.status === 'disabled' ? 'Enable' : 'Disable'}
                          </button>
                          <button onClick={() => setActionMenuOpen(null)} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Add Sending Domain</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Domain</label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => { setNewDomain(e.target.value); setAddError(''); }}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enter a plain domain name, e.g. mail.example.com</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Brand (optional)</label>
                <select
                  value={newBrandId || ''}
                  onChange={(e) => setNewBrandId(e.target.value || null)}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer"
                >
                  <option value="">No brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
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
                <button onClick={handleAddDomain} disabled={adding} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap">
                  {adding ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">DNS Setup: {showDetailModal.domain}</h2>
              <button onClick={() => setShowDetailModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-6 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-300">DNS propagation note</p>
                <p className="text-xs text-amber-400/80 mt-0.5">DNS changes may take several minutes to propagate. After adding records, click Recheck DNS to verify.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Required DNS Records</h3>
              <p className="text-xs text-slate-500 -mt-2">Add these records at your DNS provider (Cloudflare, Route 53, etc.)</p>
              {(showDetailModal.dns_records || []).map((rec, i) => (
                <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.5 rounded">{rec.type}</span>
                        <span className="text-sm font-medium text-white">{rec.purpose}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${rec.status === 'verified' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                      {rec.status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {rec.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-0.5">Host</p>
                      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
                        <code className="text-white font-mono text-xs break-all">{rec.host}</code>
                        <button onClick={() => { try { navigator.clipboard.writeText(rec.host); } catch {} }} className="text-slate-500 hover:text-white cursor-pointer shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Value</p>
                      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
                        <code className="text-white font-mono text-xs break-all truncate">{rec.value}</code>
                        <button onClick={() => { try { navigator.clipboard.writeText(rec.value); } catch {} }} className="text-slate-500 hover:text-white cursor-pointer shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {rec.priority !== undefined && (
                      <div>
                        <p className="text-slate-500 mb-0.5">Priority</p>
                        <code className="text-white font-mono text-xs">{rec.priority}</code>
                      </div>
                    )}
                    {rec.ttl && (
                      <div>
                        <p className="text-slate-500 mb-0.5">TTL</p>
                        <code className="text-white font-mono text-xs">{rec.ttl}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => handleCheckDns(showDetailModal)}
                disabled={checking[showDetailModal.id]}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {checking[showDetailModal.id] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Recheck DNS
              </button>
              <button onClick={() => setShowDetailModal(null)} className="px-4 py-2.5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}