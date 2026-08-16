'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ReusableSection, SECTION_CATEGORIES } from '@/components/admin/email/editor/brand-types';
import { Search, MoreHorizontal, Eye, Trash2, Archive, RotateCcw, X, Layers, Grid3X3, ArrowLeft } from 'lucide-react';

export default function ReusableSectionsPage() {
  const [sections, setSections] = useState<ReusableSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [previewSection, setPreviewSection] = useState<ReusableSection | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('email_reusable_sections').select('*, email_brand_kits(name)');

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},description.ilike.${q},category.ilike.${q}`);
    }
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }
    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      const mapped: ReusableSection[] = (data as Array<Record<string, unknown>>).map((item) => {
        const brand = item.email_brand_kits as { name: string } | null;
        return { ...item, brand_name: brand?.name || null } as unknown as ReusableSection;
      });
      setSections(mapped);
    }
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => { const h = () => setActionMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);

  const handleArchive = async (s: ReusableSection) => { await supabase.from('email_reusable_sections').update({ status: 'archived' }).eq('id', s.id); setFeedback('Section archived'); fetchSections(); setActionMenu(null); };
  const handleRestore = async (s: ReusableSection) => { await supabase.from('email_reusable_sections').update({ status: 'active' }).eq('id', s.id); setFeedback('Section restored'); fetchSections(); setActionMenu(null); };
  const handleDelete = async (s: ReusableSection) => { await supabase.from('email_reusable_sections').delete().eq('id', s.id); setFeedback('Section deleted'); fetchSections(); setActionMenu(null); };

  const typeBadge = (type: string) => {
    const m: Record<string, string> = { system: 'bg-purple-500/10 text-purple-400 border-purple-500/20', brand: 'bg-blue-500/10 text-blue-400 border-blue-500/20', custom: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${m[type] || m.custom}`}>{type}</span>;
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reusable Sections</h1>
          <p className="text-sm text-slate-400 mt-1">Save and manage reusable email sections across templates.</p>
        </div>
        <Link href="/admin/email/templates" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>
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
          <input type="text" placeholder="Search sections..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none cursor-pointer pr-8">
          <option value="all">All Categories</option>
          {SECTION_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')}</option>)}
        </select>
        <span className="text-xs text-slate-600">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<div key={i} className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-pulse"><div className="h-4 bg-white/[0.04] rounded w-32 mb-3" /><div className="h-3 bg-white/[0.03] rounded w-24 mb-4" /><div className="h-20 bg-white/[0.02] rounded-lg" /></div>))}
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-5"><Layers className="w-7 h-7 text-slate-500" /></div>
          <h2 className="text-lg font-bold text-white mb-2">{search || categoryFilter !== 'all' ? 'No sections match' : 'No reusable sections yet'}</h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">{search || categoryFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Save sections from templates to reuse them across emails.'}</p>
          {!search && categoryFilter === 'all' && (
            <Link href="/admin/email/templates" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">Go to Templates</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <div key={s.id} className="bg-[#0d0d10] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-white truncate">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 capitalize">{s.category.replace(/-/g, ' ')}</span>
                    {typeBadge(s.section_type)}
                    {s.status === 'archived' && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border bg-slate-600/10 text-slate-500 border-slate-600/20">Archived</span>}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === s.id ? null : s.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {actionMenu === s.id && (
                    <div className="absolute right-0 top-8 w-40 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setPreviewSection(s)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer w-full"><Eye className="w-3.5 h-3.5" /> Preview</button>
                      {s.status !== 'archived' ? (
                        <button onClick={() => handleArchive(s)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer w-full"><Archive className="w-3.5 h-3.5" /> Archive</button>
                      ) : (
                        <>
                          <button onClick={() => handleRestore(s)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer w-full"><RotateCcw className="w-3.5 h-3.5" /> Restore</button>
                          <button onClick={() => handleDelete(s)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer w-full"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {s.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.description}</p>}
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-lg h-24 flex items-center justify-center mb-3 overflow-hidden">
                {s.rendered_html ? <iframe srcDoc={s.rendered_html} className="w-full h-full scale-[0.35] origin-top-left" style={{ width: '286%', height: '286%' }} sandbox="allow-same-origin" title={s.name} /> : <Grid3X3 className="w-5 h-5 text-slate-600" />}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600">
                <span>{s.brand_name || 'No brand'}</span>
                <span>{new Date(s.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewSection(null)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div><h3 className="font-semibold text-white">{previewSection.name}</h3><p className="text-xs text-slate-500 capitalize">{previewSection.category.replace(/-/g, ' ')}</p></div>
              <button onClick={() => setPreviewSection(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {previewSection.rendered_html ? <iframe srcDoc={previewSection.rendered_html} className="w-full min-h-[400px] border border-[rgba(255,255,255,0.06)] rounded-xl" sandbox="allow-same-origin" /> : <div className="flex items-center justify-center h-[400px] text-slate-500"><p>No rendered preview available</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}