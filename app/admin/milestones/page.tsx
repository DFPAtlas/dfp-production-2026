'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { Target, Search, Filter, RefreshCw, Plus, ChevronDown, X, ArrowUpRight, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AdminShell from '../../../components/admin/AdminShell';
import MilestonesStats from './MilestonesStats';
import MilestoneForm from './MilestoneForm';



interface Milestone {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  target_date: string | null;
  order_index: number | null;
  amount: number | null;
  payment_status: string | null;
  paid_at: string | null;
  created_at: string | null;
  project_name?: string | null;
}

interface Project {
  id: string;
  name: string;
}

export default function AdminMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {

    fetchData();
  }, []);

  const fetchData = async () => {
    const [milestonesRes, projectsRes] = await Promise.all([
      supabase.from('milestones').select('*').order('order_index', { ascending: true }),
      supabase.from('projects').select('id, name'),
    ]);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (milestonesRes.data) {
      const enriched = milestonesRes.data.map(m => ({ ...m, project_name: projectsRes.data?.find(p => p.id === m.project_id)?.name || null }));
      setMilestones(enriched); setFilteredMilestones(enriched);
    }
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => {
    let filtered = milestones;
    if (searchQuery) filtered = filtered.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.description?.toLowerCase().includes(searchQuery.toLowerCase())));
    if (statusFilter !== 'all') filtered = filtered.filter(m => m.status === statusFilter);
    if (projectFilter !== 'all') filtered = filtered.filter(m => m.project_id === projectFilter);
    setFilteredMilestones(filtered);
  }, [searchQuery, statusFilter, projectFilter, milestones]);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('milestones').update({ status }).eq('id', id);
    if (!error) setMilestones(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    if (!error) setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = async (data: Partial<Milestone>) => {
    if (editingMilestone) {
      const { error } = await supabase.from('milestones').update(data).eq('id', editingMilestone.id);
      if (!error) { const pn = projects.find(p => p.id === data.project_id)?.name || null; setMilestones(prev => prev.map(m => m.id === editingMilestone.id ? { ...m, ...data, project_name: pn } : m)); }
    } else {
      const { data: newM, error } = await supabase.from('milestones').insert([data]).select().single();
      if (!error && newM) { const pn = projects.find(p => p.id === newM.project_id)?.name || null; setMilestones(prev => [...prev, { ...newM, project_name: pn }]); }
    }
  };

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'blocked': return 'bg-red-50 text-red-500 border-red-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getPaymentStyle = (paymentStatus: string | null, amount: number | null) => {
    if (!amount) return 'text-slate-500';
    switch (paymentStatus) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-white/5 text-slate-300 border-[rgba(255,255,255,0.08)]';
    }
  };

  const stats = {
    total: milestones.length,
    pending: milestones.filter(m => m.status === 'pending' || !m.status).length,
    completed: milestones.filter(m => m.status === 'completed').length,
    totalValue: milestones.reduce((sum, m) => sum + (m.amount || 0), 0),
    paidValue: milestones.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + (m.amount || 0), 0),
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Milestones</h1>
            <p className="text-sm text-slate-400 mt-0.5">Track deliverables and payment triggers</p>
          </div>
          <button
            onClick={() => { setEditingMilestone(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#0066FF]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Milestone
          </button>
        </div>

        <MilestonesStats {...stats} />

        <div className="mt-8 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl  overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { setRefreshing(true); fetchData(); }}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Milestone</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.map((m, i) => (
                  <tr key={m.id} className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-300">
                        {m.order_index || i + 1}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-sm font-semibold text-white">{m.title}</p>
                      {m.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>}
                    </td>
                    <td className="py-4 px-5 text-sm text-slate-300">{m.project_name || 'Unassigned'}</td>
                    <td className="py-4 px-5">
                      <div className="relative group">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(m.status)} cursor-pointer`}>
                          {m.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : m.status === 'blocked' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {(m.status || 'pending').replace('_', ' ')}
                        </span>
                        <div className="absolute left-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          {['pending', 'in_progress', 'completed', 'blocked'].map(s => (
                            <button key={s} onClick={() => handleStatusChange(m.id, s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer capitalize"
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm font-semibold text-white">{m.amount ? `£${m.amount.toLocaleString()}` : '—'}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getPaymentStyle(m.payment_status, m.amount)}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.payment_status === 'paid' ? '#10B981' : m.payment_status === 'pending' ? '#F59E0B' : '#9CA3AF' }} />
                        {m.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {m.target_date ? new Date(m.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingMilestone(m); setShowForm(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMilestones.length === 0 && (
            <div className="text-center py-16">
              <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No milestones found</p>
              <p className="text-sm text-slate-500 mt-1">{searchQuery || statusFilter !== 'all' || projectFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first milestone'}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <MilestoneForm milestone={editingMilestone} projects={projects} onClose={() => { setShowForm(false); setEditingMilestone(null); }} onSave={handleSave} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}