'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Shield, Globe, UserCheck, Server, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw,
  ArrowRight, Search,
  Thermometer, Activity, Zap, BarChart3, Radio,
} from 'lucide-react';

const HEALTH_STATES: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  monitoring: { label: 'Monitoring', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: Activity },
  warming: { label: 'Warming', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Thermometer },
  needs_attention: { label: 'Needs Attention', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertTriangle },
  degraded: { label: 'Degraded', color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown },
  paused: { label: 'Paused', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Clock },
  blocked: { label: 'Blocked', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
  unknown: { label: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Radio },
  not_configured: { label: 'Not Configured', color: 'text-slate-600', bg: 'bg-slate-600/10', icon: Clock },
};

interface RepAsset {
  id: string;
  name: string;
  asset_type: string;
  brand: string | null;
  provider: string | null;
  health_state: string;
  delivery_rate: number | null;
  bounce_rate: number | null;
  complaint_rate: number | null;
  daily_volume: number | null;
  authentication: Record<string, unknown> | null;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset_name: string | null;
  detection_time: string | null;
}

interface Warmup {
  id: string;
  name: string;
  asset_type: string;
  asset_value: string;
  status: string;
  current_stage: number | null;
  total_stages: number | null;
  daily_cap: number | null;
  current_daily_count: number | null;
  start_date: string | null;
  target_volume: number | null;
}

interface Blocklist {
  id: string;
  blocklist_name: string;
  asset_value: string;
  check_state: string;
  listing_type: string | null;
  first_detected: string | null;
  incident_id: string | null;
}

function isDomainType(assetType: string): boolean {
  return assetType.includes('domain');
}
function isSenderType(assetType: string): boolean {
  return assetType.includes('sender');
}
function isIpType(assetType: string): boolean {
  return assetType.includes('ip');
}

function authPassing(auth: Record<string, unknown> | null): boolean {
  if (!auth) return false;
  const spf = auth.spf;
  const dkim = auth.dkim;
  const dmarc = auth.dmarc;
  return Boolean(spf) && Boolean(dkim) && Boolean(dmarc);
}

