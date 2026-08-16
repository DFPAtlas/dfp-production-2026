'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  APPROVAL_TYPES, APPROVAL_STATUSES, APPROVAL_PRIORITIES,
  APPROVAL_ITEM_TYPES, getApprovalTypeDef, getApprovalStatusDef, getApprovalPriorityDef,
} from '@/lib/approval-definitions';
import {
  Plus, Send, Eye, CheckCircle, XCircle, Trash2, Edit2,
  Loader2, AlertTriangle, ExternalLink, Clock, Calendar,
  MessageSquare, Paperclip, Image, FileText, ChevronDown, ChevronUp,
  Save, X, Flag, RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  client_id?: string | null;
}

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
  created_at?: string;
  updated_at?: string;
}

interface ApprovalItem {
  id: string;
  approval_id: string;
  name: string;
  description?: string | null;
  item_type: string;
  file_ref?: string | null;
  preview_url?: string | null;
  external_url?: string | null;
  display_order: number;
}

interface ApprovalComment {
  id: string;
  approval_id: string;
  author_id?: string | null;
  author_role: string;
  comment_text: string;
  client_visible: boolean;
  parent_id?: string | null;
  created_at?: string;
  edited_at?: string | null;
}

interface StaffProfile {
  id: string;
  full_name: string;
}

interface Props {
  project: Project;
  onProjectUpdated: () => void;
}

