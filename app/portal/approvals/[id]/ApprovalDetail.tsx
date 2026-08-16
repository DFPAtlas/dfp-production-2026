'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, XCircle,
  Eye, MessageSquare, ExternalLink, Calendar, ChevronRight,
  Loader2, Image, FileText, Globe, Tag, User, Send,
  RotateCcw, ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../../PortalShell';
import {
  APPROVAL_TYPES, APPROVAL_STATUSES, APPROVAL_ITEM_TYPES,
  getApprovalTypeDef, getApprovalStatusDef,
} from '@/lib/approval-definitions';

interface Approval {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  approval_type: string;
  status: string;
  priority: string;
  version: number;
  submitted_by?: string | null;
  due_date?: string | null;
  submitted_at?: string | null;
  viewed_at?: string | null;
  responded_at?: string | null;
  approved_at?: string | null;
  responded_by?: string | null;
  client_visible: boolean;
}

interface ApprovalItem {
  id: string;
  name: string;
  description?: string | null;
  item_type: string;
  file_ref?: string | null;
  preview_url?: string | null;
  external_url?: string | null;
  display_order: number;
}

interface Comment {
  id: string;
  author_id?: string | null;
  author_role: string;
  comment_text: string;
  client_visible: boolean;
  parent_id?: string | null;
  created_at?: string;
}

interface ProjectData {
  id: string;
  name: string;
  staging_url?: string | null;
  live_url?: string | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
}

