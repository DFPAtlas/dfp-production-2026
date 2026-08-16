'use client';

import Link from 'next/link';
import { helpCategoryConfig } from '@/lib/cms-definitions';

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

export default function HelpArticleCard({ article }: { article: HelpArticle }) {
  const cat = article.category_id ? helpCategoryConfig[article.category_id] : null;

  return (
    <Link
      href={`/help/article/${article.slug}`}
      className="block bg-white rounded-xl p-5 border border-slate-200 hover:border-[#06B6D4]/30 hover:shadow-md hover:shadow-[#06B6D4]/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className={`${cat?.icon || 'ri-file-text-line'} w-4 h-4 text-[#06B6D4] flex items-center justify-center`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {cat && (
              <span className="text-[10px] font-medium text-[#06B6D4] bg-[#06B6D4]/8 px-2 py-0.5 rounded-full whitespace-nowrap">
                {article.category_label || cat.label}
              </span>
            )}
            {article.is_featured && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-[#06B6D4] transition-colors mb-1">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-xs text-slate-500 line-clamp-2">{article.summary}</p>
          )}
        </div>
      </div>
    </Link>
  );
}