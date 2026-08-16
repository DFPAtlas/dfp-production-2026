'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { formatMessageTime, formatMessageTimeFull, getTicketStatusLabel, getTicketCategoryLabel, getTicketPriorityLabel, getTicketStatusColor, getPriorityColor, generateTicketRef } from '@/lib/message-definitions';
import { Headphones, Plus, Search, Clock, CheckCircle, XCircle, Loader2, ExternalLink, FolderKanban, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';
import { sendNotificationEmail, buildTicketEmailHtml } from '@/lib/email-notifications';

interface Ticket {
  id: string;
  ticket_reference: string;
  client_id: string;
  project_id: string | null;
  website_id: string | null;
  thread_id: string | null;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_staff: string | null;
  created_by: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Website {
  id: string;
  name: string;
}

type FilterKey = 'all' | 'open' | 'awaiting_client' | 'in_progress' | 'resolved';

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [newPriority, setNewPriority] = useState('normal');
  const [newProjectId, setNewProjectId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUserId(session.user.id);

      const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', session.user.id).maybeSingle();
      const cid = clientData?.id || null;
      setClientId(cid);

      if (cid) {
        const [ticketRes, projRes, webRes] = await Promise.all([
          supabase.from('support_tickets').select('*').eq('client_id', cid).order('created_at', { ascending: false }),
          supabase.from('projects').select('id, name').eq('client_id', cid).order('name'),
          supabase.from('client_websites').select('id, name').eq('client_id', cid).eq('client_visible', true).order('name'),
        ]);
        setTickets(ticketRes.data || []);
        setProjects(projRes.data || []);
        setWebsites(webRes.data || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleCreateTicket() {
    if (!newSubject.trim() || !newDescription.trim() || creating || !clientId) return;
    setCreating(true);

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_client_support_ticket', {
      p_client_id: clientId,
      p_subject: newSubject.trim(),
      p_description: newDescription.trim(),
      p_category: newCategory,
      p_priority: newPriority,
      p_project_id: newProjectId || null,
    });

    if (rpcErr || !rpcResult?.success) {
      setCreating(false);
      return;
    }

    setShowNewModal(false);
    setNewSubject('');
    setNewDescription('');
    setNewProjectId('');
    setNewCategory('other');
    setNewPriority('normal');
    setCreating(false);

    const { data: fresh } = await supabase.from('support_tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    setTickets(fresh || []);

    if (rpcResult?.ticket_reference && rpcResult?.ticket_id) {
      sendNotificationEmail({
        event_type: 'ticket_created',
        related_entity_id: rpcResult.ticket_id,
        subject: `Support request submitted: ${rpcResult.ticket_reference}`,
        html: buildTicketEmailHtml('created', rpcResult.ticket_reference, newSubject.trim(), '', `${window.location.origin}/portal/support/${rpcResult.ticket_id}`),
      }).catch(() => {});
    }
  }

  const openCount = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled').length;

  const filteredTickets = tickets.filter(t => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!t.subject.toLowerCase().includes(s) && !t.ticket_reference.toLowerCase().includes(s)) return false;
    }
    switch (filter) {
      case 'open': return t.status === 'new' || t.status === 'open' || t.status === 'assigned';
      case 'awaiting_client': return t.status === 'awaiting_client';
      case 'in_progress': return t.status === 'in_progress' || t.status === 'awaiting_team';
      case 'resolved': return t.status === 'resolved' || t.status === 'closed';
      default: return true;
    }
  });

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'awaiting_client', label: 'Awaiting You' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const websiteMap = new Map(websites.map(w => [w.id, w.name]));

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Support</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {openCount > 0 ? `${openCount} open ticket${openCount !== 1 ? 's' : ''}` : 'No open tickets'}
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold hover:bg-[#7C3AED] transition-colors cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />New Request
          </button>
        </motion.div>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all" />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filter === f.key ? 'bg-[#8B5CF6]/15 text-[#C4B5FD]' : 'bg-[#1E293B] text-slate-400 hover:text-white'
                }`}>{f.label}</button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center">
            <Headphones className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">{searchTerm ? 'No matching tickets' : 'No support tickets'}</h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchTerm ? 'Try a different search term' : 'Create a support request and our team will get back to you.'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold hover:bg-[#7C3AED] transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />New Support Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => {
              const statusColor = getTicketStatusColor(ticket.status);
              const priorityColor = getPriorityColor(ticket.priority);
              return (
                <Link key={ticket.id} href={`/portal/support/${ticket.id}`}
                  className="block bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.14)] transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{ticket.ticket_reference}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                        {ticket.priority === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${priorityColor}15`, color: priorityColor }}>
                            {getTicketPriorityLabel(ticket.priority)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-white truncate">{ticket.subject}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-400">{getTicketCategoryLabel(ticket.category)}</span>
                        {ticket.project_id && projectMap.has(ticket.project_id) && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <FolderKanban className="w-3 h-3" />{projectMap.get(ticket.project_id)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-500">{formatMessageTime(ticket.updated_at || ticket.created_at)}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 ml-0">{ticket.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {showNewModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">New Support Request</h3>
                  <button onClick={() => setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/5">
                    <span className="text-lg">&times;</span>
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                    <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Brief description of your issue"
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#8B5CF6]/30 transition-all cursor-pointer pr-8">
                        {['website_issue', 'account', 'access', 'billing', 'content', 'change_request', 'technical', 'hosting', 'security', 'other'].map(c => (
                          <option key={c} value={c} className="bg-[#1E293B]">{getTicketCategoryLabel(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                      <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#8B5CF6]/30 transition-all cursor-pointer pr-8">
                        <option value="low" className="bg-[#1E293B]">Low</option>
                        <option value="normal" className="bg-[#1E293B]">Normal</option>
                        <option value="high" className="bg-[#1E293B]">High</option>
                        <option value="urgent" className="bg-[#1E293B]">Urgent</option>
                      </select>
                    </div>
                  </div>
                  {projects.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Related Project (optional)</label>
                      <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:border-[#8B5CF6]/30 transition-all cursor-pointer pr-8">
                        <option value="">None</option>
                        {projects.map(p => <option key={p.id} value={p.id} className="bg-[#1E293B]">{p.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Please describe your issue in detail..."
                      rows={5} maxLength={3000}
                      className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all resize-none" />
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{newDescription.length}/3000</p>
                  </div>
                  <button onClick={handleCreateTicket} disabled={creating || !newSubject.trim() || !newDescription.trim()}
                    className="w-full py-2.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold hover:bg-[#7C3AED] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap">
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalShell>
  );
}