export default function ApprovalDetail({ approvalId }: { approvalId: string }) {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showChangesConfirm, setShowChangesConfirm] = useState(false);
  const [changesFeedback, setChangesFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [approvalId]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Session expired'); setLoading(false); return; }

    setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Client');
    setUserId(session.user.id);

    const { data: approvalData, error: approvalErr } = await supabase
      .from('client_approvals')
      .select('*')
      .eq('id', approvalId)
      .maybeSingle();

    if (approvalErr || !approvalData) {
      setError('Approval not found or you do not have access.');
      setLoading(false);
      return;
    }

    setApproval(approvalData);

    const [{ data: projectData }, { data: itemsData }, { data: commentsData }] = await Promise.all([
      supabase.from('projects').select('id, name, staging_url, live_url').eq('id', approvalData.project_id).maybeSingle(),
      supabase.from('approval_items').select('*').eq('approval_id', approvalId).order('display_order'),
      supabase.from('approval_comments').select('*').eq('approval_id', approvalId).eq('client_visible', true).order('created_at', { ascending: true }),
    ]);

    if (projectData) setProject(projectData);
    if (itemsData) setItems(itemsData);
    if (commentsData) setComments(commentsData);

    const authorIds = new Set<string>();
    if (approvalData.submitted_by) authorIds.add(approvalData.submitted_by);
    if (commentsData) commentsData.forEach((c: Comment) => { if (c.author_id) authorIds.add(c.author_id); });

    if (authorIds.size > 0) {
      const { data: staffData } = await supabase
        .from('staff_profiles')
        .select('id, full_name')
        .in('id', Array.from(authorIds));
      if (staffData) {
        const map: Record<string, StaffProfile> = {};
        for (const s of staffData) map[s.id] = s;
        setStaffProfiles(map);
      }
    }

    setLoading(false);
  }

  async function handleApprove() {
    setActing(true);
    setActionError(null);

    const { data, error: rpcError } = await supabase.rpc('app_private.transition_approval_status', {
      p_approval_id: approvalId,
      p_new_status: 'approved',
      p_comment_text: 'Approved by client.',
    });

    if (rpcError) {
      setActionError(rpcError.message);
    } else if (data?.success) {
      setSuccessMsg('Approved successfully.');
      setShowApproveConfirm(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setActionError(data?.error || 'Failed to approve');
    }
    setActing(false);
  }

  async function handleRequestChanges() {
    if (!changesFeedback.trim()) return;
    setActing(true);
    setActionError(null);

    const { data, error: rpcError } = await supabase.rpc('app_private.transition_approval_status', {
      p_approval_id: approvalId,
      p_new_status: 'changes_requested',
      p_comment_text: changesFeedback.trim(),
    });

    if (rpcError) {
      setActionError(rpcError.message);
    } else if (data?.success) {
      setSuccessMsg('Changes requested. The team has been notified.');
      setShowChangesConfirm(false);
      setChangesFeedback('');
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setActionError(data?.error || 'Failed to request changes');
    }
    setActing(false);
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSending(true);

    const { error: commentError } = await supabase.from('approval_comments').insert({
      approval_id: approvalId,
      author_id: userId,
      author_role: 'client',
      comment_text: newComment.trim(),
      client_visible: true,
    });

    if (!commentError) {
      setNewComment('');
      fetchData();
    }
    setSending(false);
  }

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (error || !approval) {
    return (
      <PortalShell>
        <div className="text-center py-20">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error || 'Approval not found'}</p>
          <Link href="/portal/approvals" className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Back to Approvals</Link>
        </div>
      </PortalShell>
    );
  }

  const typeDef = getApprovalTypeDef(approval.approval_type);
  const statusDef = getApprovalStatusDef(approval.status);
  const submittedByName = approval.submitted_by && staffProfiles[approval.submitted_by]
    ? staffProfiles[approval.submitted_by].full_name : 'Digital Footprint team';

  const canAct = approval.status === 'awaiting_client' || approval.status === 'viewed' || approval.status === 'resubmitted';

  return (
    <PortalShell>
      <div className="mx-auto max-w-[900px] space-y-5">
        <Link href="/portal/approvals" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Approvals
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111F32] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{approval.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 text-sm">
                {project && (
                  <Link href={`/portal/projects/${project.id}`} className="text-slate-400 hover:text-[#06B6D4] transition-colors">
                    {project.name}
                  </Link>
                )}
                <span className="text-slate-600">·</span>
                <span style={{ color: typeDef.color }}>{typeDef.label}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">v{approval.version}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
              {statusDef.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 border-b border-white/[0.07] pb-4">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Submitted by {submittedByName}</span>
            {approval.submitted_at && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(approval.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
            {approval.due_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {new Date(approval.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
          </div>

          {approval.description && (
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">{approval.description}</p>
            </div>
          )}
        </motion.div>

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </motion.div>
        )}

        {actionError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-4 h-4" /> {actionError}
          </motion.div>
        )}

        {items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#111F32] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Review Items ({items.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map(item => {
                const itemTypeDef = APPROVAL_ITEM_TYPES.find(t => t.value === item.item_type);
                return (
                  <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                        {item.item_type === 'image' && <Image className="w-4 h-4 text-[#06B6D4]" />}
                        {item.item_type === 'staging_link' && <Globe className="w-4 h-4 text-[#06B6D4]" />}
                        {item.item_type === 'milestone_summary' && <Tag className="w-4 h-4 text-[#06B6D4]" />}
                        {(item.item_type === 'pdf' || item.item_type === 'document' || item.item_type === 'file') && <FileText className="w-4 h-4 text-[#06B6D4]" />}
                        {(item.item_type === 'copy' || item.item_type === 'other') && <Eye className="w-4 h-4 text-[#06B6D4]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 capitalize mt-0.5">{itemTypeDef?.label || item.item_type}</p>
                        {item.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          {item.preview_url && (
                            <a href={item.preview_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#67E8F9] cursor-pointer">
                              <ExternalLink className="w-3 h-3" /> Preview
                            </a>
                          )}
                          {item.external_url && (
                            <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#67E8F9] cursor-pointer">
                              <ExternalLink className="w-3 h-3" /> Open
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-[#111F32] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Comments ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">No comments yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {comments.map(c => {
                const authorName = c.author_id && staffProfiles[c.author_id]
                  ? staffProfiles[c.author_id].full_name
                  : c.author_role === 'client' ? 'You' : 'Staff';
                const isClient = c.author_role === 'client';
                return (
                  <div key={c.id} className={`rounded-xl p-4 ${isClient
                    ? 'bg-[#06B6D4]/5 border border-[#06B6D4]/10 ml-8'
                    : 'bg-white/[0.03] border border-white/[0.06] mr-8'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isClient ? 'bg-[#06B6D4]/20 text-[#67E8F9]' : 'bg-white/10 text-slate-400'}`}>
                        {isClient ? 'Y' : authorName[0]?.toUpperCase() || 'S'}
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{authorName}</span>
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.comment_text}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40 transition-all" />
            <button onClick={handleAddComment} disabled={sending || !newComment.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer whitespace-nowrap transition-all">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </motion.div>

        {canAct && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#111F32] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Your Response</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setShowApproveConfirm(true); setActionError(null); }}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => { setShowChangesConfirm(true); setActionError(null); setChangesFeedback(''); }}
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shadow-lg shadow-amber-500/20">
                <RotateCcw className="w-4 h-4" /> Request Changes
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showApproveConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowApproveConfirm(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Confirm Approval</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  You are about to approve <span className="text-white font-semibold">{approval.title}</span>.
                  This will confirm that you are satisfied with the delivered work.
                </p>
                {actionError && (
                  <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {actionError}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-5">
                  <button onClick={handleApprove} disabled={acting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {acting ? 'Approving...' : 'Yes, approve'}
                  </button>
                  <button onClick={() => setShowApproveConfirm(false)}
                    className="px-4 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showChangesConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowChangesConfirm(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Request Changes</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Please explain what needs to be changed so the team can update the work.
                </p>
                <textarea value={changesFeedback} onChange={e => setChangesFeedback(e.target.value)}
                  placeholder="Describe what needs changing..." rows={4} maxLength={500}
                  className="w-full px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 resize-none" />
                <div className="text-right text-[10px] text-slate-500 mt-1">{changesFeedback.length}/500</div>
                {actionError && (
                  <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {actionError}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <button onClick={handleRequestChanges} disabled={acting || !changesFeedback.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {acting ? 'Submitting...' : 'Submit feedback'}
                  </button>
                  <button onClick={() => setShowChangesConfirm(false)}
                    className="px-4 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}
