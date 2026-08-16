'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { helpCategoryConfig } from '@/lib/cms-definitions';
import HelpArticleCard from './HelpArticleCard';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category_id: string | null;
  category_label: string | null;
  article_status: string;
  public_visibility: string;
  is_featured: boolean;
  sort_order: number;
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const HELP_AUDIENCES = [
  { key: 'all', label: 'All', icon: 'ri-global-line' },
  { key: 'public', label: 'General', icon: 'ri-user-line' },
  { key: 'existing-clients', label: 'Clients', icon: 'ri-building-line' },
  { key: 'uat-testers', label: 'Testers', icon: 'ri-test-tube-line' },
  { key: 'pbx-users', label: 'PBX Users', icon: 'ri-phone-line' },
];

export default function HelpCentrePage() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [results, setResults] = useState<HelpArticle[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    supabase
      .from('help_articles')
      .select('id,title,slug,summary,category_id,category_label,article_status,public_visibility,is_featured,sort_order,helpful_count,not_helpful_count,view_count,created_at,updated_at')
      .eq('article_status', 'Published')
      .eq('public_visibility', 'Public')
      .is('archived_at', null)
      .order('sort_order')
      .then(({ data }) => {
        setArticles((data || []) as HelpArticle[]);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const q = search.toLowerCase();
    const filtered = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (a.category_label || '').toLowerCase().includes(q)
    );
    setResults(filtered);
  };

  const categories = articles.reduce<Record<string, { label: string; icon: string; count: number }>>((acc, a) => {
    const id = a.category_id || 'other';
    if (!acc[id]) {
      acc[id] = {
        label: a.category_label || helpCategoryConfig[id]?.label || id,
        icon: helpCategoryConfig[id]?.icon || 'ri-folder-line',
        count: 0,
      };
    }
    acc[id].count++;
    return acc;
  }, {});

  const featured = articles.filter(a => a.is_featured);
  const displayArticles = audienceFilter === 'all' ? articles : articles.filter(a => {
    if (audienceFilter === 'public') return a.article_status === 'Published';
    return a.article_status === 'Published';
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Help Centre</h1>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Find answers to common questions about Digital Footprint services, products and your account.
          </p>
          <form onSubmit={handleSearch} className="max-w-lg mx-auto relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 flex items-center justify-center" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setSearched(false); }}
              placeholder="Search help articles..."
              className="w-full pl-11 pr-24 py-3.5 bg-white/10 border border-white/[0.12] rounded-2xl text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4]/50 backdrop-blur"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {searched ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {results.length > 0 ? `Results for "${search}"` : `No results for "${search}"`}
              </h2>
              <button
                onClick={() => { setSearched(false); setSearch(''); setResults([]); }}
                className="text-sm text-[#06B6D4] hover:text-[#0891B2] font-medium cursor-pointer whitespace-nowrap"
              >
                Clear search
              </button>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <i className="ri-search-line w-12 h-12 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
                <p className="text-slate-500 mb-2">No articles match your search.</p>
                <p className="text-sm text-slate-400 mb-6">Try different keywords or browse by category below.</p>
                <Link href="/support" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                  Contact Support
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(a => (
                  <HelpArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Featured Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featured.map(a => (
                    <HelpArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Audience filter */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
              {HELP_AUDIENCES.map(aud => (
                <button
                  key={aud.key}
                  onClick={() => setAudienceFilter(aud.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    audienceFilter === aud.key
                      ? 'bg-[#0A1628] text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <i className={`${aud.icon} w-3.5 h-3.5 flex items-center justify-center`} />
                  {aud.label}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Browse by Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(categories).map(([id, cat]) => (
                  <Link
                    key={id}
                    href={`/help/${id}`}
                    className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-md hover:shadow-[#06B6D4]/5 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
                      <i className={`${cat.icon} w-5 h-5 text-[#06B6D4] flex items-center justify-center`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-[#06B6D4] transition-colors truncate">{cat.label}</p>
                      <p className="text-xs text-slate-400">{cat.count} article{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* All articles */}
            {displayArticles.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-5">All Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayArticles.map(a => (
                    <HelpArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0A1628] to-[#1E3A5F] rounded-2xl p-8 md:p-10 text-center text-white">
          <i className="ri-customer-service-line w-10 h-10 text-[#06B6D4] mx-auto mb-4 flex items-center justify-center" />
          <h2 className="text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            Our support team is ready to help with your questions. Choose the right support option for you.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/support" className="px-6 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
              Get Support
            </Link>
            <Link href="/support/request" className="px-6 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 border border-white/15 transition-colors cursor-pointer whitespace-nowrap">
              Submit a Request
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}