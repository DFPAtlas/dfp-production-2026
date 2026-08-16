'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BrandKit, defaultColours, defaultLogo, defaultTypography, defaultButtons, defaultLayout, defaultHeader, defaultFooter, defaultContact } from '@/components/admin/email/editor/brand-types';
import { Plus, Search, MoreHorizontal, Edit3, Copy, Archive, RotateCcw, Star, Filter, X, AlertTriangle, Palette, LayoutGrid, List } from 'lucide-react';

export default function BrandKitsPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; kit: BrandKit } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchKits = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('email_brand_kits').select('*');

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},product_name.ilike.${q},website_domain.ilike.${q},description.ilike.${q}`);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    switch (sortBy) {
      case 'name_asc': query = query.order('name', { ascending: true }); break;
      case 'name_desc': query = query.order('name', { ascending: false }); break;
      case 'created': query = query.order('created_at', { ascending: false }); break;
      default: query = query.order('updated_at', { ascending: false }); break;
    }

    const { data, error } = await query;

    if (!error && data) {
      const kitsWithCounts = await Promise.all(
        (data as BrandKit[]).map(async (kit) => {
          const { count } = await supabase
            .from('email_templates')
            .select('*', { count: 'exact', head: true })
            .eq('brand_kit_id', kit.id);
          return { ...kit, template_count: count || 0 };
        })
      );
      setKits(kitsWithCounts);
    }
    setLoading(false);
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  useEffect(() => {
    const handleClick = () => setActionMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleCreate = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('email_brand_kits').insert({
      name: 'New Brand Kit',
      status: 'draft',
      colour_settings: defaultColours(),
      typography_settings: defaultTypography(),
      button_settings: defaultButtons(),
      layout_settings: defaultLayout(),
      header_settings: defaultHeader(),
      footer_settings: defaultFooter(),
      contact_settings: defaultContact(),
      logo_settings: defaultLogo(),
      created_by: userData.user?.id,
    }).select().single();

    if (!error && data) {
      setFeedback('Brand kit created');
      fetchKits();
    } else {
      setFeedback('Failed to create brand kit');
    }
  };

  const handleDuplicate = async (kit: BrandKit) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('email_brand_kits').insert({
      name: `${kit.name} Copy`,
      product_name: kit.product_name,
      description: kit.description,
      website_domain: kit.website_domain,
      status: 'draft',
      is_default: false,
      logo_settings: kit.logo_settings,
      colour_settings: kit.colour_settings,
      typography_settings: kit.typography_settings,
      button_settings: kit.button_settings,
      layout_settings: kit.layout_settings,
      header_settings: kit.header_settings,
      footer_settings: kit.footer_settings,
      contact_settings: kit.contact_settings,
      social_settings: kit.social_settings,
      created_by: userData.user?.id,
    });
    if (!error) { setFeedback('Brand kit duplicated'); fetchKits(); } else { setFeedback('Failed to duplicate'); }
    setActionMenu(null);
  };

  const handleArchive = async (kit: BrandKit) => {
    const { error } = await supabase.from('email_brand_kits').update({ status: 'archived', is_default: false }).eq('id', kit.id);
    if (!error) { setFeedback('Brand kit archived'); fetchKits(); } else { setFeedback('Failed to archive'); }
    setConfirmAction(null);
  };

  const handleRestore = async (kit: BrandKit) => {
    const { error } = await supabase.from('email_brand_kits').update({ status: 'active' }).eq('id', kit.id);
    if (!error) { setFeedback('Brand kit restored'); fetchKits(); } else { setFeedback('Failed to restore'); }
    setConfirmAction(null);
  };

  const handleSetDefault = async (kit: BrandKit) => {
    await supabase.from('email_brand_kits').update({ is_default: false }).eq('is_default', true).neq('id', kit.id);
    const { error } = await supabase.from('email_brand_kits').update({ is_default: true }).eq('id', kit.id);
    if (!error) { setFeedback('Default brand kit updated'); fetchKits(); } else { setFeedback('Failed to set default'); }
    setActionMenu(null);
  };

  const filteredKits = kits;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      active: 'bg-green-500/10 text-green-400 border-green-500/20',
      archived: 'bg-slate-600/10 text-slate-500 border-slate-600/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const colourDot = (color: string) => (
    <span className="w-3 h-3 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: color }} />
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand Kits</h1>
          <p className="text-sm text-slate-400 mt-1">Manage logos, colours, typography and reusable email styling for Digital Footprint products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/templates" className="px-3 py-2 text-sm text-slate-400 hover:text-white border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
            Back to Templates
          </Link>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Brand Kit
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-2.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl text-sm text-[#06B6D4] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-[#06B6D4]/70 hover:text-[#06B6D4] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search brand kits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${showFilters ? 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30' : 'text-slate-400 border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.15)]'}`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>

        <div className="flex items-center gap-1 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${viewMode === 'list' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer pr-8"
        >
          <option value="updated">Recently updated</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="created">Recently created</option>
        </select>
      </div>

      {showFilters && (
        <div className="mb-5 p-4 bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            {['all', 'draft', 'active', 'archived'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${statusFilter === s ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30' : 'text-slate-400 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'}`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {statusFilter !== 'all' && (
            <button onClick={() => setStatusFilter('all')} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Clear</button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-white/[0.04] rounded w-24" />
                  <div className="h-2.5 bg-white/[0.03] rounded w-16" />
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                <div className="h-3 w-3 rounded-full bg-white/[0.04]" />
                <div className="h-3 w-3 rounded-full bg-white/[0.04]" />
              </div>
              <div className="h-2.5 bg-white/[0.03] rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5">
            <Palette className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {search || statusFilter !== 'all' ? 'No brand kits match' : 'No brand kits yet'}
          </h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            {search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first brand kit to define colours, logos and email styling.'}
          </p>
          {!search && statusFilter === 'all' && (
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <Plus className="w-4 h-4" /> Create Brand Kit
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => (
            <div key={kit.id} className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: kit.colour_settings?.primary || '#06B6D4' }}>
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/email/brand-kits/${kit.id}`} className="font-semibold text-sm text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate block">
                      {kit.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate">{kit.product_name || 'No product'}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === kit.id ? null : kit.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {actionMenu === kit.id && (
                    <div className="absolute right-0 top-8 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/email/brand-kits/${kit.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button onClick={() => handleDuplicate(kit)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full">
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </button>
                      {!kit.is_default && kit.status === 'active' && (
                        <button onClick={() => handleSetDefault(kit)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full">
                          <Star className="w-3.5 h-3.5" /> Set as Default
                        </button>
                      )}
                      {kit.status !== 'archived' ? (
                        <button onClick={() => setConfirmAction({ type: 'archive', kit })} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer w-full">
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ type: 'restore', kit })} className="flex items-center gap-2 px-3 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer w-full">
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {kit.is_default && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> Default
                  </span>
                )}
                {statusBadge(kit.status)}
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                {kit.colour_settings && (
                  <>
                    {colourDot(kit.colour_settings.primary)}
                    {colourDot(kit.colour_settings.secondary)}
                    {colourDot(kit.colour_settings.accent)}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>{kit.template_count ?? 0} template{kit.template_count !== 1 ? 's' : ''}</span>
                <span>{new Date(kit.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_100px_80px_120px_60px] gap-3 px-5 py-3 text-[11px] font-medium text-slate-500 border-b border-[rgba(255,255,255,0.04)] uppercase tracking-wider">
            <span>Brand Kit</span><span>Status</span><span>Templates</span><span>Default</span><span>Updated</span><span></span>
          </div>
          {filteredKits.map((kit) => (
            <div key={kit.id} className="grid grid-cols-[1fr_120px_100px_80px_120px_60px] gap-3 px-5 py-3.5 border-b border-[rgba(255,255,255,0.03)] last:border-0 items-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: kit.colour_settings?.primary || '#06B6D4' }}>
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <Link href={`/admin/email/brand-kits/${kit.id}`} className="font-medium text-sm text-white hover:text-[#06B6D4] transition-colors cursor-pointer truncate block">{kit.name}</Link>
                  <p className="text-[11px] text-slate-500 truncate">{kit.product_name || ''}</p>
                </div>
              </div>
              <div>{statusBadge(kit.status)}</div>
              <span className="text-sm text-slate-400">{kit.template_count ?? 0}</span>
              <span>{kit.is_default ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <span className="text-slate-600">—</span>}</span>
              <span className="text-xs text-slate-500">{new Date(kit.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/email/brand-kits/${kit.id}`} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-[400px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {confirmAction.type === 'archive' ? 'Archive Brand Kit' : 'Restore Brand Kit'}
                </h3>
                <p className="text-xs text-slate-400">
                  {confirmAction.type === 'archive'
                    ? `Archiving "${confirmAction.kit.name}" will hide it from active use but keep existing template connections.`
                    : `Restoring "${confirmAction.kit.name}" will make it available again.`
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap">Cancel</button>
              <button
                onClick={() => confirmAction.type === 'archive' ? handleArchive(confirmAction.kit) : handleRestore(confirmAction.kit)}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all cursor-pointer whitespace-nowrap ${confirmAction.type === 'archive' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {confirmAction.type === 'archive' ? 'Archive' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}