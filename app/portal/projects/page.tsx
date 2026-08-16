'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  FolderKanban, CheckCircle, Clock, Calendar, ChevronRight,
  AlertCircle, PauseCircle, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';



interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  project_lead: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Clock; label: string }> = {
  active: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20', icon: Clock, label: 'Active' },
  completed: { color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20', icon: CheckCircle, label: 'Completed' },
  on_hold: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', icon: PauseCircle, label: 'On Hold' },
  cancelled: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', icon: AlertCircle, label: 'Cancelled' },
  planning: { color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/20', icon: TrendingUp, label: 'Planning' },
};

function getStatus(c: string) {
  return statusConfig[c] || { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock, label: c };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!clientData) { setLoading(false); return; }

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (data) setProjects(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const grouped: Record<string, Project[]> = {};
  if (filter === 'all') {
    for (const p of filtered) {
      const group = p.status === 'active' ? 'Active Projects'
        : p.status === 'completed' ? 'Completed Projects'
        : 'Other Projects';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(p);
    }
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

  return (
    <PortalShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Your Projects</h1>
            <p className="text-slate-400 mt-1">Track progress, milestones, and activity</p>
          </div>
          <div className="flex bg-white/5 rounded-full p-1 border border-[rgba(255,255,255,0.06)]">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  filter === f ? 'bg-[#06B6D4] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'}
              </button>
            ))}
          </div>
        </motion.div>

        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No projects found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {filter !== 'all' ? 'No projects match this filter.' : 'Your projects will appear here once they are set up.'}
            </p>
          </motion.div>
        ) : Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([group, groupProjects]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{group}</h2>
              <div className="space-y-3">
                {groupProjects.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { color, bg, border, icon: SIcon, label } = getStatus(project.status);
  const progress = project.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl group"
    >
      <Link href={`/portal/projects/${project.id}`} className="block p-5 cursor-pointer">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <FolderKanban className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white truncate">{project.name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color} ${bg} ${border} whitespace-nowrap flex-shrink-0`}>
                  <SIcon className="w-3 h-3" />{label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                {project.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Created {new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="w-32 hidden sm:block">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Progress</span>
                <span className="text-xs font-semibold text-slate-300">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                  className={`h-full rounded-full ${progress === 100 ? 'bg-[#10B981]' : 'bg-[#06B6D4]'}`}
                />
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">Budget</p>
              <p className="font-bold text-white">£{Number(project.budget || 0).toLocaleString()}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#06B6D4] transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}