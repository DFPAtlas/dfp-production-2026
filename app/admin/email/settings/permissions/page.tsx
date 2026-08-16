'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, Search, Save, AlertTriangle, Lock, Eye, EyeOff,
} from 'lucide-react';

interface Capability {
  capability_key: string;
  module: string;
  display_name: string;
  description: string | null;
  risk_level: string;
  category: string;
}

interface RoleMapping {
  role_name: string;
  capability_key: string;
  access_level: string;
}

const ACCESS_COLORS: Record<string, string> = {
  allow: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  deny: 'bg-red-500/10 text-red-400 border-red-500/20',
  inherited: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const RISK_COLORS: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
};

const MODULE_LABELS: Record<string, string> = {
  templates: 'Templates',
  campaigns: 'Campaigns',
  automations: 'Automations',
  contacts: 'Contacts & Compliance',
  analytics: 'Analytics',
  suppressions: 'Suppressions',
  administration: 'Administration',
};

export default function PermissionsPage() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [mappings, setMappings] = useState<RoleMapping[]>([]);
  const [roles, setRoles] = useState<string[]>(['super_admin']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterModule, setFilterModule] = useState('all');
  const [filterRole, setFilterRole] = useState('super_admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHighRisk, setShowHighRisk] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: caps } = await supabase.from('email_permission_capabilities').select('*').order('sort_order');
    const { data: maps } = await supabase.from('email_role_capability_mappings').select('*');
    setCapabilities(caps || []);
    setMappings(maps || []);

    const allRoles = [...new Set((maps || []).map((m: RoleMapping) => m.role_name))];
    if (allRoles.length === 0) allRoles.push('super_admin');
    setRoles(allRoles);
    setLoading(false);
  };

  const getAccessLevel = (capKey: string, role: string): string => {
    const mapping = mappings.find((m) => m.role_name === role && m.capability_key === capKey);
    return mapping?.access_level || 'inherited';
  };

  const setAccessLevel = (capKey: string, role: string, level: string) => {
    setMappings((prev) => {
      const existing = prev.findIndex((m) => m.role_name === role && m.capability_key === capKey);
      if (existing >= 0) {
        const next = [...prev];
        if (level === 'inherited') {
          next.splice(existing, 1);
        } else {
          next[existing] = { ...next[existing], access_level: level };
        }
        return next;
      }
      if (level === 'inherited') return prev;
      return [...prev, { role_name: role, capability_key: capKey, access_level: level }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const { data: existing } = await supabase.from('email_role_capability_mappings').select('id');
    if (existing && existing.length > 0) {
      await supabase.from('email_role_capability_mappings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const toInsert = mappings
      .filter((m) => m.access_level !== 'inherited')
      .map((m) => ({
        role_name: m.role_name,
        capability_key: m.capability_key,
        access_level: m.access_level,
      }));

    if (toInsert.length > 0) {
      await supabase.from('email_role_capability_mappings').insert(toInsert);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filteredCapabilities = capabilities.filter((c) => {
    if (filterModule !== 'all' && c.module !== filterModule) return false;
    if (searchQuery && !c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.capability_key.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  const highRiskCount = capabilities.filter((c) => c.risk_level === 'high').length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <h1 className="text-xl font-bold text-white">Roles &amp; Permissions</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1 ml-11">
          Manage Email Studio capabilities for each role. Changes affect all users with that role.{' '}
          <a href="/admin/email/operations" className="text-[#06B6D4] hover:underline cursor-pointer">Permission reference</a>
        </p>
      </div>

      {highRiskCount > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-300">{highRiskCount} High-Risk Capabilities</h3>
              <p className="text-xs text-amber-400/70 mt-1">
                High-risk capabilities include sending, activating automations, exporting contacts, managing providers and changing permissions. Grant these carefully.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search capabilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
            />
          </div>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
          >
            <option value="all">All Modules</option>
            {Object.entries(MODULE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {roles.length > 1 && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 pr-8"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowHighRisk(!showHighRisk)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${showHighRisk ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/[0.04] text-slate-400 border border-[rgba(255,255,255,0.08)] hover:text-white'}`}
          >
            {showHighRisk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHighRisk ? 'Show All' : 'High-Risk Only'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Capability</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Access</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredCapabilities
                .filter((c) => !showHighRisk || c.risk_level === 'high')
                .map((cap) => {
                  const access = getAccessLevel(cap.capability_key, filterRole);
                  return (
                    <tr key={cap.capability_key} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{cap.display_name}</p>
                        <p className="text-[10px] text-slate-600 font-mono">{cap.capability_key}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400">{MODULE_LABELS[cap.module] || cap.module}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold uppercase ${RISK_COLORS[cap.risk_level] || 'text-slate-400'}`}>
                          {cap.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <div className="flex items-center gap-1 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg p-0.5">
                            {(['allow', 'deny', 'inherited'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setAccessLevel(cap.capability_key, filterRole, level)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                  access === level
                                    ? ACCESS_COLORS[level] + ' border'
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                              >
                                {level === 'allow' ? 'Allow' : level === 'deny' ? 'Deny' : 'Inherit'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">{cap.description || '-'}</p>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Permissions Saved' : 'Save Permissions'}
          </button>
          <span className="text-xs text-slate-500">
            {mappings.filter((m) => m.access_level !== 'inherited').length} explicit overrides configured
          </span>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Permission Enforcement</h3>
            <p className="text-xs text-slate-500 mt-1">
              All capabilities are enforced server-side through RLS and edge function checks. Hidden UI controls are not a substitute for proper access control. Changes to permissions are audited and may affect multiple users immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}