'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { Search, Filter, RefreshCw, Plus, ChevronDown, FolderKanban } from 'lucide-react';
import AdminShell from '../../../components/admin/AdminShell';
import ProjectsOverview from '../../../components/admin/projects/ProjectsOverview';
import ProjectsTable from '../../../components/admin/projects/ProjectsTable';
import ProjectForm from './ProjectForm';

interface Project {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  client_id: string | null;
  status: string | null;
  health: string | null;
  priority: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
  project_lead: string | null;
  project_reference: string | null;
  project_type: string | null;
  current_phase: string | null;
  client_name?: string;
  milestone_count?: number;
  risk_count?: number;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [projectsRes, clientsRes, milestonesRes, risksRes] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('clients').select('id, company_name, contact_name'),
      supabase.from('milestones').select('project_id'),
      supabase.from('project_risks').select('project_id'),
    ]);
    if (projectsRes.data) {
      const enriched = projectsRes.data.map(p => ({
        ...p,
        client_name: clientsRes.data?.find(c => c.id === p.client_id) ?
          (clientsRes.data.find(c => c.id === p.client_id)!.company_name || clientsRes.data.find(c => c.id === p.client_id)!.contact_name) : null,
        milestone_count: milestonesRes.data?.filter(m => m.project_id === p.id).length || 0,
        risk_count: risksRes.data?.filter(r => r.project_id === p.id).length || 0,
      }));
      setProjects(enriched);
      setFilteredProjects(enriched);
    }
    if (clientsRes.data) setClients(clientsRes.data.map(c => ({ id: c.id, name: c.company_name || c.contact_name || c.id })));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let filtered = projects;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.project_reference?.toLowerCase().includes(searchQuery.toLowerCase())) || (p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())));
    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    if (healthFilter !== 'all') filtered = filtered.filter(p => p.health === healthFilter);
    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, healthFilter, projects]);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async (data: Partial<Project>) => {
    if (editingProject) {
      const { error } = await supabase.from('projects').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingProject.id);
      if (!error) fetchData();
    } else {
      const ref = `DFP-PRJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(6, '0')}`;
      const { error } = await supabase.from('projects').insert([{ ...data, project_reference: ref, progress: 0 }]);
      if (!error) fetchData();
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">Project Command — plans, milestones, delivery control</p>
          </div>
          <button
            onClick={() => { setEditingProject(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <ProjectsOverview />

        <div className="mt-8 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, reference, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="planning">Planning</option>
                  <option value="ready">Ready</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="at_risk">At Risk</option>
                  <option value="awaiting_client">Awaiting Client</option>
                  <option value="awaiting_uat">Awaiting UAT</option>
                  <option value="ready_for_launch">Ready for Launch</option>
                  <option value="complete">Complete</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value)}
                  className="px-4 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none"
                >
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy</option>
                  <option value="watch">Watch</option>
                  <option value="at_risk">At Risk</option>
                  <option value="critical">Critical</option>
                  <option value="not_enough_data">Not Enough Data</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { setRefreshing(true); fetchData(); }}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <ProjectsTable
            projects={filteredProjects}
            onEdit={(p) => { setEditingProject(p); setShowForm(true); }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />

          {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No projects found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'all' || healthFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first project to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ProjectForm
            project={editingProject}
            clients={clients}
            onClose={() => { setShowForm(false); setEditingProject(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}