'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Megaphone, Plus, Search, Filter, X, ArrowUpDown, ChevronDown,
  Clock, Users, CheckCircle2, AlertTriangle, Send, Calendar,
  MoreHorizontal, Edit3, Eye, Copy, Archive, RotateCcw, Trash2,
  BarChart3, FileText, Palette, Play, Pause, Ban, History,
} from 'lucide-react';
import {
  CampaignData, CampaignStatus, CampaignType,
  CAMPAIGN_TYPES, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
} from '@/components/admin/email/campaigns/campaign-types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  ...CAMPAIGN_TYPES.map(t => ({ value: t.value, label: t.label })),
];

const SORT_OPTIONS = [
  { value: 'updated_at-desc', label: 'Recently Updated' },
  { value: 'created_at-desc', label: 'Recently Created' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_campaigns').select('*').order('updated_at', { ascending: false });
    if (!error && data) setCampaigns(data as CampaignData[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.more-menu')) setMoreOpenId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const filtered = campaigns.filter((c) => {
    const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchType = selectedType === 'all' || c.campaign_type === selectedType;
    const matchSearch = !debouncedSearch
      || c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      || (c.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const [field, dir] = sortBy.split('-');
    const multiplier = dir === 'desc' ? -1 : 1;
    if (field === 'name') return multiplier * (a.name || '').localeCompare(b.name || '');
    const aDate = field === 'created_at' ? a.created_at : a.updated_at;
    const bDate = field === 'created_at' ? b.created_at : b.updated_at;
    const aTime = new Date(aDate || 0).getTime();
    const bTime = new Date(bDate || 0).getTime();
    return multiplier * (aTime - bTime);
  });

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedStatus('all');
    setSelectedType('all');
    setSortBy('updated_at-desc');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('email_campaigns').delete().eq('id', id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setStatusMsg({ type: 'success', text: 'Campaign deleted' });
    setMoreOpenId(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDuplicate = async (campaign: CampaignData) => {
    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = userData?.user?.id
      ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user.id).maybeSingle()
      : { data: null };
    await supabase.from('email_campaigns').insert({
      name: `${campaign.name} Copy`,
      description: campaign.description,
      brand_kit_id: campaign.brand_kit_id,
      campaign_type: campaign.campaign_type,
      status: 'draft',
      created_by: userData?.user?.id,
      organisation_id: profileData?.organisation_id || null,
    });
    setStatusMsg({ type: 'success', text: 'Campaign duplicated' });
    setMoreOpenId(null);
    setTimeout(() => setStatusMsg(null), 3000);
    fetchCampaigns();
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedType !== 'all' || debouncedSearch !== '';

  const statsCards = [
    { label: 'Drafts', count: campaigns.filter(c => c.status === 'draft').length, icon: FileText, color: 'text-slate-400' },
    { label: 'Scheduled', count: campaigns.filter(c => c.status === 'scheduled').length, icon: Calendar, color: 'text-violet-400' },
    { label: 'Sent', count: campaigns.filter(c => c.status === 'sent').length, icon: Send, color: 'text-emerald-400' },
    { label: 'Needs Attention', count: campaigns.filter(c => c.status === 'failed' || c.status === 'paused').length, icon: AlertTriangle, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/[0.06] text-red-400 border-red-500/20'
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Create, schedule and send bulk email campaigns across Digital Footprint brands.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href="/admin/email/audiences"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            Audiences
          </Link>
          <Link
            href="/admin/email/templates"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Link>
          <Link
            href="/admin/email/campaigns/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <div key={stat.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.count}</p>
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                showFilters || hasActiveFilters
                  ? 'bg-white/[0.06] border-white/[0.12] text-white'
                  : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-12 w-64 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl p-4 z-50 space-y-4"
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                >
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <div className="space-y-1">
                      {STATUS_FILTERS.map((s) => (
                        <button key={s.value} onClick={() => setSelectedStatus(s.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${selectedStatus === s.value ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                        >{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {TYPE_FILTERS.map((t) => (
                        <button key={t.value} onClick={() => setSelectedType(t.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${selectedType === t.value ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                        >{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={clearFilters} className="w-full py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer">Clear All</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
            <Megaphone className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-white mb-1">
            {campaigns.length === 0 ? 'No campaigns yet' : 'No matching campaigns'}
          </p>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            {campaigns.length === 0 ? 'Create your first email campaign to start reaching your audience.' : 'Try adjusting your search or filters.'}
          </p>
          {campaigns.length === 0 && (
            <Link
              href="/admin/email/campaigns/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create First Campaign
            </Link>
          )}
          {campaigns.length > 0 && hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
              <RotateCcw className="w-4 h-4" /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Campaign</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {sorted.map((campaign) => {
                  const typeLabel = CAMPAIGN_TYPES.find(t => t.value === campaign.campaign_type)?.label || campaign.campaign_type;
                  const statusColor = CAMPAIGN_STATUS_COLORS[campaign.status as CampaignStatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                  return (
                    <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                            <Megaphone className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/email/campaigns/${campaign.id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate block">
                              {campaign.name}
                            </Link>
                            <p className="text-xs text-slate-500 truncate">{campaign.description || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-slate-400">{typeLabel}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-semibold uppercase border ${statusColor}`}>
                          {CAMPAIGN_STATUS_LABELS[campaign.status as CampaignStatus] || campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {campaign.updated_at ? new Date(campaign.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/email/campaigns/${campaign.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <div className="relative more-menu">
                            <button onClick={(e) => { e.stopPropagation(); setMoreOpenId(moreOpenId === campaign.id ? null : campaign.id ?? null); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {moreOpenId === campaign.id && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                  className="absolute right-0 top-10 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50"
                                  onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                                >
                                  <Link href={`/admin/email/campaigns/${campaign.id}`} onClick={() => setMoreOpenId(null)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                  </Link>
                                  <button onClick={() => { handleDuplicate(campaign); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                  </button>
                                  <div className="border-t border-[rgba(255,255,255,0.06)]" />
                                  <button onClick={() => { if (campaign.id) handleDelete(campaign.id); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
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
