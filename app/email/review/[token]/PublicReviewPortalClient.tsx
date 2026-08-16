'use client';

import { useState } from 'react';
import { Eye, MessageSquare, CheckCircle2, RotateCcw, XCircle, Clock, ShieldCheck } from 'lucide-react';

interface ReviewerInfo {
  displayName: string;
  email: string;
  role: string;
  company: string;
  reviewerType: string;
}

interface ReviewPortalData {
  reviewName: string;
  sourceName: string;
  sourceVersion: string;
  brand: string;
  reviewType: string;
  instructions: string;
  subject: string;
  previewText: string;
  dueDate: string;
  status: string;
  reviewer: ReviewerInfo;
}

const MOCK_PORTAL: ReviewPortalData = {
  reviewName: 'Q3 Welcome Campaign',
  sourceName: 'Welcome Series v3',
  sourceVersion: 'v3.2.1',
  brand: 'Digital Footprint',
  reviewType: 'campaign_signoff',
  instructions: 'Please review the Q3 welcome campaign including all three email variants (desktop, mobile, plain text). Pay special attention to the new CTA placement and the updated brand colours. Legal footer has already been approved in a separate review.',
  subject: 'Welcome to Digital Footprint — Let\'s Get Started',
  previewText: 'Your account is ready. Here\'s everything you need to know to hit the ground running.',
  dueDate: '2026-07-25',
  status: 'in_review',
  reviewer: {
    displayName: 'Sarah Mitchell',
    email: 'sarah@clientcorp.com',
    role: 'Marketing Director',
    company: 'ClientCorp',
    reviewerType: 'required',
  },
};