export default function ApprovalsTab({ project, onProjectUpdated }: Props) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<Record<string, StaffProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', approval_type: 'design', priority: 'normal', due_date: '',
  });
  const [creating, setCreating] = useState(false);

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '', description: '', item_type: 'other', preview_url: '', external_url: '',
  });
  const [addingItem, setAddingItem] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
    fetchStaff();
  }, [project.id]);

  async function fetchStaff() {
    const { data } = await supabase.from('staff_profiles').select('id, full_name');
    if (data) {
      const map: Record<string, StaffProfile> = {};
      for (const s of data) map[s.id] = s;
      setStaffProfiles(map);
    }
  }

  async function fetchApprovals() {
    setLoading(true);
    const { data } = await supabase
      .from('client_approvals')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    if (data) setApprovals(data as Approval[]);
    setLoading(false);
  }

  async function selectApproval(a: Approval) {
    setSelectedApproval(a);
    setExpandedApproval(expandedApproval === a.id ? null : a.id);
    const [{ data: itemData }, { data: commentData }] = await Promise.all([
      supabase.from('approval_items').select('*').eq('approval_id', a.id).order('display_order'),
      supabase.from('approval_comments').select('*').eq('approval_id', a.id).order('created_at', { ascending: true }),
    ]);
    if (itemData) setItems(itemData as ApprovalItem[]);
    if (commentData) setComments(commentData as ApprovalComment[]);
  }

  async function handleCreateApproval() {
    if (!createForm.title.trim()) return;
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('client_approvals').insert({
      project_id: project.id,
      title: createForm.title,
      description: createForm.description || null,
      approval_type: createForm.approval_type,
      priority: createForm.priority,
      due_date: createForm.due_date || null,
      submitted_by: session?.user?.id,
      status: 'draft',
      client_visible: true,
      version: 1,
    });

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Approval draft created.' });
      setShowCreateForm(false);
      setCreateForm({ title: '', description: '', approval_type: 'design', priority: 'normal', due_date: '' });
      fetchApprovals();
      onProjectUpdated();
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setCreating(false);
  }

  async function handleSubmitApproval(id: string) {
    if (!confirm('Submit this approval to the client? They will be notified and it will appear in their Action Needed panel.')) return;
    setSubmitting(true);

    const { error } = await supabase.rpc('app_private.transition_approval_status', {
      p_approval_id: id,
      p_new_status: 'awaiting_client',
      p_comment_text: null,
    });

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Approval submitted to client.' });
      fetchApprovals();
      onProjectUpdated();
      setSelectedApproval(null);
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setSubmitting(false);
  }

  async function handleCancelApproval(id: string) {
    if (!confirm('Cancel this approval? This cannot be undone.')) return;
    const { error } = await supabase.from('client_approvals').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      fetchApprovals();
      setSelectedApproval(null);
      onProjectUpdated();
    }
  }

  async function handleArchiveApproval(id: string) {
    if (!confirm('Archive this approval?')) return;
    const { error } = await supabase.from('client_approvals').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      fetchApprovals();
      setSelectedApproval(null);
      onProjectUpdated();
    }
  }

  async function handleAddItem() {
    if (!itemForm.name.trim() || !selectedApproval) return;
    setAddingItem(true);
    const { error } = await supabase.from('approval_items').insert({
      approval_id: selectedApproval.id,
      name: itemForm.name,
      description: itemForm.description || null,
      item_type: itemForm.item_type,
      preview_url: itemForm.preview_url || null,
      external_url: itemForm.external_url || null,
      display_order: items.length + 1,
    });
    if (!error) {
      setShowItemForm(false);
      setItemForm({ name: '', description: '', item_type: 'other', preview_url: '', external_url: '' });
      selectApproval(selectedApproval);
    }
    setAddingItem(false);
  }

  async function handleDeleteItem(itemId: string) {
    await supabase.from('approval_items').delete().eq('id', itemId);
    if (selectedApproval) selectApproval(selectedApproval);
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedApproval) return;
    setSendingComment(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('approval_comments').insert({
      approval_id: selectedApproval.id,
      author_id: session?.user?.id,
      author_role: 'staff',
      comment_text: newComment.trim(),
      client_visible: true,
    });
    if (!error) {
      setNewComment('');
      selectApproval(selectedApproval);
    }
    setSendingComment(false);
  }

  async function handleAddInternalComment() {
    if (!newComment.trim() || !selectedApproval) return;
    setSendingComment(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('approval_comments').insert({
      approval_id: selectedApproval.id,
      author_id: session?.user?.id,
      author_role: 'staff',
      comment_text: newComment.trim(),
      client_visible: false,
    });
    if (!error) {
      setNewComment('');
      selectApproval(selectedApproval);
    }
    setSendingComment(false);
  }

  async function handleResubmit() {
    if (!selectedApproval) return;
    if (!confirm('Resubmit this approval to the client with an incremented version?')) return;
    setSubmitting(true);
    const { error } = await supabase.from('client_approvals').update({
      status: 'resubmitted',
      version: selectedApproval.version + 1,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selectedApproval.id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      await supabase.rpc('app_private.transition_approval_status', {
        p_approval_id: selectedApproval.id,
        p_new_status: 'awaiting_client',
        p_comment_text: null,
      });
      setSaveMsg({ type: 'success', text: 'Approval resubmitted.' });
      fetchApprovals();
      onProjectUpdated();
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {saveMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#06B6D4]" /> Approvals ({approvals.length})
        </h3>
        <button onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /> Create Approval
        </button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Approval title" value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
              <select value={createForm.approval_type} onChange={e => setCreateForm({ ...createForm, approval_type: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                {APPROVAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                {APPROVAL_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input type="date" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })}
                className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white cursor-pointer" />
            </div>
            <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Description (optional, for internal reference)" rows={2} maxLength={500}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40 resize-none" />
            <div className="flex items-center gap-2">
              <button onClick={handleCreateApproval} disabled={creating || !createForm.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
              </button>
              <button onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 text-slate-400 hover:text-white cursor-pointer text-xs">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {approvals.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <CheckCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No approvals yet</p>
          <p className="text-xs text-slate-500 mt-1">Create an approval to send work for client review.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map(a => {
            const typeDef = getApprovalTypeDef(a.approval_type);
            const statusDef = getApprovalStatusDef(a.status);
            const priorityDef = getApprovalPriorityDef(a.priority);
            const isExpanded = expandedApproval === a.id && selectedApproval?.id === a.id;

            return (
              <div key={a.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                <button onClick={() => selectApproval(a)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDef.color }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span style={{ color: typeDef.color }}>{typeDef.label}</span>
                        <span className="text-slate-500">v{a.version}</span>
                        {a.due_date && <span className="text-slate-500"><Calendar className="w-3 h-3 inline mr-0.5" />{new Date(a.due_date).toLocaleDateString('en-GB')}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                      {statusDef.label}
                    </span>
                    {priorityDef.value !== 'normal' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
                        {priorityDef.label}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[rgba(255,255,255,0.06)]">
                      <div className="p-4 space-y-4">
                        {a.description && (
                          <div className="bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1 font-medium">Description</p>
                            <p className="text-sm text-slate-300">{a.description}</p>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Review Items ({items.length})</p>
                            <button onClick={() => setShowItemForm(true)}
                              className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#67E8F9] cursor-pointer">
                              <Plus className="w-3 h-3" /> Add item
                            </button>
                          </div>

                          <AnimatePresence>
                            {showItemForm && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                className="mb-3 p-3 bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input type="text" placeholder="Item name" value={itemForm.name}
                                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
                                  <select value={itemForm.item_type} onChange={e => setItemForm({ ...itemForm, item_type: e.target.value })}
                                    className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer appearance-none">
                                    {APPROVAL_ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                  </select>
                                </div>
                                <input type="text" placeholder="Description (optional)" value={itemForm.description}
                                  onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                  className="w-full px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input type="url" placeholder="Preview URL (optional)" value={itemForm.preview_url}
                                    onChange={e => setItemForm({ ...itemForm, preview_url: e.target.value })}
                                    className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
                                  <input type="url" placeholder="External URL (optional)" value={itemForm.external_url}
                                    onChange={e => setItemForm({ ...itemForm, external_url: e.target.value })}
                                    className="px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={handleAddItem} disabled={addingItem || !itemForm.name.trim()}
                                    className="px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer whitespace-nowrap">
                                    {addingItem ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                                  </button>
                                  <button onClick={() => setShowItemForm(false)}
                                    className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {items.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2">No review items added yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {items.map(item => {
                                const itemTypeDef = APPROVAL_ITEM_TYPES.find(t => t.value === item.item_type);
                                return (
                                  <div key={item.id} className="flex items-center justify-between bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] text-slate-500">{itemTypeDef?.label || item.item_type}</span>
                                      <span className="text-sm text-slate-200 truncate">{item.name}</span>
                                      {item.preview_url && (
                                        <a href={item.preview_url} target="_blank" rel="noopener noreferrer"
                                          className="text-[#06B6D4] hover:text-[#67E8F9] shrink-0"><ExternalLink className="w-3 h-3" /></a>
                                      )}
                                    </div>
                                    <button onClick={() => handleDeleteItem(item.id)}
                                      className="text-slate-500 hover:text-red-400 shrink-0 cursor-pointer ml-2"><X className="w-3 h-3" /></button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comments ({comments.length})</p>
                          {comments.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2">No comments yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {comments.map(c => {
                                const authorName = c.author_id && staffProfiles[c.author_id]
                                  ? staffProfiles[c.author_id].full_name
                                  : c.author_role === 'client' ? 'Client' : 'Staff';
                                return (
                                  <div key={c.id} className={`rounded-lg p-3 ${c.client_visible ? 'bg-white/[0.03]' : 'bg-amber-500/5 border border-amber-500/10'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-slate-300">{authorName}</span>
                                      <span className="text-[10px] text-slate-500">{c.author_role}</span>
                                      {!c.client_visible && <span className="text-[10px] text-amber-400">Internal</span>}
                                      <span className="text-[10px] text-slate-600 ml-auto">
                                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300">{c.comment_text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                              placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                              className="flex-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#06B6D4]/40" />
                            <button onClick={handleAddComment} disabled={sendingComment || !newComment.trim()}
                              className="px-3 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer whitespace-nowrap">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleAddInternalComment} disabled={sendingComment || !newComment.trim()}
                              className="px-3 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                              Internal
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[rgba(255,255,255,0.06)]">
                          {a.status === 'draft' && (
                            <button onClick={() => handleSubmitApproval(a.id)} disabled={submitting}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#8B5CF6] text-white rounded-lg text-xs font-semibold hover:bg-[#7C3AED] disabled:opacity-50 cursor-pointer whitespace-nowrap">
                              <Send className="w-3.5 h-3.5" /> Submit to Client
                            </button>
                          )}
                          {a.status === 'changes_requested' && (
                            <button onClick={handleResubmit} disabled={submitting}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer whitespace-nowrap">
                              <RotateCcw className="w-3.5 h-3.5" /> Resubmit (v{a.version + 1})
                            </button>
                          )}
                          {['draft', 'awaiting_client', 'viewed', 'changes_requested'].includes(a.status) && (
                            <button onClick={() => handleCancelApproval(a.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 cursor-pointer whitespace-nowrap">
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          )}
                          {['approved', 'cancelled'].includes(a.status) && (
                            <button onClick={() => handleArchiveApproval(a.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">
                              <Trash2 className="w-3.5 h-3.5" /> Archive
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500 ml-auto">
                            {a.submitted_at && `Submitted ${new Date(a.submitted_at).toLocaleDateString('en-GB')}`}
                            {a.responded_at && ` · Responded ${new Date(a.responded_at).toLocaleDateString('en-GB')}`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}