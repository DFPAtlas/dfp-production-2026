'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  MousePointerClick, ArrowLeft, Globe, Plus, CheckCircle2, XCircle,
  AlertTriangle, Copy, RefreshCw, ExternalLink,
} from 'lucide-react';
import { type SendingDomain } from '@/components/admin/email/settings/settings-types';

export default function TrackingDomainPage() {
  const [domains, setDomains] = useState<SendingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<SendingDomain | null>(null);
  const [trackingDomain, setTrackingDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState<{ host: string; type: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [affectedCount, setAffectedCount] = useState(0);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_sending_domains').select('*').eq('status', 'verified').order('domain');
    if (data) {
      const enriched = await Promise.all((data as SendingDomain[]).map(async (d) => {
        let brandName = '';
        if (d.brand_kit_id) {
          const { data: bk } = await supabase.from('email_brand_kits').select('name').eq('id', d.brand_kit_id).maybeSingle();
          brandName = (bk as { name?: string })?.name || '';
        }
        return { ...d, brand_name: brandName };
      }));
      setDomains(enriched);
    }
    setLoading(false);
  };

  const handleSelectDomain = (domain: SendingDomain) => {
    setSelectedDomain(domain);
    setTrackingDomain(domain.tracking_domain || `click.${domain.domain}`);
    setDnsRecords([
      { host: `click.${domain.domain}`, type: 'CNAME', value: `track.resend.com` },
    ]);
    loadAffected(domain.id);
  };

  const loadAffected = async (domainId: string) => {
    const { count: campaigns } = await supabase.from('email_campaigns').select('*', { count: 'exact', head: true });
    setAffectedCount(campaigns || 0);
  };

  const handleSave = async () => {
    if (!selectedDomain) return;
    setSaving(true);
    await supabase.from('email_sending_domains').update({
      tracking_domain: trackingDomain,
    }).eq('id', selectedDomain.id);
    setShowConfirm(false);
    loadDomains();
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Tracking Domain</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure a custom domain for open and click tracking links</p>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Changing a live tracking domain</p>
          <p className="text-xs text-amber-400/80 mt-1">
            Previously sent emails will keep their original tracking links. Only new emails will use the updated domain.
            Affected items: {affectedCount} campaign{affectedCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#121215] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div
              key={domain.id}
              onClick={() => handleSelectDomain(domain)}
              className={`bg-[#121215] border rounded-2xl p-5 transition-all cursor-pointer ${
                selectedDomain?.id === domain.id ? 'border-[#06B6D4]/30 bg-[#06B6D4]/[0.02]' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{domain.domain}</h3>
                    <p className="text-xs text-slate-500">
                      {domain.tracking_domain ? `Tracking: ${domain.tracking_domain}` : 'No tracking domain configured'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.tracking_domain ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-emerald-400 bg-emerald-400/10">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-400/10">
                      Not configured
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDomain && (
        <div className="bg-[#121215] border border-[#06B6D4]/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Configure Tracking for {selectedDomain.domain}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tracking Domain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingDomain}
                  onChange={(e) => setTrackingDomain(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">e.g. click.{selectedDomain.domain}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-slate-400 mb-2">Required DNS Record</h3>
              {dnsRecords.map((rec, i) => (
                <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-0.5">Type</p>
                      <code className="text-white font-mono text-xs">{rec.type}</code>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-0.5">Host</p>
                      <div className="flex items-center gap-2">
                        <code className="text-white font-mono text-xs">{rec.host}</code>
                        <button onClick={() => { try { navigator.clipboard.writeText(rec.host); } catch {} }} className="text-slate-500 hover:text-white cursor-pointer">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 mb-0.5">Value</p>
                      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
                        <code className="text-white font-mono text-xs break-all">{rec.value}</code>
                        <button onClick={() => { try { navigator.clipboard.writeText(rec.value); } catch {} }} className="text-slate-500 hover:text-white cursor-pointer shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Tracking Domain
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Confirm Tracking Domain</h2>
            <p className="text-sm text-slate-400 mb-4">
              Changing the tracking domain will affect {affectedCount} campaign{affectedCount !== 1 ? 's' : ''}. Previously sent emails will keep their original links.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              New tracking domain: <code className="text-[#06B6D4] font-mono">{trackingDomain}</code>
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap">
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}