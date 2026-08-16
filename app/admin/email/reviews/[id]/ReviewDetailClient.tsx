'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, FileCheck, Users, Clock, MessageSquare, CheckCircle2, XCircle,
  RotateCcw, Ban, Eye, ExternalLink, ShieldCheck, AlertTriangle,
  ChevronDown, MoreVertical, Send, Plus, Copy, History, Loader2,
} from 'lucide-react';

interface Reviewer {
  id: string;
  displayName: string;
  email: string;
  company: string;
  role: string;
  reviewerType: string;
  accessStatus: string;
  decision: string | null;
  decisionAt: string | null;
  decisionNote: string | null;
  lastViewed: string | null;
}

interface Comment {
  id: string;
  author: string;
  authorType: string;
  body: string;
  sourceLocation: string | null;
  sourceType: string | null;
  status: string;
  visibility: string;
  createdAt: string;
  replies: Comment[];
}

interface ReviewDetail {
  id: string;
  name: string;
  sourceType: string;
  sourceName: string;
  sourceVersion: string;
  brand: string;
  language: string;
  reviewType: string;
  status: string;
  approvalPolicy: string;
  dueDate: string | null;
  instructions: string;
  subject: string;
  previewText: string;
  owner: string;
  createdBy: string;
  createdAt: string;
  round: number;
  previousReviewId: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' },
  invited: { label: 'Invited', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20' },
  verified: { label: 'Verified', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  viewed: { label: 'Viewed', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  reviewing: { label: 'Reviewing', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  completed: { label: 'Completed', color: 'text-slate-300', bg: 'bg-slate-300/10 border-slate-300/20' },
  revoked: { label: 'Revoked', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  expired: { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
};

const REVIEW_STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: FileCheck },
  ready_to_send: { label: 'Ready to Send', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: FileCheck },
  sent: { label: 'Sent', color: 'text-sky-400', bg: 'bg-sky-400/10', icon: Send },
  viewed: { label: 'Viewed', color: 'text-violet-400', bg: 'bg-violet-400/10', icon: Eye },
  in_review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: MessageSquare },
  changes_requested: { label: 'Changes Req.', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: RotateCcw },
  partially_approved: { label: 'Partial App.', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: ShieldCheck },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

const POLICY_LABELS: Record<string, string> = {
  any_one: 'Any One Required',
  all_required: 'All Required',
  minimum_count: 'Minimum Count',
  one_per_group: 'One Per Group',
  sequential: 'Sequential',
  legal_plus_product: 'Legal + Product Owner',
  internal_then_external: 'Internal Then External',
  external_then_internal: 'External Then Final Internal',
};

interface ActivityEvent {
  action: string;
  detail: string;
  time: string;
  color: string;
}

export default function ReviewDetailClient({ id }: { id: string }) {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'comments' | 'activity'>('overview');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [pkgRes, reviewersRes, commentsRes] = await Promise.all([
        supabase.from('email_review_packages').select('*').eq('id', id).maybeSingle(),
        supabase.from('email_review_reviewers').select('*').eq('review_id', id).order('sort_order', { ascending: true }).limit(500),
        supabase.from('email_review_comments').select('*').eq('review_id', id).order('created_at', { ascending: true }).limit(1000),
      ]);

      if (cancelled) return;
      const pkg = pkgRes.data;
      if (pkg) {
        setReview({
          id: pkg.id as string,
          name: (pkg.name as string) || 'Untitled review',
          sourceType: (pkg.source_type as string) || 'template',
          sourceName: (pkg.source_id as string) || '—',
          sourceVersion: (pkg.source_version as string) || '—',
          brand: (pkg.brand as string) || '—',
          language: (pkg.language as string) || 'en',
          reviewType: (pkg.review_type as string) || 'content',
          status: (pkg.status as string) || 'draft',
          approvalPolicy: (pkg.approval_policy as string) || 'all_required',
          dueDate: (pkg.due_date as string) || null,
          instructions: (pkg.instructions as string) || '',
          subject: (pkg.subject as string) || '—',
          previewText: (pkg.preview_text as string) || '—',
          owner: (pkg.owner as string) || '—',
          createdBy: (pkg.created_by as string) || '—',
          createdAt: (pkg.created_at as string) || '',
          round: typeof pkg.review_round === 'number' ? (pkg.review_round as number) : 1,
          previousReviewId: (pkg.previous_review_id as string) || null,
        });
      } else {
        setReview(null);
      }

      const reviewerRows = ((reviewersRes.data || []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        displayName: (r.display_name as string) || 'Reviewer',
        email: (r.email as string) || '—',
        company: (r.company as string) || '—',
        role: (r.role as string) || '—',
        reviewerType: (r.reviewer_type as string) || 'required',
        accessStatus: (r.access_status as string) || 'pending',
        decision: (r.decision as string) || null,
        decisionAt: (r.decision_at as string) || null,
        decisionNote: (r.decision_note as string) || null,
        lastViewed: (r.last_viewed_at as string) || null,
      }));
      setReviewers(reviewerRows);

      const nameById = new Map<string, string>();
      reviewerRows.forEach((r) => nameById.set(r.id, r.displayName));

      const rawComments = (commentsRes.data || []) as Record<string, unknown>[];
      const commentRows: Comment[] = rawComments.map((c) => {
        const authorId = (c.author_id as string) || '';
        const isReviewer = nameById.has(authorId);
        return {
          id: c.id as string,
          author: isReviewer ? (nameById.get(authorId) as string) : 'Internal',
          authorType: isReviewer ? 'reviewer' : 'internal',
          body: (c.body as string) || '',
          sourceLocation: (c.source_location as string) || null,
          sourceType: (c.source_type as string) || null,
          status: (c.status as string) || 'open',
          visibility: (c.visibility as string) || 'all',
          createdAt: (c.created_at as string) || '',
          replies: [],
        };
      });

      const byId = new Map<string, Comment>();
      const topLevel: Comment[] = [];
      commentRows.forEach((c) => byId.set(c.id, c));
      rawComments.forEach((c, i) => {
        const parentId = (c.parent_comment_id as string) || null;
        const node = commentRows[i];
        if (parentId && byId.has(parentId)) {
          byId.get(parentId)!.replies.push(node);
        } else {
          topLevel.push(node);
        }
      });
      setComments(topLevel);

      const events: ActivityEvent[] = [];
      if (pkg && pkg.created_at) {
        events.push({ action: 'Review package created', detail: `${(pkg.name as string) || 'Review'} created`, time: pkg.created_at as string, color: 'text-slate-400' });
      }
      reviewerRows.forEach((r) => {
        if (r.decisionAt) {
          events.push({ action: 'Decision submitted', detail: `${r.displayName} — ${(r.decision || 'decision').replace(/_/g, ' ')}`, time: r.decisionAt, color: r.decision === 'changes_requested' ? 'text-orange-400' : r.decision === 'rejected' ? 'text-red-400' : 'text-emerald-400' });
        }
      });
      commentRows.forEach((c) => {
        events.push({ action: 'Comment added', detail: `${c.author}: ${c.body.slice(0, 80)}`, time: c.createdAt, color: 'text-amber-400' });
      });
      events.sort((a, b) => (a.time < b.time ? 1 : -1));
      setActivity(events.slice(0, 20));

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <FileCheck className="w-10 h-10 text-slate-600" />
        <p className="text-sm text-slate-400">Review not found</p>
        <Link href="/admin/email/reviews" className="text-xs text-[#06B6D4] hover:text-[#22D3EE] cursor-pointer">Back to reviews</Link>
      </div>
    );
  }

  const rs = REVIEW_STATUS_META[review.status] || REVIEW_STATUS_META.draft;
  const StatusIcon = rs.icon;

  const decisionCounts = {
    approved: reviewers.filter((r) => r.decision === 'approved' || r.decision === 'approved_with_comments').length,
    changes: reviewers.filter((r) => r.decision === 'changes_requested').length,
    rejected: reviewers.filter((r) => r.decision === 'rejected').length,
    pending: reviewers.filter((r) => !r.decision || r.decision === 'acknowledged' || r.decision === 'abstained').length,
  };

  const requiredReviewers = reviewers.filter((r) => r.reviewerType === 'required');

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: FileCheck },
    { key: 'preview' as const, label: 'Preview', icon: Eye },
    { key: 'comments' as const, label: `Comments (${comments.length})`, icon: MessageSquare },
    { key: 'activity' as const, label: 'Activity', icon: History },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/reviews" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{review.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${rs.bg} ${rs.color}`}>
              <StatusIcon className="w-3 h-3" />
              {rs.label}
            </span>
            <span className="text-xs text-slate-500">Round {review.round}</span>
            <span className="text-xs text-slate-500">{review.sourceName} ({review.sourceVersion})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex border-b border-[rgba(255,255,255,0.06)]">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]'
                        : 'text-slate-400 hover:text-white border-b-2 border-transparent'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Instructions</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{review.instructions || 'No instructions provided.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</h3>
                      <p className="text-sm text-white">{review.subject}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview Text</h3>
                      <p className="text-sm text-slate-300">{review.previewText}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reviewers</h3>
                    {reviewers.length === 0 ? (
                      <p className="text-xs text-slate-500">No reviewers assigned yet</p>
                    ) : (
                      <div className="space-y-2">
                        {reviewers.map((rvr) => {
                          const accessMeta = STATUS_META[rvr.accessStatus] || STATUS_META.pending;
                          return (
                            <div key={rvr.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-[#06B6D4]">{rvr.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{rvr.displayName}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500">{rvr.role || '—'} · {rvr.company || '—'}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${rvr.reviewerType === 'required' ? 'bg-amber-400/10 text-amber-400' : rvr.reviewerType === 'optional' ? 'bg-sky-400/10 text-sky-400' : 'bg-slate-400/10 text-slate-400'}`}>
                                      {rvr.reviewerType}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${accessMeta.bg} ${accessMeta.color}`}>
                                  {accessMeta.label}
                                </span>
                                {rvr.decision && (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                    rvr.decision === 'approved' || rvr.decision === 'approved_with_comments' ? 'bg-emerald-400/10 text-emerald-400' :
                                    rvr.decision === 'changes_requested' ? 'bg-orange-400/10 text-orange-400' :
                                    rvr.decision === 'rejected' ? 'bg-red-400/10 text-red-400' :
                                    'bg-slate-400/10 text-slate-400'
                                  }`}>
                                    {rvr.decision.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button className="px-3 py-1.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded-lg text-sm font-medium border border-[#06B6D4]/20 cursor-pointer whitespace-nowrap">Desktop</button>
                    <button className="px-3 py-1.5 bg-white/[0.04] text-slate-400 rounded-lg text-sm font-medium border border-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-colors cursor-pointer whitespace-nowrap">Mobile</button>
                    <button className="px-3 py-1.5 bg-white/[0.04] text-slate-400 rounded-lg text-sm font-medium border border-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-colors cursor-pointer whitespace-nowrap">Plain Text</button>
                  </div>
                  <div className="bg-white rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden shadow-lg">
                    <div className="bg-slate-100 p-6 space-y-4 min-h-[400px]">
                      <div className="bg-white rounded-lg shadow-sm p-4 max-w-md mx-auto">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-2">From: {review.brand}</div>
                        <div className="text-sm font-bold text-slate-800 mb-1">{review.subject}</div>
                        <div className="text-xs text-slate-500 mb-3">{review.previewText}</div>
                        <div className="h-2 w-3/4 bg-slate-200 rounded mb-2" />
                        <div className="h-2 w-full bg-slate-200 rounded mb-2" />
                        <div className="h-2 w-5/6 bg-slate-200 rounded mb-4" />
                        <div className="flex gap-2">
                          <div className="h-8 w-24 bg-[#06B6D4] rounded-md" />
                          <div className="h-8 w-24 bg-slate-200 rounded-md" />
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-slate-400">Sandboxed email preview — interactive elements disabled</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">No comments yet</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{c.author}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${c.authorType === 'internal' ? 'bg-violet-400/10 text-violet-400' : 'bg-sky-400/10 text-sky-400'}`}>
                                {c.authorType === 'internal' ? 'Internal' : 'Reviewer'}
                              </span>
                              {c.visibility === 'internal_only' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-400/10 text-red-400">Internal Only</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {c.sourceLocation && (
                            <div className="text-[11px] text-[#06B6D4] mb-2">{c.sourceLocation}</div>
                          )}
                          <p className="text-sm text-slate-300 leading-relaxed">{c.body}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                              c.status === 'open' ? 'bg-amber-400/10 text-amber-400' :
                              c.status === 'resolved' ? 'bg-emerald-400/10 text-emerald-400' :
                              'bg-slate-400/10 text-slate-400'
                            }`}>{c.status}</span>
                          </div>
                          {c.replies.length > 0 && (
                            <div className="mt-3 ml-6 space-y-2 border-l-2 border-[rgba(255,255,255,0.06)] pl-4">
                              {c.replies.map((r) => (
                                <div key={r.id} className="bg-white/[0.03] rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-white">{r.author}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{r.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add an internal note..."
                      className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none h-10"
                      maxLength={500}
                    />
                    <button className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
                      Add Note
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {activity.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No activity recorded yet</p>
                  ) : (
                    activity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">{item.action}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0">{new Date(item.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                  <Link href={`/admin/email/reviews/${id}/activity`} className="flex items-center gap-1.5 text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer">
                    View Full Activity Log <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Review Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Type</span>
                <span className="text-xs text-slate-300 capitalize">{review.reviewType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Approval Policy</span>
                <span className="text-xs text-slate-300">{POLICY_LABELS[review.approvalPolicy] || review.approvalPolicy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Brand</span>
                <span className="text-xs text-slate-300">{review.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Language</span>
                <span className="text-xs text-slate-300">{review.language?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Source</span>
                <span className="text-xs text-slate-300">{review.sourceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Version</span>
                <span className="text-xs text-slate-300">{review.sourceVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Due Date</span>
                <span className="text-xs text-slate-300">{review.dueDate ? new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Created</span>
                <span className="text-xs text-slate-300">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Owner</span>
                <span className="text-xs text-slate-300">{review.owner}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Decision Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-emerald-400/[0.04] rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-300">Approved</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">{decisionCounts.approved}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-orange-400/[0.04] rounded-lg">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-slate-300">Changes Requested</span>
                </div>
                <span className="text-sm font-bold text-orange-400">{decisionCounts.changes}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-red-400/[0.04] rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-slate-300">Rejected</span>
                </div>
                <span className="text-sm font-bold text-red-400">{decisionCounts.rejected}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-400/[0.04] rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300">Pending</span>
                </div>
                <span className="text-sm font-bold text-slate-400">{decisionCounts.pending}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${requiredReviewers.length > 0 ? (decisionCounts.approved / requiredReviewers.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 text-center">{decisionCounts.approved} of {requiredReviewers.length} required approvals</p>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <Copy className="w-4 h-4" /> Copy Review Links
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
              <Send className="w-4 h-4" /> Send Reminders
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-400/5 border border-red-400/10 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-400/10 transition-all cursor-pointer whitespace-nowrap">
              <Ban className="w-4 h-4" /> Revoke All Links
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}