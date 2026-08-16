'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Users, GitBranch, AlertTriangle, CheckCircle2, XCircle, Clock,
  ArrowRight, Search, Plus, ShieldCheck, Filter, RefreshCw, Eye,
  Trash2, Edit3, BarChart3, Layers, Wrench,
} from 'lucide-react';

interface PersonalisationField {
  id: string;
  display_name: string;
  stable_key: string;
  source_system: string;
  data_type: string;
  sensitivity: string;
  fallback_policy: string;
  status: string;
  created_at: string;
}

interface DynamicRule {
  id: string;
  name: string;
  source_type: string;
  target_type: string;
  status: string;
  priority: number;
  created_at: string;
}

const FIELD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: 'Approved', color: 'text-emerald-400 bg-emerald-400/10' },
  restricted: { label: 'Restricted', color: 'text-amber-400 bg-amber-400/10' },
  deprecated: { label: 'Deprecated', color: 'text-orange-400 bg-orange-400/10' },
  disabled: { label: 'Disabled', color: 'text-slate-500 bg-slate-500/10' },
  missing_source: { label: 'Missing Source', color: 'text-red-400 bg-red-400/10' },
  needs_review: { label: 'Needs Review', color: 'text-purple-400 bg-purple-400/10' },
};

const RULE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-slate-400 bg-slate-400/10' },
  needs_review: { label: 'Needs Review', color: 'text-purple-400 bg-purple-400/10' },
  approved: { label: 'Approved', color: 'text-emerald-400 bg-emerald-400/10' },
  active: { label: 'Active', color: 'text-sky-400 bg-sky-400/10' },
  paused: { label: 'Paused', color: 'text-amber-400 bg-amber-400/10' },
  deprecated: { label: 'Deprecated', color: 'text-orange-400 bg-orange-400/10' },
};

const DATA_TYPE_LABELS: Record<string, string> = {
  text: 'Text', number: 'Number', boolean: 'True/False', datetime: 'Date/Time',
  currency: 'Currency', enum: 'Choice List', list: 'List', url: 'URL',
  locale: 'Locale', product_ref: 'Product Ref',
};

const SENSITIVITY_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', restricted: 'Restricted',
};

