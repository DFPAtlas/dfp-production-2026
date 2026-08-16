'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  FileCheck, Eye, MessageSquare, Clock, Users,
  Plus, Search, ArrowRight, MoreVertical, XCircle,
  CheckCircle2, Ban, ShieldCheck, RotateCcw,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  sourceType: string;
  sourceName: string;
  brand: string;
  reviewType: string;
  status: string;
  dueDate: string | null;
  reviewerCount: number;
  decisions: { approved: number; rejected: number; changes: number; pending: number };
  lastActivity: string;
  owner: string;
  round: number;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', icon: FileCheck },
  ready_to_send: { label: 'Ready to Send', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', icon: FileCheck },
  sent: { label: 'Sent', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', icon: Eye },
  viewed: { label: 'Viewed', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20', icon: Eye },
  in_review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: MessageSquare },
  changes_requested: { label: 'Changes Req.', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: RotateCcw },
  partially_approved: { label: 'Partial App.', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: ShieldCheck },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
  expired: { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', icon: Clock },
  revoked: { label: 'Revoked', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', icon: Ban },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', icon: XCircle },
  superseded: { label: 'Superseded', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', icon: RotateCcw },
};

const SOURCE_TYPE_META: Record<string, string> = {
  template: 'Template',
  campaign: 'Campaign',
  experiment: 'Experiment',
  automation: 'Automation',
  transactional: 'Transactional',
  language_variant: 'Language Variant',
  personalised_content: 'Personalised Content',
  brand_header: 'Brand Header',
  brand_footer: 'Brand Footer',
  legal_content: 'Legal Content',
  product_bundle: 'Product Bundle',
};

const REVIEW_TYPE_META: Record<string, string> = {
  content: 'Content Review',
  brand: 'Brand Review',
  legal: 'Legal Review',
  accessibility: 'Accessibility',
  localisation: 'Localisation',
  campaign_signoff: 'Campaign Sign-off',
  product_owner: 'Product Owner',
  general_stakeholder: 'Stakeholder',
};

function decisionKey(decision: string | null): 'approved' | 'rejected' | 'changes' | 'pending' {
  if (decision === 'approved' || decision === 'approved_with_comments') return 'approved';
  if (decision === 'rejected') return 'rejected';
  if (decision === 'changes_requested') return 'changes';
  return 'pending';
}

export default function ReviewsDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [packagesRes, reviewersRes] = await Promise.all([
        supabase.from('email_review_packages').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('email_review_reviewers').select('review_id, decision, decision_at').limit(2000),
      ]);

      const reviewers = (reviewersRes.data || []) as { review_id: string; decision: string | null; decision_at: string | null }[];
      const byReview = new Map<string, { reviewerCount: number; decisions: ReviewItem['decisions']; lastActivity: string }>();
      reviewers.forEach((r) => {
        const entry = byReview.get(r.review_id) || {
          reviewerCount: 0,
          decisions: { approved: 0, rejected: 0, changes: 0, pending: 0 },
          lastActivity: '',
        };
        entry.reviewerCount += 1;
        entry.decisions[decisionKey(r.decision)] += 1;
        if (r.decision_at && r.decision_at > entry.lastActivity) entry.lastActivity = r.decision_at;
        byReview.set(r.review_id, entry);
      });

      const rows = ((packagesRes.data || []) as Record<string, unknown>[]).map((p) => {
        const stats = byReview.get(p.id as string);
        return {
          id: p.id as string,
          name: (p.name as string) || 'Untitled review',
          sourceType: (p.source_type as string) || 'template',
          sourceName: (p.source_id as string) || '—',
          brand: (p.brand as string) || '—',
          reviewType: (p.review_type as string) || 'content',
          status: (p.status as string) || 'draft',
          dueDate: (p.due_date as string) || null,
          reviewerCount: stats?.reviewerCount || 0,
          decisions: stats?.decisions || { approved: 0, rejected: 0, changes: 0, pending: 0 },
          lastActivity: stats?.lastActivity || (p.created_at as string) || '',
          owner: (p.owner as string) || '—',
          round: typeof p.review_round === 'number' ? (p.review_round as number) : 1,
        };
      });
      setReviews(rows);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = reviews.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.sourceName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.reviewType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeReviews = reviews.filter((r) => ['sent', 'viewed', 'in_review', 'partially_approved'].includes(r.status)).length;
  const pendingApproval = reviews.filter((r) => r.status === 'in_review' || r.status === 'partially_approved').length;
  const changesReq = reviews.filter((r) => r.status === 'changes_requested').length;
  const approved = reviews.filter((r) => r.status === 'approved').length;

  const statCards = [
    { label: 'Active Reviews', value: activeReviews, icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Awaiting Sign-off', value: pendingApproval, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Changes Requested', value: changesReq, icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#121215] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-[#121215] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">External Reviews</h1>
          <p className="text-sm text-slate-400 mt-1">Secure client and stakeholder review & approval for email content</p>
        </div>
        <Link href="/admin/email/reviews" className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10">
          <Plus className="w-4 h-4" />
          Create Review
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</span>
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 pr-8"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="in_review">In Review</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 pr-8"
        >
          <option value="all">All Types</option>
          <option value="campaign_signoff">Campaign Sign-off</option>
          <option value="legal">Legal Review</option>
          <option value="product_owner">Product Owner</option>
          <option value="content">Content Review</option>
          <option value="brand">Brand Review</option>
          <option value="localisation">Localisation</option>
          <option value="accessibility">Accessibility</option>
          <option value="general_stakeholder">Stakeholder</option>
        </select>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Review</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reviewers</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Activity</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sm = STATUS_META[r.status] || STATUS_META.draft;
                const StatusIcon = sm.icon;
                return (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/email/reviews/${r.id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors cursor-pointer">
                        {r.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{r.brand}</span>
                        {r.round > 1 && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-violet-400/10 text-violet-400">R{r.round}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-300">{r.sourceName}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{SOURCE_TYPE_META[r.sourceType] || r.sourceType}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-300">{REVIEW_TYPE_META[r.reviewType] || r.reviewType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${sm.bg} ${sm.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white font-medium">{r.reviewerCount}</span>
                        <div className="flex items-center gap-1">
                          {r.decisions.approved > 0 && (
                            <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center">{r.decisions.approved}</span>
                          )}
                          {r.decisions.changes > 0 && (
                            <span className="w-4 h-4 rounded-full bg-orange-400/20 text-orange-400 text-[9px] font-bold flex items-center justify-center">{r.decisions.changes}</span>
                          )}
                          {r.decisions.rejected > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-400/20 text-red-400 text-[9px] font-bold flex items-center justify-center">{r.decisions.rejected}</span>
                          )}
                          {r.decisions.pending > 0 && (
                            <span className="w-4 h-4 rounded-full bg-slate-400/20 text-slate-400 text-[9px] font-bold flex items-center justify-center">{r.decisions.pending}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm ${r.dueDate ? 'text-slate-300' : 'text-slate-600'}`}>
                        {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-300">{r.owner}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500">{r.lastActivity ? new Date(r.lastActivity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{reviews.length === 0 ? 'No reviews created yet' : 'No reviews match your filters'}</p>
                    <p className="text-xs text-slate-500 mt-1">Create a review package to share with external stakeholders</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/admin/email/reviews" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <FileCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Review Detail & Activity</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
        <Link href="/admin/email/settings/external-reviews" className="flex items-center gap-3 px-4 py-3 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[#06B6D4]/30 transition-all cursor-pointer group">
          <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">External Review Settings</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#06B6D4] ml-auto transition-colors" />
        </Link>
      </div>
    </div>
  );
}