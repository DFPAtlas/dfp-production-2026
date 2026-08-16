'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { motion } from '@/components/motion';
import { formatMessageTime, getTicketStatusLabel, getTicketCategoryLabel, getTicketPriorityLabel, getTicketStatusColor, getPriorityColor } from '@/lib/message-definitions';
import { Headphones, Search, UserCheck, Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, Filter, ArrowRight, Loader2, User, MessageSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { sendNotificationEmail, buildTicketEmailHtml } from '@/lib/email-notifications';

interface Ticket {
  id: string;
  ticket_reference: string;
  client_id: string;
  project_id: string | null;
  thread_id: string | null;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_staff: string | null;
  created_by: string;
  first_response_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
}

interface ClientInfo {
  id: string;
  company_name?: string;
  contact_name?: string;
}

type FilterKey = 'all' | 'assigned_me' | 'unassigned' | 'awaiting_staff' | 'awaiting_client' | 'urgent' | 'resolved' | 'overdue';

const FILTERS: { key: FilterKey; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'All', icon: Filter, color: '#94A3B8' },
  { key: 'assigned_me', label: 'My Tickets', icon: UserCheck, color: '#22D3EE' },
  { key: 'unassigned', label: 'Unassigned', icon: User, color: '#F59E0B' },
  { key: 'awaiting_staff', label: 'Awaiting Staff', icon: Clock, color: '#8B5CF6' },
  { key: 'awaiting_client', label: 'Awaiting Client', icon: MessageSquare, color: '#3B82F6' },
  { key: 'urgent', label: 'Urgent', icon: AlertCircle, color: '#EF4444' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle, color: '#4ADE80' },
  { key: 'overdue', label: 'Overdue', icon: XCircle, color: '#F97316' },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [clients, setClients] = useState<Record<string, ClientInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchTickets = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setCurrentUserId(session.user.id);

    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    setTickets(data || []);

    if (data?.length) {
      const clientIds = [...new Set(data.map(t => t.client_id).filter(Boolean))];
      const staffIds = [...new Set(data.map(t => t.assigned_staff).filter(Boolean))];

      if (clientIds.length) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, company_name, contact_name')
          .in('id', clientIds as string[]);
        if (clientData) {
          const map: Record<string, ClientInfo> = {};
          for (const c of clientData) map[c.id] = c;
          setClients(map);
        }
      }

      if (staffIds.length) {
        const { data: staffData } = await supabase
          .from('staff_profiles')
          .select('id, full_name, role')
          .in('id', staffIds as string[]);
        if (staffData) setStaffProfiles(staffData);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel(`admin-support:${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
      }, () => {
        fetchTickets();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  async function assignSelf(ticketId: string) {
    const ticket = tickets.find(t => t.id === ticketId);
    await supabase.from('support_tickets').update({
      assigned_staff: currentUserId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    }).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assigned_staff: currentUserId, status: 'assigned' } : t));

    if (ticket) {
      sendNotificationEmail({
        event_type: 'ticket_assigned',
        related_entity_id: ticketId,
        subject: `Ticket ${ticket.ticket_reference} assigned`,
        html: buildTicketEmailHtml('assigned', ticket.ticket_reference, ticket.subject, 'a team member', `${window.location.origin}/portal/support/${ticketId}`),
      }).catch(() => {});
    }
  }

  async function assignStaff(ticketId: string, staffId: string | null) {
    const ticket = tickets.find(t => t.id === ticketId);
    const staffName = staffProfiles.find(s => s.id === staffId)?.full_name || 'a team member';
    await supabase.from('support_tickets').update({
      assigned_staff: staffId,
      status: staffId ? 'assigned' : 'new',
      updated_at: new Date().toISOString(),
    }).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assigned_staff: staffId, status: staffId ? 'assigned' : 'new' } : t));

    if (staffId && ticket) {
      sendNotificationEmail({
        event_type: 'ticket_assigned',
        related_entity_id: ticketId,
        subject: `Ticket ${ticket.ticket_reference} assigned`,
        html: buildTicketEmailHtml('assigned', ticket.ticket_reference, ticket.subject, staffName, `${window.location.origin}/portal/support/${ticketId}`),
      }).catch(() => {});
    }
  }

  async function changeStatus(ticketId: string, newStatus: string) {
    const ticket = tickets.find(t => t.id === ticketId);
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
    if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
    if (newStatus === 'in_progress' && !ticket?.first_response_at) {
      updates.first_response_at = new Date().toISOString();
    }
    await supabase.from('support_tickets').update(updates).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));

    if (ticket && (newStatus === 'awaiting_client' || newStatus === 'resolved' || newStatus === 'closed')) {
      const action: 'status_changed' | 'awaiting_client' = 
        newStatus === 'awaiting_client' ? 'awaiting_client' : 'status_changed';
      sendNotificationEmail({
        event_type: `ticket_${action}`,
        related_entity_id: ticketId,
        subject: `Ticket ${ticket.ticket_reference} updated`,
        html: buildTicketEmailHtml(action, ticket.ticket_reference, ticket.subject, getTicketStatusLabel(newStatus), `${window.location.origin}/portal/support/${ticketId}`),
      }).catch(() => {});
    }
  }

  function getClientName(clientId: string) {
    const c = clients[clientId];
    if (!c) return 'Unknown';
    return c.company_name || c.contact_name || 'Unknown';
  }

  const isOverdue = (ticket: Ticket) => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    const created = new Date(ticket.created_at);
    const now = new Date();
    const hours = (now.getTime() - created.getTime()) / 3600000;
    if (ticket.priority === 'urgent') return hours > 4;
    if (ticket.priority === 'high') return hours > 24;
    return hours > 72;
  };

  const stats = {
    all: tickets.length,
    unassigned: tickets.filter(t => !t.assigned_staff && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
    awaiting_staff: tickets.filter(t => t.status === 'awaiting_team' || t.status === 'new' || t.status === 'open').length,
    awaiting_client: tickets.filter(t => t.status === 'awaiting_client').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    overdue: tickets.filter(t => isOverdue(t)).length,
  };

  const filteredTickets = tickets.filter(t => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!t.subject.toLowerCase().includes(s) && !t.ticket_reference.toLowerCase().includes(s)) return false;
    }
    switch (filter) {
      case 'assigned_me': return t.assigned_staff === currentUserId && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled';
      case 'unassigned': return !t.assigned_staff && t.status !== 'resolved' && t.status !== 'closed' && t.status !== 'cancelled';
      case 'awaiting_staff': return t.status === 'awaiting_team' || t.status === 'new' || t.status === 'open';
      case 'awaiting_client': return t.status === 'awaiting_client';
      case 'urgent': return t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed';
      case 'resolved': return t.status === 'resolved' || t.status === 'closed';
      case 'overdue': return isOverdue(t);
      default: return true;
    }
  });

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Queue</h1>
            <p className="text-sm text-slate-400 mt-1">
              {stats.unassigned} unassigned · {stats.urgent} urgent · {stats.overdue} overdue
            </p>
          </div>
          <button onClick={fetchTickets}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white transition-all cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
          {FILTERS.map(f => {
            const Icon = f.icon;
            const count = f.key === 'all' ? stats.all
              : f.key === 'assigned_me' ? tickets.filter(t => t.assigned_staff === currentUserId && t.status !== 'resolved' && t.status !== 'closed').length
              : f.key === 'unassigned' ? stats.unassigned
              : f.key === 'awaiting_staff' ? stats.awaiting_staff
              : f.key === 'awaiting_client' ? stats.awaiting_client
              : f.key === 'urgent' ? stats.urgent
              : f.key === 'resolved' ? stats.resolved
              : stats.overdue;
            const isActive = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all cursor-pointer ${
                  isActive ? 'bg-white/10 border border-white/20' : 'bg-[#1E293B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                }`}>
                <Icon className="w-4 h-4" style={{ color: isActive ? f.color : '#94A3B8' }} />
                <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">{f.label}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#8B5CF6]/30 transition-all" />
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-12 text-center">
            <Headphones className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No tickets found</h3>
            <p className="text-sm text-slate-400">{searchTerm ? 'Try a different search' : 'No tickets match this filter'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTickets.map(ticket => {
              const sc = getTicketStatusColor(ticket.status);
              const pc = getPriorityColor(ticket.priority);
              const assignedStaff = ticket.assigned_staff ? staffProfiles.find(s => s.id === ticket.assigned_staff) : null;
              const overdue = isOverdue(ticket);

              return (
                <div key={ticket.id}
                  className={`bg-[#1E293B] border rounded-xl p-4 transition-colors ${
                    overdue ? 'border-orange-500/20 bg-orange-500/[0.03]' : ticket.priority === 'urgent' ? 'border-red-500/15 bg-red-500/[0.02]' : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]'
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500">{ticket.ticket_reference}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${sc}15`, color: sc }}>
                          {getTicketStatusLabel(ticket.status)}
                        </span>
                        {ticket.priority === 'urgent' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${pc}15`, color: pc }}>
                            Urgent
                          </span>
                        )}
                        {overdue && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-orange-500/10 text-orange-400">Overdue</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-400">{getTicketCategoryLabel(ticket.category)}</span>
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="text-[10px] text-slate-500">{getClientName(ticket.client_id)}</span>
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="text-[10px] text-slate-500">{formatMessageTime(ticket.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {!ticket.assigned_staff ? (
                          <button onClick={() => assignSelf(ticket.id)}
                            className="px-2 py-1 text-[9px] font-semibold rounded bg-[#22D3EE]/10 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-colors cursor-pointer whitespace-nowrap">
                            Assign Me
                          </button>
                        ) : (
                          <div className="relative group">
                            <button className="px-2 py-1 text-[9px] font-medium rounded bg-white/5 text-slate-300 cursor-pointer whitespace-nowrap">
                              {assignedStaff?.full_name || 'Staff'}
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              <button onClick={() => assignStaff(ticket.id, null)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Unassign</button>
                              {staffProfiles.map(s => (
                                <button key={s.id} onClick={() => assignStaff(ticket.id, s.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer">
                                  {s.full_name} · {s.role}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <select value={ticket.status} onChange={e => changeStatus(ticket.id, e.target.value)}
                        className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded text-[10px] text-white cursor-pointer focus:outline-none pr-5">
                        <option value="new" className="bg-[#1E293B]">New</option>
                        <option value="open" className="bg-[#1E293B]">Open</option>
                        <option value="assigned" className="bg-[#1E293B]">Assigned</option>
                        <option value="awaiting_team" className="bg-[#1E293B]">Awaiting Team</option>
                        <option value="awaiting_client" className="bg-[#1E293B]">Awaiting Client</option>
                        <option value="in_progress" className="bg-[#1E293B]">In Progress</option>
                        <option value="resolved" className="bg-[#1E293B]">Resolved</option>
                        <option value="closed" className="bg-[#1E293B]">Closed</option>
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
    </AdminShell>
  );
}