export default function PersonalisationDashboard() {
  const [fields, setFields] = useState<PersonalisationField[]>([]);
  const [rules, setRules] = useState<DynamicRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTab, setFilterTab] = useState<'fields' | 'rules'>('fields');
  const [stats, setStats] = useState({ totalFields: 0, approvedFields: 0, totalRules: 0, activeRules: 0, warnings: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: fieldData } = await supabase.from('email_personalisation_fields').select('*').order('created_at', { ascending: false });
    const { data: ruleData } = await supabase.from('email_dynamic_rules').select('*').order('created_at', { ascending: false });

    const f = (fieldData || []) as PersonalisationField[];
    const r = (ruleData || []) as DynamicRule[];
    setFields(f);
    setRules(r);
    setStats({
      totalFields: f.length,
      approvedFields: f.filter(x => x.status === 'approved').length,
      totalRules: r.length,
      activeRules: r.filter(x => x.status === 'active' || x.status === 'approved').length,
      warnings: f.filter(x => x.status === 'needs_review' || x.status === 'missing_source' || x.status === 'restricted').length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredFields = fields.filter(f => {
    const matches = !searchTerm || f.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || f.stable_key.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || f.status === filterStatus;
    return matches && statusMatch;
  });

  const filteredRules = rules.filter(r => {
    const matches = !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    return matches && statusMatch;
  });

  const handleDeleteField = async (id: string) => {
    if (!confirm('Deprecate this field? Existing content will show warnings until updated.')) return;
    await supabase.from('email_personalisation_fields').update({ status: 'deprecated' }).eq('id', id);
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-white/[0.04] rounded-lg" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-[#121215] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">Personalisation</h1>
          </div>
          <p className="text-sm text-slate-400 ml-11">Approved fields, dynamic rules, preview, and operational health.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link href="/admin/email/personalisation/rules" className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
            <GitBranch className="w-3.5 h-3.5" /> Rule Builder
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-2xl font-bold text-white">{stats.totalFields}</p>
          <p className="text-xs text-slate-500 mt-1">Total Fields</p>
        </div>
        <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.approvedFields}</p>
          <p className="text-xs text-emerald-400/70 mt-1">Approved Fields</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-2xl font-bold text-white">{stats.totalRules}</p>
          <p className="text-xs text-slate-500 mt-1">Dynamic Rules</p>
        </div>
        <div className="bg-sky-500/[0.04] border border-sky-500/10 rounded-2xl p-4">
          <p className="text-2xl font-bold text-sky-400">{stats.activeRules}</p>
          <p className="text-xs text-sky-400/70 mt-1">Active Rules</p>
        </div>
        <div className={`rounded-2xl p-4 ${stats.warnings > 0 ? 'bg-amber-500/[0.04] border border-amber-500/10' : 'bg-[#121215] border border-[rgba(255,255,255,0.06)]'}`}>
          <p className={`text-2xl font-bold ${stats.warnings > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{stats.warnings}</p>
          <p className="text-xs text-slate-500 mt-1">Warnings</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-0 bg-[#121215] rounded-xl p-1 border border-[rgba(255,255,255,0.04)]">
          <button onClick={() => setFilterTab('fields')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterTab === 'fields' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
            Fields ({fields.length})
          </button>
          <button onClick={() => setFilterTab('rules')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${filterTab === 'rules' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white'}`}>
            Rules ({rules.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={filterTab === 'fields' ? 'Search fields...' : 'Search rules...'}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 appearance-none">
          <option value="all">All statuses</option>
          {filterTab === 'fields' ? (
            Object.entries(FIELD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
          ) : (
            Object.entries(RULE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
          )}
        </select>

        <Link href="/admin/email/personalisation/test-data" className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap">
          <Eye className="w-3.5 h-3.5" /> Test Preview
        </Link>
      </div>

      {filterTab === 'fields' ? (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Field</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Key</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sensitivity</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fallback</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFields.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No fields found. Register fields in settings to begin.</td></tr>
                ) : (
                  filteredFields.map((f) => {
                    const s = FIELD_STATUS_LABELS[f.status] || { label: f.status, color: 'text-slate-400 bg-slate-400/10' };
                    return (
                      <tr key={f.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium">{f.display_name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">{`{{${f.stable_key}}}`}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 capitalize">{f.source_system}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{DATA_TYPE_LABELS[f.data_type] || f.data_type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${f.sensitivity === 'restricted' || f.sensitivity === 'high' ? 'text-red-400 bg-red-400/10' : f.sensitivity === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                            {SENSITIVITY_LABELS[f.sensitivity] || f.sensitivity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 capitalize">{f.fallback_policy.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/email/personalisation/test-data?field=${f.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-500 hover:text-sky-400 transition-colors cursor-pointer" title="Preview">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            {f.status !== 'deprecated' && (
                              <button onClick={() => handleDeleteField(f.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Deprecate">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.04)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rule Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">No rules found. Create rules with the Rule Builder.</td></tr>
                ) : (
                  filteredRules.map((r) => {
                    const s = RULE_STATUS_LABELS[r.status] || { label: r.status, color: 'text-slate-400 bg-slate-400/10' };
                    return (
                      <tr key={r.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 capitalize">{r.source_type}</td>
                        <td className="px-4 py-3 text-xs text-slate-300 capitalize">{r.target_type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{r.priority}</td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/email/personalisation/rules?id=${r.id}`} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors cursor-pointer whitespace-nowrap ml-auto w-fit">
                            <Edit3 className="w-3 h-3" /> Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/admin/email/settings/personalisation" className="flex items-center gap-2 px-3 py-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          <Wrench className="w-4 h-4 text-slate-500" />
          Personalisation Settings
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
        </Link>
        <Link href="/admin/email/personalisation/rules" className="flex items-center gap-2 px-3 py-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          <GitBranch className="w-4 h-4 text-slate-500" />
          Rule Builder
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
        </Link>
        <Link href="/admin/email/personalisation/test-data" className="flex items-center gap-2 px-3 py-2 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer">
          <Eye className="w-4 h-4 text-slate-500" />
          Test Preview
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
        </Link>
      </div>

      {stats.warnings > 0 && (
        <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">{stats.warnings} field(s) need attention</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Fields marked Needs Review, Missing Source or Restricted require action before they can be used in new content.</p>
          </div>
        </div>
      )}
    </div>
  );
}