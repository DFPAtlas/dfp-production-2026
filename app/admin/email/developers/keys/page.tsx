'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Key, Shield, Search, Clock, CheckCircle2, X, RefreshCw, Ban, Globe, AlertTriangle } from 'lucide-react';

interface IntegrationKey {
  id: string;
  appName: string;
  appId: string | null;
  environment: string;
  displayName: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  created: string;
  lastUsed: string | null;
  expires: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  expiring: { label: 'Expiring', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: X },
  rotating: { label: 'Rotating', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', icon: RefreshCw },
  suspended: { label: 'Suspended', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: AlertTriangle },
  revoked: { label: 'Revoked', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: Ban },
};

export default function DeveloperKeys() {
  const [keys, setKeys] = useState<IntegrationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: rawKeys } = await supabase
        .from('email_integration_keys')
        .select('id, application_id, environment, display_name, key_prefix, scopes, status, created_at, last_used_at, expires_at')
        .order('created_at', { ascending: false })
        .limit(200);

      let nameMap: Record<string, string> = {};
      const appIds = [...new Set((rawKeys || []).map((k: { application_id: string | null }) => k.application_id).filter(Boolean))] as string[];
      if (appIds.length > 0) {
        const { data: apps } = await supabase.from('email_developer_apps').select('id, name').in('id', appIds);
        (apps || []).forEach((a: { id: string; name: string }) => { nameMap[a.id] = a.name; });
      }

      if (rawKeys) {
        setKeys(rawKeys.map((k: Record<string, unknown>) => ({
          id: k.id as string,
          appName: (k.application_id ? nameMap[k.application_id as string] : null) || '—',
          appId: (k.application_id as string) || null,
          environment: (k.environment as string) || '',
          displayName: (k.display_name as string) || '',
          keyPrefix: (k.key_prefix as string) || '',
          scopes: (k.scopes as string[]) || [],
          status: (k.status as string) || 'active',
          created: (k.created_at as string) || '',
          lastUsed: (k.last_used_at as string) || null,
          expires: (k.expires_at as string) || null,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = keys.filter((k) => {
    if (search && !k.displayName.toLowerCase().includes(search.toLowerCase()) && !k.appName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    return true;
  });

  const statuses = ['all', ...new Set(keys.map((k) => k.status))];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Integration Keys</h1>
          <p className="text-sm text-slate-400 mt-1">Secure server-to-server API keys across applications and environments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/developers" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Keys', value: keys.length, color: 'text-[#06B6D4]' },
          { label: 'Active', value: keys.filter((k) => k.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Expiring Soon', value: keys.filter((k) => k.status === 'expiring').length, color: 'text-amber-400' },
          { label: 'Revoked', value: keys.filter((k) => k.status === 'revoked').length, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search keys or applications..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 pr-8 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer">
          {statuses.map((s) => <option key={s} value={s} className="bg-[#1a1a1e] text-white">{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">{keys.length === 0 ? 'No integration keys issued yet' : 'No keys match your filters'}</p>
          <p className="text-xs text-slate-500 mt-1">API key issuance is managed via the secure developer platform.</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Key</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Application</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Environment</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Scopes</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Last Used</th>
                  <th className="text-left px-6 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Expires</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((key) => {
                  const meta = STATUS_META[key.status] || STATUS_META.active;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={key.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{key.displayName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <code className="text-[11px] text-slate-500 font-mono">{key.keyPrefix}••••••••••••</code>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {key.appId ? (
                          <Link href={`/admin/email/developers/apps/${key.appId}`} className="text-sm text-[#06B6D4] hover:underline cursor-pointer whitespace-nowrap">{key.appName}</Link>
                        ) : (
                          <span className="text-sm text-slate-400 whitespace-nowrap">{key.appName}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Globe className="w-3 h-3" /> {key.environment}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.slice(0, 2).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400 font-mono whitespace-nowrap">{s}</span>
                          ))}
                          {key.scopes.length > 2 && <span className="text-[10px] text-slate-600">+{key.scopes.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${meta.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">{key.expires ? new Date(key.expires).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}