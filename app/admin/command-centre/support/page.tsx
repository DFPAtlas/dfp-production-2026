'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import CommandShell from '@/components/admin/CommandShell';
import { LifeBuoy, Clock, AlertTriangle, MessageSquare, RefreshCw, Plus, X, Search, ChevronDown } from 'lucide-react';



export default function CommandSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', ticket_title: '', ticket_description: '', status: 'open', priority: 'medium', submitted_by: '', submitted_email: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [ticketsRes, projectsRes] = await Promise.all([
      supabase.from('digital_footprint_support').select('*, digital_footprint_projects!inner(name)').order('created_at', { ascending: false }),
      supabase.from('digital_footprint_projects').select('id, name').neq('status', 'archived')
    ]);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    setLoading(false);
  };

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.ticket_title.toLowerCase().includes(q) || (t.ticket_description && t.ticket_description.toLowerCase().includes(q));
    }
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('digital_footprint_support').insert([{ ...formData, ticket_description: formData.ticket_description || null }]);
    setSaving(false); setShowForm(false); fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const update: any = { status: newStatus };
    if (newStatus === 'resolved' || newStatus === 'closed') update.resolved_at = new Date().toISOString();
    await supabase.from('digital_footprint_support').update(update).eq('id', id);
    fetchData();
  };

  const getPriorityColor = (p: string) => {
    switch (p) { case 'urgent': return '#EF4444'; case 'high': return '#F97316'; case 'medium': return '#F59E0B'; case 'low': return '#10B981'; default: return '#64748B'; }
  };

  if (loading) {
    return <CommandShell><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div></CommandShell>;
  }

  return (
    <CommandShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Support</h1>
            <p className="text-sm text-slate-400">Ticket management across all projects</p>
          </div>
          <button onClick={() => { setFormData({ project_id: projects[0]?.id || '', ticket_title: '', ticket_description: '', status: 'open', priority: 'medium', submitted_by: '', submitted_email: '' }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />New Ticket
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card rounded-2xl p-4"><div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Open Tickets</div><div className="text-2xl font-bold text-white">{openCount}</div></div>
          <div className="glass-card rounded-2xl p-4"><div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Urgent</div><div className="text-2xl font-bold text-red-400">{urgentCount}</div></div>
          <div className="glass-card rounded-2xl p-4"><div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Total</div><div className="text-2xl font-bold text-white">{tickets.length}</div></div>
          <div className="glass-card rounded-2xl p-4"><div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Resolved</div><div className="text-2xl font-bold text-green-400">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</div></div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden mb-4">
          <div className="p-3 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
            </div>
            <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
              <option value="all">All Status</option>
              <option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting">Waiting</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <LifeBuoy className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Tickets</h3>
            <p className="text-sm text-slate-400">{tickets.length === 0 ? 'Create your first support ticket' : 'No tickets match your filter'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket, i) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: getPriorityColor(ticket.priority) + '20', color: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                    <span className="text-[10px] text-slate-500">{ticket.digital_footprint_projects?.name || 'Unassigned'}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{ticket.ticket_title}</p>
                  {ticket.ticket_description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ticket.ticket_description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>{ticket.submitted_by || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className="px-2 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-white cursor-pointer">
                    <option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting">Waiting</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">New Ticket</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                  <select value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" value={formData.ticket_title} onChange={(e) => setFormData({ ...formData, ticket_title: e.target.value })} required
                    placeholder="Describe the issue..."
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={formData.ticket_description} onChange={(e) => setFormData({ ...formData, ticket_description: e.target.value })}
                    placeholder="Details..." rows={3} maxLength={500}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white cursor-pointer">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Submitted By</label>
                    <input type="text" value={formData.submitted_by} onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Submitter Email</label>
                  <input type="email" value={formData.submitted_email} onChange={(e) => setFormData({ ...formData, submitted_email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50">{saving ? 'Saving...' : 'Create Ticket'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </CommandShell>
  );
}
