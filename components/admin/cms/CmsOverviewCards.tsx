'use client';

import { CmsMetrics } from '@/hooks/useCmsData';

export default function CmsOverviewCards({ metrics, loading }: { metrics: CmsMetrics; loading: boolean }) {
  const cards = [
    { label: 'Total Pages', value: metrics.totalPages, icon: 'ri-file-text-line', color: '#06B6D4', filter: '' },
    { label: 'Published', value: metrics.publishedPages, icon: 'ri-check-double-line', color: '#10B981', filter: 'published' },
    { label: 'Draft', value: metrics.draftPages, icon: 'ri-draft-line', color: '#94A3B8', filter: 'draft' },
    { label: 'Awaiting Review', value: metrics.reviewPages, icon: 'ri-eye-line', color: '#3B82F6', filter: 'review' },
    { label: 'Approved', value: metrics.approvedPages, icon: 'ri-check-line', color: '#7C3AED', filter: 'approved' },
    { label: 'Scheduled', value: metrics.scheduledPages, icon: 'ri-calendar-line', color: '#F59E0B', filter: 'scheduled' },
    { label: 'Recent (14d)', value: metrics.recentPublications, icon: 'ri-time-line', color: '#06B6D4', filter: 'recent' },
    { label: 'Review Overdue', value: metrics.expiredReview, icon: 'ri-alert-line', color: '#EF4444', filter: 'overdue' },
    { label: 'Active Redirects', value: metrics.activeRedirects, icon: 'ri-share-forward-line', color: '#F97316', filter: '' },
    { label: 'Media Assets', value: metrics.mediaCount, icon: 'ri-image-line', color: '#8B5CF6', filter: '' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-white/5 rounded w-2/3 mb-2" />
            <div className="h-6 bg-white/5 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.12)] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
              <i className={`${card.icon} w-3.5 h-3.5 flex items-center justify-center`} style={{ color: card.color }} />
            </div>
            <span className="text-xs text-slate-400">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}