export default function ReputationDashboard() {
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [assets, setAssets] = useState<RepAsset[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [warmups, setWarmups] = useState<Warmup[]>([]);
  const [blocklist, setBlocklist] = useState<Blocklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [assetsRes, incidentsRes, warmupsRes, blocklistRes] = await Promise.all([
        supabase.from('email_reputation_assets').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('email_deliverability_incidents').select('id, title, severity, status, asset_name, detection_time').order('detection_time', { ascending: false }).limit(50),
        supabase.from('email_warmup_plans').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('email_blocklist_checks').select('*').order('last_checked', { ascending: false }).limit(50),
      ]);

      setAssets((assetsRes.data || []) as RepAsset[]);
      setIncidents((incidentsRes.data || []) as Incident[]);
      setWarmups((warmupsRes.data || []) as Warmup[]);
      setBlocklist((blocklistRes.data || []) as Blocklist[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = assets.filter((a) => {
    if (healthFilter !== 'all' && a.health_state !== healthFilter) return false;
    if (assetFilter !== 'all' && a.asset_type !== assetFilter) return false;
    if (search && !(a.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const assetTypes = Array.from(new Set(assets.map((a) => a.asset_type)));

  const needingAttention = assets.filter((a) => ['needs_attention', 'degraded', 'blocked'].includes(a.health_state)).length;
  const deliveryValues = assets.filter((a) => a.delivery_rate !== null).map((a) => a.delivery_rate as number);
  const avgDelivery = deliveryValues.length > 0 ? deliveryValues.reduce((s, v) => s + v, 0) / deliveryValues.length : null;
  const activeWarmups = warmups.filter((w) => w.status === 'active').length;
  const pausedWarmups = warmups.filter((w) => w.status === 'paused').length;
  const activeIncidents = incidents.filter((i) => ['open', 'investigating', 'contained', 'recovering'].includes(i.status));
  const sev1Count = activeIncidents.filter((i) => i.severity === 'sev-1').length;
  const sev2Count = activeIncidents.filter((i) => i.severity === 'sev-2').length;
  const listedCount = blocklist.filter((b) => b.check_state === 'listed').length;
  const confirmedListings = blocklist.filter((b) => b.check_state === 'listed' && b.listing_type === 'confirmed').length;
  const authPassingCount = assets.filter((a) => authPassing(a.authentication)).length;
  const allAuthPassing = assets.length > 0 && authPassingCount === assets.length;

  const metricCards = [
    { key: 'assets', icon: Shield, label: 'Reputation Assets', value: String(assets.length), sub: `${needingAttention} needing attention`, color: 'text-[#06B6D4]' },
    { key: 'delivery', icon: TrendingUp, label: 'Overall Delivery', value: avgDelivery !== null ? `${avgDelivery.toFixed(1)}%` : '—', sub: 'Across tracked assets', color: 'text-emerald-400' },
    { key: 'warmup', icon: Thermometer, label: 'Active Warm-ups', value: String(activeWarmups), sub: `${pausedWarmups} paused`, color: 'text-amber-400' },
    { key: 'incidents', icon: AlertTriangle, label: 'Active Incidents', value: String(activeIncidents.length), sub: `${sev1Count} SEV-1, ${sev2Count} SEV-2`, color: 'text-red-400' },
    { key: 'blocklist', icon: XCircle, label: 'Blocklist Listings', value: String(listedCount), sub: `${confirmedListings} confirmed`, color: 'text-orange-400' },
    { key: 'auth', icon: CheckCircle2, label: 'Auth Status', value: allAuthPassing ? 'SPF+DKIM+DMARC' : `${authPassingCount}/${assets.length}`, sub: allAuthPassing ? 'All assets passing' : 'Assets fully authenticated', color: 'text-sky-400' },
  ];

  const recentWarmups = warmups.slice(0, 3);
  const recentIncidents = activeIncidents.slice(0, 4);
  const recentBlocklist = blocklist.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Sender Reputation</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Monitor sending domains, sender profiles, IP reputation, warm-up progress and deliverability incidents.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-bold text-white">Sender Asset Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Domains, senders, IPs and provider accounts — {filtered.length} of {assets.length} shown
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 w-36"
                  />
                </div>
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 focus:outline-none pr-8 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  {assetTypes.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 focus:outline-none pr-8 cursor-pointer"
                >
                  <option value="all">All States</option>
                  {Object.entries(HEALTH_STATES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">{assets.length === 0 ? 'No reputation assets recorded yet' : 'No assets match your filters'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.04)]">
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Asset</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Brand</th>
                      <th className="text-left px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Health</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Delivery</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Bounce</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Complaint</th>
                      <th className="text-right px-6 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Daily Vol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((asset) => {
                      const health = HEALTH_STATES[asset.health_state] || HEALTH_STATES.unknown;
                      const HIcon = health.icon;
                      return (
                        <tr key={asset.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              {isDomainType(asset.asset_type) ? <Globe className="w-3.5 h-3.5 text-slate-500" /> : isSenderType(asset.asset_type) ? <UserCheck className="w-3.5 h-3.5 text-slate-500" /> : isIpType(asset.asset_type) ? <Server className="w-3.5 h-3.5 text-slate-500" /> : <Shield className="w-3.5 h-3.5 text-slate-500" />}
                              <span className="text-sm text-white font-medium">{asset.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400 capitalize">{asset.asset_type.replace(/_/g, ' ')}</td>
                          <td className="px-6 py-3 text-xs text-slate-400">{asset.brand || '—'}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${health.bg} ${health.color}`}>
                              <HIcon className="w-3 h-3" />
                              {health.label}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs font-medium text-white">{asset.delivery_rate !== null ? `${asset.delivery_rate}%` : '—'}</td>
                          <td className="px-6 py-3 text-right text-xs">{asset.bounce_rate !== null ? <span className={asset.bounce_rate > 2 ? 'text-red-400' : 'text-slate-400'}>{asset.bounce_rate}%</span> : '—'}</td>
                          <td className="px-6 py-3 text-right text-xs">{asset.complaint_rate !== null ? <span className={asset.complaint_rate > 0.2 ? 'text-red-400' : 'text-slate-400'}>{asset.complaint_rate}%</span> : '—'}</td>
                          <td className="px-6 py-3 text-right text-xs text-slate-400">{asset.daily_volume !== null ? asset.daily_volume.toLocaleString() : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-bold text-white">Active Warm-up Plans</h2>
                <p className="text-xs text-slate-500 mt-0.5">Domain and IP warm-up progress</p>
              </div>
              <Link href="/admin/email/reputation/warm-up" className="text-xs text-[#06B6D4] hover:text-[#22D3EE] flex items-center gap-1 cursor-pointer whitespace-nowrap">
                Manage Plans <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentWarmups.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12">No warm-up plans recorded yet</p>
            ) : (
              <div className="p-4 space-y-3">
                {recentWarmups.map((wp) => {
                  const cap = wp.daily_cap || 0;
                  const pct = cap > 0 ? Math.min(100, ((wp.current_daily_count || 0) / cap) * 100) : 0;
                  return (
                    <div key={wp.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{wp.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${wp.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-400/10 text-slate-400'}`}>
                            {wp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{wp.asset_value} · Stage {wp.current_stage ?? '—'} of {wp.total_stages ?? '—'} · Target: {(wp.target_volume || 0).toLocaleString()}/day</p>
                        <div className="mt-2 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-[#06B6D4] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{wp.current_daily_count ?? 0} / {wp.daily_cap ?? 0} today</p>
                      </div>
                      <Link href="/admin/email/reputation/warm-up" className="text-xs text-[#06B6D4] hover:underline whitespace-nowrap cursor-pointer">View</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/admin/email/reputation/domains" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer whitespace-nowrap">
                <Globe className="w-4 h-4 text-[#06B6D4]" /> Domain Inventory
              </Link>
              <Link href="/admin/email/reputation/senders" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer whitespace-nowrap">
                <UserCheck className="w-4 h-4 text-[#06B6D4]" /> Sender Profiles
              </Link>
              <Link href="/admin/email/reputation/warm-up" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer whitespace-nowrap">
                <Thermometer className="w-4 h-4 text-[#06B6D4]" /> Warm-up Plans
              </Link>
              <Link href="/admin/email/reputation/incidents" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 text-[#06B6D4]" /> Incidents
              </Link>
              <Link href="/admin/email/settings/reputation" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer whitespace-nowrap">
                <Shield className="w-4 h-4 text-[#06B6D4]" /> Reputation Settings
              </Link>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Active Incidents</h2>
            </div>
            <div className="p-4 space-y-3">
              {recentIncidents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No active incidents</p>
              ) : (
                recentIncidents.map((inc) => {
                  const sevClass = inc.severity === 'sev-1' ? 'bg-red-500/10 text-red-400 border-red-500/20' : inc.severity === 'sev-2' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20';
                  return (
                    <Link key={inc.id} href="/admin/email/reputation/incidents" className="block p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${sevClass}`}>{inc.severity}</span>
                        <span className="text-[10px] text-slate-500">{inc.detection_time ? new Date(inc.detection_time).toLocaleDateString('en-GB') : '—'}</span>
                      </div>
                      <p className="text-sm text-white font-medium">{inc.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-500">{inc.asset_name || '—'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${inc.status === 'investigating' ? 'bg-red-400/10 text-red-400' : inc.status === 'contained' ? 'bg-amber-400/10 text-amber-400' : 'bg-sky-400/10 text-sky-400'}`}>
                          {inc.status}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
              <Link href="/admin/email/reputation/incidents" className="block text-center text-xs text-[#06B6D4] hover:underline py-1 cursor-pointer">
                View all incidents
              </Link>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Blocklist Status</h2>
            </div>
            <div className="p-4 space-y-3">
              {recentBlocklist.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No blocklist checks recorded yet</p>
              ) : (
                recentBlocklist.map((bl) => (
                  <div key={bl.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2 min-w-0">
                      {bl.check_state === 'listed' ? <XCircle className="w-4 h-4 text-red-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{bl.blocklist_name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{bl.asset_value}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${bl.check_state === 'listed' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {bl.check_state === 'listed' ? 'Listed' : 'Clear'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}