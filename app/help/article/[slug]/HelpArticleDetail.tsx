'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { helpCategoryConfig } from '@/lib/cms-definitions';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category_id: string | null;
  category_label: string | null;
  audience: string;
  content_document: Record<string, unknown>[] | null;
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  last_reviewed_at: string | null;
  updated_at: string;
}

export default function HelpArticleDetail({ slug }: { slug: string }) {
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('help_articles')
      .select('*')
      .eq('slug', slug)
      .eq('article_status', 'Published')
      .eq('public_visibility', 'Public')
      .is('archived_at', null)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data as HelpArticle | null);
        setLoading(false);
      });
  }, [slug]);

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    setFeedback(type);
    if (type === 'helpful' && article) {
      await supabase
        .from('help_articles')
        .update({ helpful_count: (article.helpful_count || 0) + 1 })
        .eq('id', article.id);
      setFeedbackSubmitted(true);
    }
  };

  const handleNotHelpfulSubmit = async () => {
    if (!article) return;
    await supabase
      .from('help_articles')
      .update({ not_helpful_count: (article.not_helpful_count || 0) + 1 })
      .eq('id', article.id);
    setFeedbackSubmitted(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center px-6">
          <i className="ri-error-warning-line w-16 h-16 text-slate-300 mx-auto mb-4 flex items-center justify-center" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Article Not Found</h1>
          <p className="text-slate-500 mb-6">This article may have been moved or is no longer available.</p>
          <Link href="/help" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-xl hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
            Browse Help Centre
          </Link>
        </div>
      </main>
    );
  }

  const cat = article.category_id ? helpCategoryConfig[article.category_id] : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
            <Link href="/help" className="hover:text-[#06B6D4] transition-colors cursor-pointer">Help Centre</Link>
            <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center" />
            {article.category_id && (
              <Link href={`/help/${article.category_id}`} className="hover:text-[#06B6D4] transition-colors cursor-pointer">
                {article.category_label || cat?.label || article.category_id}
              </Link>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{article.title}</h1>
          {article.summary && (
            <p className="text-slate-500">{article.summary}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
            <span>Updated {new Date(article.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {cat && (
              <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/8 text-[#06B6D4] font-medium">{article.category_label || cat.label}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="prose prose-slate max-w-none">
          {article.content_document && article.content_document.length > 0 ? (
            article.content_document.map((block, i) => {
              const type = block.type as string;
              const content = block.content as string;
              if (type === 'heading') {
                return <h2 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3">{content}</h2>;
              }
              if (type === 'paragraph') {
                return <p key={i} className="text-slate-600 leading-relaxed mb-4">{content}</p>;
              }
              if (type === 'warning') {
                return (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 flex items-start gap-3">
                    <i className="ri-error-warning-line w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 flex items-center justify-center" />
                    <p className="text-amber-800 text-sm">{content}</p>
                  </div>
                );
              }
              if (type === 'note') {
                return (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 flex items-start gap-3">
                    <i className="ri-information-line w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 flex items-center justify-center" />
                    <p className="text-blue-800 text-sm">{content}</p>
                  </div>
                );
              }
              return null;
            })
          ) : (
            <p className="text-slate-500 italic">No content available for this article.</p>
          )}
        </div>

        {/* Feedback */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          {!feedbackSubmitted ? (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-4">Was this article helpful?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFeedback('helpful')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    feedback === 'helpful'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
                >
                  <i className={`${feedback === 'helpful' ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'} w-4 h-4 flex items-center justify-center`} />
                  Yes, helpful
                </button>
                <button
                  onClick={() => handleFeedback('not-helpful')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    feedback === 'not-helpful'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-red-200 hover:text-red-600'
                  }`}
                >
                  <i className={`${feedback === 'not-helpful' ? 'ri-thumb-down-fill' : 'ri-thumb-down-line'} w-4 h-4 flex items-center justify-center`} />
                  Not helpful
                </button>
              </div>
              {feedback === 'not-helpful' && (
                <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-600 mb-3">What was the issue? (optional)</p>
                  <textarea
                    value={feedbackReason}
                    onChange={e => setFeedbackReason(e.target.value)}
                    placeholder="Tell us what could be improved..."
                    maxLength={500}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400">{feedbackReason.length}/500</span>
                    <button
                      onClick={handleNotHelpfulSubmit}
                      className="px-4 py-2 bg-[#0A1628] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A5F] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <i className="ri-check-line w-5 h-5 text-emerald-500 flex items-center justify-center" />
              <span className="text-slate-600">Thank you for your feedback.</span>
            </div>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
          <Link href="/help" className="flex items-center gap-1.5 text-sm text-[#06B6D4] hover:text-[#0891B2] font-medium cursor-pointer">
            <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
            Back to Help Centre
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/support" className="text-sm text-slate-500 hover:text-[#06B6D4] cursor-pointer">
              Get Support
            </Link>
            <Link href="/support/request" className="text-sm text-slate-500 hover:text-[#06B6D4] cursor-pointer">
              Submit a Request
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}