export default function PublicReviewPortalClient() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'plain'>('desktop');
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: string; text: string; source: string; time: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'comments'>('preview');

  const data = MOCK_PORTAL;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [...prev, { id: `c-${Date.now()}`, text: commentText, source: 'General', time: new Date().toISOString() }]);
    setCommentText('');
  };

  const handleSubmitDecision = () => {
    if (!decision) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Decision Submitted</h1>
          <p className="text-sm text-slate-500 mb-6">
            Your {decision === 'approved' ? 'approval' : decision === 'changes_requested' ? 'change request' : decision === 'rejected' ? 'rejection' : 'feedback'} has been recorded for {data.reviewName}.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Your Decision</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                decision === 'approved' || decision === 'approved_with_comments' ? 'bg-emerald-100 text-emerald-700' :
                decision === 'changes_requested' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>{decision.replace(/_/g, ' ')}</span>
            </div>
            {decisionNote && <p className="text-sm text-slate-600">{decisionNote}</p>}
          </div>
          <p className="text-xs text-slate-400">You may close this page. The review owner has been notified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">{data.reviewName}</h1>
              <p className="text-[11px] text-slate-500">{data.brand} · {data.sourceVersion}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="text-xs font-medium text-slate-600">{data.reviewer.displayName}</p>
                <p className="text-[10px] text-slate-400">{data.reviewer.role} · {data.reviewer.company}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Reviewer</span>
            </div>
            {data.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Due {new Date(data.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-5 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-2">Review Instructions</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{data.instructions}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'preview' ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'comments' ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
                </button>
              </div>

              {activeTab === 'preview' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewMode('desktop')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap ${
                        viewMode === 'desktop' ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                      }`}
                    >Desktop</button>
                    <button
                      onClick={() => setViewMode('mobile')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap ${
                        viewMode === 'mobile' ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                      }`}
                    >Mobile</button>
                    <button
                      onClick={() => setViewMode('plain')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap ${
                        viewMode === 'plain' ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                      }`}
                    >Plain Text</button>
                  </div>

                  <div className={`bg-slate-100 rounded-xl border border-slate-200 overflow-hidden ${viewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
                    <div className="relative">
                      <div className="p-6 space-y-4 min-h-[400px]">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-2">From: Digital Footprint &lt;hello@digital-footprint.uk&gt;</div>
                          <div className="text-sm font-bold text-slate-800 mb-1">{data.subject}</div>
                          <div className="text-xs text-slate-500 mb-3">{data.previewText}</div>
                          <div className="h-2 w-3/4 bg-slate-200 rounded mb-2" />
                          <div className="h-2 w-full bg-slate-200 rounded mb-2" />
                          <div className="h-2 w-5/6 bg-slate-200 rounded mb-2" />
                          <div className="h-2 w-2/3 bg-slate-200 rounded mb-4" />
                          <div className="h-32 bg-slate-100 rounded-lg mb-4" />
                          <div className="flex gap-2">
                            <div className="h-10 w-28 bg-[#06B6D4] rounded-md" />
                            <div className="h-10 w-28 bg-slate-200 rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-slate-400">
                    <ShieldCheck className="w-3 h-3 inline mr-1" />
                    Sandboxed preview — interactive elements and sensitive links replaced for security
                  </p>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-700 flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      This is an immutable snapshot (v3.2.1). The source content may have changed since this review was created.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="p-6 space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No comments yet</p>
                      <p className="text-xs text-slate-400 mt-1">Add a comment below to start the discussion</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c) => (
                        <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{data.reviewer.displayName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-sky-100 text-sky-700">You</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{new Date(c.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-600">{c.source}</p>
                          <p className="text-sm text-slate-700 mt-1">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30"
                      maxLength={500}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Submit Your Decision</h3>
              {!decisionOpen ? (
                <div className="space-y-2">
                  <button
                    onClick={() => { setDecisionOpen(true); setDecision('approved'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-emerald-700 block">Approve</span>
                      <span className="text-[11px] text-emerald-600">Content meets all requirements</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setDecisionOpen(true); setDecision('approved_with_comments'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors cursor-pointer group"
                  >
                    <MessageSquare className="w-5 h-5 text-sky-600" />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-sky-700 block">Approve with Comments</span>
                      <span className="text-[11px] text-sky-600">Approved but with minor suggestions</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setDecisionOpen(true); setDecision('changes_requested'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer group"
                  >
                    <RotateCcw className="w-5 h-5 text-amber-600" />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-amber-700 block">Request Changes</span>
                      <span className="text-[11px] text-amber-600">Changes needed before approval</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { setDecisionOpen(true); setDecision('rejected'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer group"
                  >
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-red-700 block">Reject</span>
                      <span className="text-[11px] text-red-600">Content does not meet requirements</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      decision === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      decision === 'approved_with_comments' ? 'bg-sky-100 text-sky-700' :
                      decision === 'changes_requested' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{decision.replace(/_/g, ' ')}</span>
                    <button onClick={() => setDecisionOpen(false)} className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Change</button>
                  </div>
                  {(decision === 'changes_requested' || decision === 'rejected') && (
                    <p className="text-xs text-slate-500">A note is required for this decision.</p>
                  )}
                  <textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder={decision === 'approved_with_comments' ? 'Optional comments...' : 'Explain the reason for this decision...'}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 resize-none h-24"
                    maxLength={500}
                  />
                  <button
                    onClick={handleSubmitDecision}
                    disabled={((decision === 'changes_requested' || decision === 'rejected') && !decisionNote.trim())}
                    className="w-full px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Decision
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Review Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Source</span>
                  <span className="text-slate-700 font-medium">{data.sourceName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Version</span>
                  <span className="text-slate-700 font-medium">{data.sourceVersion}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Brand</span>
                  <span className="text-slate-700 font-medium">{data.brand}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Reviewer Role</span>
                  <span className="text-slate-700 font-medium capitalize">{data.reviewer.reviewerType}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Due</span>
                  <span className="text-slate-700 font-medium">
                    {data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                This is a secure, read-only review portal. You cannot edit the email content. Your comments and decisions are recorded as approval evidence. For questions, contact the review owner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}