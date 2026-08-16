'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMessageTime, getTicketStatusLabel, getTicketCategoryLabel, getTicketPriorityLabel, getTicketStatusColor, getPriorityColor } from '@/lib/message-definitions';
import { Headphones, Search, ExternalLink, RefreshCw, MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { sendNotificationEmail, buildTicketEmailHtml } from '@/lib/email-notifications';

interface Ticket {
  id: string;
  ticket_reference: string;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_staff: string | null;
  created_at: string;
  updated_at: string;
}

export default function SupportTicketsTab({ project, onProjectUpdated }: { project: any; onProjectUpdated: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => { fetchTickets(); fetchStaff(); }, [project.id]);

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  async function fetchStaff() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUserId(session.user.id);
    const { data } = await supabase.from('staff_profiles').select('id, full_name, role').order('full_name');
    setStaffProfiles(data || []);
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    const ticket = tickets.find(t => t.id === ticketId);
    const updates: any = { status: newStatus };
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
    if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
    if (newStatus === 'open' && ticket?.status === 'closed') {
      updates.resolved_at = null;
      updates.closed_at = null;
    }
    await supabase.from('support_tickets').update(updates).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}), ...(newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {}) } : t));

    if (ticket) {
      const action: 'status_changed' | 'awaiting_client' | 'reopened' = 
        newStatus === 'awaiting_client' ? 'awaiting_client' : 
        (newStatus === 'open' && ticket.status === 'closed') ? 'reopened' : 
        'status_changed';
      sendNotificationEmail({
        event_type: `ticket_${action}`,
        related_entity_id: ticketId,
        subject: `Ticket ${ticket.ticket_reference} updated`,
        html: buildTicketEmailHtml(action, ticket.ticket_reference, ticket.subject, getTicketStatusLabel(newStatus), `${window.location.origin}/portal/support/${ticketId}`),
      }).catch(() => {});
    }
  }

  async function assignStaff(ticketId: string, staffId: string | null) {
    const ticket = tickets.find(t => t.id === ticketId);
    const staffName = staffProfiles.find(s => s.id === staffId)?.full_name || 'a team member';
    await supabase.from('support_tickets').update({
      assigned_staff: staffId,
      status: staffId && ticket?.status === 'new' ? 'assigned' : undefined,
      updated_at: new Date().toISOString(),
    }).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assigned_staff: staffId, ...(staffId && t.status === 'new' ? { status: 'assigned' } : {}) } : t));

    if (staffId && ticket) {
      sendNotificationEmail({
        event_type: 'ticket_assigned',
        related_entity_id: ticketId,
        subject: `Ticket ${ticket.ticket_reference} assigned`,
        html: buildTicketEmailHtml('assigned', ticket.ticket_reference, ticket.subject, staffName, `${window.location.origin}/portal/support/${ticketId}`),
      }).catch(() => {});
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!t.subject.toLowerCase().includes(s) && !t.ticket_reference.toLowerCase().includes(s)) return false;
    }
    if (filter === 'open') return t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled';
    if (filter === 'resolved') return t.status === 'resolved' || t.status === 'closed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#8B5CF6]" />Support Tickets
        </h3>
        <button onClick={fetchTickets}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all" />
        </div>
        <div className="flex gap-1">
          {['all', 'open', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all cursor-pointer capitalize ${
                filter === f ? 'bg-[#8B5CF6]/15 text-[#C4B5FD]' : 'bg-[#1E293B] text-slate-400 hover:text-white'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-10 text-center">
          <Headphones className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No support tickets for this project</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map(ticket => {
            const sc = getTicketStatusColor(ticket.status);
            const pc = getPriorityColor(ticket.priority);
            return (
              <div key={ticket.id} className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500">{ticket.ticket_reference}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${sc}15`, color: sc }}>
                        {getTicketStatusLabel(ticket.status)}
                      </span>
                      {ticket.priority === 'urgent' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${pc}15`, color: pc }}>
                          {getTicketPriorityLabel(ticket.priority)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{getTicketCategoryLabel(ticket.category)}</span>
                      <span className="text-[10px] text-slate-500">{formatMessageTime(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {!ticket.assigned_staff ? (
                        <button onClick={() => assignStaff(ticket.id, currentUserId)}
                          className="px-2 py-1 text-[9px] font-semibold rounded bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors cursor-pointer whitespace-nowrap">
                          Assign Me
                        </button>
                      ) : (
                        <div className="relative group">
                          <button className="px-2 py-1 text-[9px] font-medium rounded bg-white/5 text-slate-300 cursor-pointer whitespace-nowrap">
                            {staffProfiles.find(s => s.id === ticket.assigned_staff)?.full_name || 'Staff'}
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-10 min-w-[150px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <button onClick={() => assignStaff(ticket.id, null)}
                              className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Unassign</button>
                            {staffProfiles.map(s => (
                              <button key={s.id} onClick={() => assignStaff(ticket.id, s.id)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer">{s.full_name}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <select value={ticket.status} onChange={e => handleStatusChange(ticket.id, e.target.value)}
                      className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded text-[10px] text-white cursor-pointer focus:outline-none pr-5">
                      <option value="new" className="bg-[#1E293B]">New</option>
                      <option value="open" className="bg-[#1E293B]">Open</option>
                      <option value="assigned" className="bg-[#1E293B]">Assigned</option>
                      <option value="awaiting_team" className="bg-[#1E293B]">Awaiting Team</option>
                      <option value="awaiting_client" className="bg-[#1E293B]">Awaiting Client</option>
                      <option value="in_progress" className="bg-[#1E293B]">In Progress</option>
                      <option value="resolved" className="bg-[#1E293B]">Resolved</option>
                      <option value="closed" className="bg-[#1E293B]">Closed</option>
                      <option value="cancelled" className="bg-[#1E293B]">Cancelled</option>
                    </select>
                    {ticket.description && (
                      <div className="relative group">
                        <button className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-64 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 shadow-xl z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Description</p>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-6">{ticket.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}