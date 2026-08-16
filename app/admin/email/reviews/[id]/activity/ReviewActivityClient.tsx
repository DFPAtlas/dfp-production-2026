'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, Download, Loader2 } from 'lucide-react';

interface ActivityEvent {
  id: string;
  action: string;
  detail: string;
  user: string;
  category: 'snapshot' | 'invitation' | 'access' | 'comment' | 'decision' | 'admin' | 'system';
  time: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  snapshot: 'bg-slate-400',
  invitation: 'bg-violet-400',
  access: 'bg-sky-400',
  comment: 'bg-amber-400',
  decision: 'bg-emerald-400',
  admin: 'bg-red-400',
  system: 'bg-slate-500',
};

export default function ReviewActivityClient({ id }: { id: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [reviewName, setReviewName] = useState('Review');
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [pkgRes, reviewersRes, commentsRes, tokensRes] = await Promise.all([
        supabase.from('email_review_packages').select('id, name, review_round, created_at').eq('id', id).maybeSingle(),
        supabase.from('email_review_reviewers').select('id, display_name, notified_at, last_viewed_at, decision, decision_at, decision_note').eq('review_id', id).limit(500),
        supabase.from('email_review_comments').select('id, author_id, body, created_at').eq('review_id', id).order('created_at', { ascending: true }).limit(1000),
        supabase.from('email_review_access_tokens').select('id, reviewer_id, last_used_at, revoked_at').eq('review_id', id).limit(1000),
      ]);

      if (cancelled) return;
      const pkg = pkgRes.data;
      if (pkg) {
        setReviewName((pkg.name as string) || 'Review');
        setRound(typeof pkg.review_round === 'number' ? (pkg.review_round as number) : 1);
      }

      const reviewers = (reviewersRes.data || []) as Record<string, unknown>[];
      const reviewerName = new Map<string, string>();
      reviewers.forEach((r) => reviewerName.set(r.id as string, (r.display_name as string) || 'Reviewer'));

      const comments = (commentsRes.data || []) as Record<string, unknown>[];
      const tokens = (tokensRes.data || []) as Record<string, unknown>[];

      const rows: ActivityEvent[] = [];

      if (pkg && pkg.created_at) {
        rows.push({
          id: 'created',
          action: 'Review package created',
          detail: `${(pkg.name as string) || 'Review'} created`,
          user: 'System',
          category: 'admin',
          time: pkg.created_at as string,
        });
      }

      reviewers.forEach((r) => {
        const name = reviewerName.get(r.id as string) || 'Reviewer';
        if (r.notified_at) {
          rows.push({ id: `invite-${r.id}`, action: 'Invitation sent', detail: `${name} invitation dispatched`, user: name, category: 'invitation', time: r.notified_at as string });
        }
        if (r.last_viewed_at) {
          rows.push({ id: `view-${r.id}`, action: 'Review link viewed', detail: `${name} viewed the preview`, user: name, category: 'access', time: r.last_viewed_at as string });
        }
        if (r.decision_at) {
          rows.push({ id: `decision-${r.id}`, action: 'Decision submitted', detail: `${name} — ${(r.decision as string || 'decision').replace(/_/g, ' ')}`, user: name, category: 'decision', time: r.decision_at as string });
        }
      });

      comments.forEach((c) => {
        const authorId = (c.author_id as string) || '';
        const name = reviewerName.get(authorId) || 'Internal';
        rows.push({ id: `comment-${c.id}`, action: 'Comment added', detail: `${name}: ${((c.body as string) || '').slice(0, 80)}`, user: name, category: 'comment', time: c.created_at as string });
      });

      tokens.forEach((t) => {
        const reviewerId = (t.reviewer_id as string) || '';
        const name = reviewerName.get(reviewerId) || 'Reviewer';
        if (t.last_used_at) {
          rows.push({ id: `token-${t.id}`, action: 'Token verified', detail: `${name} passed email verification`, user: name, category: 'access', time: t.last_used_at as string });
        }
        if (t.revoked_at) {
          rows.push({ id: `revoke-${t.id}`, action: 'Access revoked', detail: `${name} access link revoked`, user: 'System', category: 'admin', time: t.revoked_at as string });
        }
      });

      rows.sort((a, b) => (a.time < b.time ? 1 : -1));
      if (!cancelled) {
        setEvents(rows);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const filtered = events.filter((e) => {
    const matchesSearch = e.action.toLowerCase().includes(search.toLowerCase()) || e.detail.toLowerCase().includes(search.toLowerCase()) || e.user.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/email/reviews/${id}`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{reviewName} — Activity Log</h1>
          <p className="text-sm text-slate-400 mt-0.5">Complete audit trail for this review · Round {round}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 pr-8"
        >
          <option value="all">All Categories</option>
          <option value="snapshot">Snapshot</option>
          <option value="invitation">Invitation</option>
          <option value="access">Access</option>
          <option value="comment">Comment</option>
          <option value="decision">Decision</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[rgba(255,255,255,0.06)]" />
          <div className="divide-y divide-[rgba(255,255,255,0.03)]">
            {filtered.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={`relative z-10 w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${CATEGORY_COLORS[event.category]} ring-4 ring-[#121215]`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{event.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{event.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 block">{event.user}</span>
                  <span className="text-[11px] text-slate-600 mt-0.5 block">
                    {new Date(event.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-slate-400">{events.length === 0 ? 'No activity recorded yet' : 'No matching activity found'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Audit Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white/[0.02] rounded-xl text-center">
            <p className="text-lg font-bold text-white">{events.length}</p>
            <p className="text-[10px] text-slate-500">Total Events</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl text-center">
            <p className="text-lg font-bold text-emerald-400">{events.filter((e) => e.category === 'decision').length}</p>
            <p className="text-[10px] text-slate-500">Decisions</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl text-center">
            <p className="text-lg font-bold text-amber-400">{events.filter((e) => e.category === 'comment').length}</p>
            <p className="text-[10px] text-slate-500">Comments</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl text-center">
            <p className="text-lg font-bold text-sky-400">{events.filter((e) => e.category === 'access').length}</p>
            <p className="text-[10px] text-slate-500">Access Events</p>
          </div>
        </div>
      </div>
    </div>
  );
}