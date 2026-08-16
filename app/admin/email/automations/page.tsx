'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import {
  Plus, Search, Filter, SlidersHorizontal, MoreHorizontal,
  Play, Pause, Copy, Archive, RefreshCw, AlertTriangle,
  Clock, Zap, Mail, ChevronDown, BarChart3, Activity, X,
} from 'lucide-react';
import {
  AutomationData,
  AutomationStatus,
  AUTOMATION_CATEGORIES,
  AUTOMATION_STATUS_LABELS,
  AUTOMATION_STATUS_COLORS,
  TRIGGER_DEFINITIONS,
} from '@/components/admin/email/automations/automation-types';

export default function AutomationsPage() {
  const { profile, sessionUser } = useAdminProfile();
  const [automations, setAutomations] = useState<AutomationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [stats, setStats] = useState({ active: 0, paused: 0, draft: 0, needsAttention: 0 });

  useEffect(() => {
    const handleClick = () => setActionMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_automations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      const a = data as AutomationData[];
      setAutomations(a);
      setStats({
        active: a.filter(x => x.status === 'active').length,
        paused: a.filter(x => x.status === 'paused').length,
        draft: a.filter(x => x.status === 'draft').length,
        needsAttention: a.filter(x => x.status === 'needs_attention' || x.status === 'failed').length,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const getTriggerLabel = (type: string) => {
    const def = TRIGGER_DEFINITIONS.find(d => d.type === type);
    return def ? def.label : type || 'Not set';
  };

  const getCategoryLabel = (cat: string) => {
    const def = AUTOMATION_CATEGORIES.find(c => c.value === cat);
    return def ? def.label : cat || '—';
  };

  const filtered = automations.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      const match = (a.name || '').toLowerCase().includes(q)
        || (a.description || '').toLowerCase().includes(q)
        || (a.product_name || '').toLowerCase().includes(q)
        || getTriggerLabel(a.trigger_type).toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
  });

  const handleStatusChange = async (id: string, newStatus: AutomationStatus) => {
    await supabase.from('email_automations').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    fetchAutomations();
  };

  const handleDuplicate = async (a: AutomationData) => {
    const { id, created_at, updated_at, created_by, updated_by, active_version_id, status, ...rest } = a;
    await supabase.from('email_automations').insert({
      ...rest,
      name: `${a.name} (Copy)`,
      status: 'draft',
      active_version_id: null,
    });
    fetchAutomations();
  };

  const statCards = [
    { label: 'Active', value: stats.active, color: 'emerald' },
    { label: 'Paused', value: stats.paused, color: 'orange' },
    { label: 'Drafts', value: stats.draft, color: 'slate' },
    { label: 'Needs Attention', value: stats.needsAttention, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-sm text-slate-400 mt-1">Trigger-based email sequences for onboarding, reminders and notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/transactional" className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <Mail className="w-4 h-4" />
            Transactional
          </Link>
          <Link href="/admin/email/automations/new" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] text-white rounded-xl text-sm font-semibold hover:from-[#0891B2] hover:to-[#06B6D4] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/20">
            <Plus className="w-4 h-4" />
            Create Automation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${
              s.label === 'Active' ? 'text-emerald-400' :
              s.label === 'Paused' ? 'text-orange-400' :
              s.label === 'Drafts' ? 'text-slate-400' :
              'text-amber-400'
            }`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search automations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {(statusFilter !== 'all' || categoryFilter !== 'all') && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
          )}
        </button>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 pr-8 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name A–Z</option>
          <option value="status">Status</option>
        </select>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Status:</span>
            {['all', 'draft', 'testing', 'active', 'paused', 'needs_attention', 'failed', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                    : 'bg-white/[0.04] text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                {s === 'all' ? 'All' : AUTOMATION_STATUS_LABELS[s as AutomationStatus] || s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Category:</span>
            {['all', ...AUTOMATION_CATEGORIES.map(c => c.value)].map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === c
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                    : 'bg-white/[0.04] text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                {c === 'all' ? 'All' : getCategoryLabel(c)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-white/[0.04] rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/[0.03] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5">
            <Activity className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No automations found</h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            {search || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first automation to start sending triggered email sequences.'}
          </p>
          {!search && statusFilter === 'all' && categoryFilter === 'all' && (
            <Link href="/admin/email/automations/new" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Create Automation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(a => {
            const statusStyle = AUTOMATION_STATUS_COLORS[a.status as AutomationStatus] || AUTOMATION_STATUS_COLORS.draft;
            return (
              <div key={a.id} className="group bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:bg-white/[0.04] hover:border-[rgba(255,255,255,0.1)] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      a.status === 'paused' ? 'bg-orange-500/10 text-orange-400' :
                      a.status === 'failed' || a.status === 'needs_attention' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-white/[0.04] text-slate-400'
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/admin/email/automations/${a.id}`} className="font-semibold text-sm text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate">
                          {a.name}
                        </Link>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium whitespace-nowrap ${statusStyle}`}>
                          {AUTOMATION_STATUS_LABELS[a.status as AutomationStatus]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {a.product_name && <span>{a.product_name}</span>}
                        {a.category && <span className="capitalize">{getCategoryLabel(a.category)}</span>}
                        {a.trigger_type && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {getTriggerLabel(a.trigger_type)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                        {a.updated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Updated {new Date(a.updated_at).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-1 shrink-0">
                    <Link
                      href={`/admin/email/automations/${a.id}`}
                      className="px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-lg text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === a.id ? null : a.id ?? null); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionMenuId === a.id && (
                      <div className="absolute right-0 top-10 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl overflow-hidden z-50">
                        <Link href={`/admin/email/automations/${a.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <Activity className="w-4 h-4" /> Edit
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(a); setActionMenuId(null); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full">
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        {a.status === 'active' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id!, 'paused'); setActionMenuId(null); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full">
                            <Pause className="w-4 h-4" /> Pause
                          </button>
                        )}
                        {a.status === 'paused' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id!, 'active'); setActionMenuId(null); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full">
                            <Play className="w-4 h-4" /> Resume
                          </button>
                        )}
                        <Link href={`/admin/email/automations/${a.id}/activity`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <BarChart3 className="w-4 h-4" /> Activity
                        </Link>
                        {a.status !== 'archived' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id!, 'archived'); setActionMenuId(null); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer w-full">
                            <Archive className="w-4 h-4" /> Archive
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
