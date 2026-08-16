'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { helpCategoryConfig } from '@/lib/cms-definitions';
import HelpArticleCard from '../HelpArticleCard';

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

export default function HelpCategoryClient({ category }: { category: string }) {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const catConfig = helpCategoryConfig[category];

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    supabase
      .from('help_articles')
      .select('id,title,slug,summary,category_id,category_label,article_status,public_visibility,is_featured,sort_order,helpful_count,not_helpful_count,view_count,created_at,updated_at')
      .eq('category_id', category)
      .eq('article_status', 'Published')
      .eq('public_visibility', 'Public')
      .is('archived_at', null)
      .order('sort_order')
      .then(({ data }) => {
        setArticles((data || []) as HelpArticle[]);
        setLoading(false);
      });
  }, [category]);

  const otherCategories = Object.entries(helpCategoryConfig).filter(([id]) => id !== category);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0F1F3D] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-4 transition-colors cursor-pointer">
            <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
            Help Centre
          </Link>
          <div className="flex items-center gap-4">
            {catConfig && (
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 flex items-center justify-center flex-shrink-0">
                <i className={`${catConfig.icon} w-6 h-6 text-[#06B6D4] flex items-center justify-center`} />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{catConfig?.label || category}</h1>
              <p className="text-slate-300 text-sm mt-1">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <i className={`${catConfig?.icon || 'ri-folder-line'} w-12 h-12 text-slate-300 mx-auto mb-4 flex items-center justify-center`} />
                <p className="text-slate-500 mb-2">No articles in this category yet.</p>
                <Link href="/help" className="text-sm text-[#06B6D4] hover:text-[#0891B2] font-medium cursor-pointer">
                  Browse all categories
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map(a => (
                  <HelpArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Other Categories</h3>
              <div className="space-y-1">
                {otherCategories.map(([id, config]) => (
                  <Link
                    key={id}
                    href={`/help/${id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-[#06B6D4] hover:bg-[#06B6D4]/5 transition-colors cursor-pointer"
                  >
                    <i className={`${config.icon} w-4 h-4 flex items-center justify-center text-slate-400`} />
                    {config.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-400 mb-3">Need more help?</p>
                <Link
                  href="/support"
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer justify-center whitespace-nowrap"
                >
                  <i className="ri-customer-service-line w-4 h-4 flex items-center justify-center" />
                  Get Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}