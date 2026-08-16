'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  User,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';



interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  project_lead: string;
  end_date: string | null;
  start_date: string | null;
  budget: number;
}

interface Milestone {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  sort_order: number;
}

export default function CurrentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});

  useEffect(() => {
    async function fetchData() {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData);
        const projectIds = projectsData.map(p => p.id);
        const { data: milestonesData } = await supabase
          .from('milestones')
          .select('*')
          .in('project_id', projectIds)
          .order('sort_order', { ascending: true });

        if (milestonesData) {
          const grouped: Record<string, Milestone[]> = {};
          milestonesData.forEach((m: any) => {
            const pid = String(m.project_id);
            if (!grouped[pid]) grouped[pid] = [];
            grouped[pid].push(m);
          });
          setMilestones(grouped);
        }

        if (projectsData.length > 0) {
          setExpandedProject(String(projectsData[0].id));
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Current Projects</h2>
        <p className="text-sm text-slate-400 mt-1">Live progress and milestone tracking across all active engagements</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 text-slate-500" />
          <p className="text-sm text-slate-400">No projects yet. Your roadmap will populate as projects begin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, i) => {
            const prog = project.progress || 0;
            const projectMilestones = milestones[String(project.id)] || [];
            const isExpanded = expandedProject === String(project.id);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : String(project.id))}
                  className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                      project.status === 'active' ? 'bg-[#06B6D4]/10' :
                      project.status === 'completed' ? 'bg-[#10B981]/10' : 'bg-white/5'
                    }`}>
                      <FolderKanban className={`w-5 h-5 ${
                        project.status === 'active' ? 'text-[#06B6D4]' :
                        project.status === 'completed' ? 'text-[#10B981]' : 'text-slate-400'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{project.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          project.status === 'active' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                          project.status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-slate-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
                        {project.project_lead && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {project.project_lead}
                          </span>
                        )}
                        {project.end_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Target: {new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-xs">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${prog}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full rounded-full ${
                              prog === 100 ? 'bg-[#10B981]' :
                              prog >= 50 ? 'bg-[#06B6D4]' :
                              'bg-[#F59E0B]'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">{prog}% Complete</span>
                      </div>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-4 flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </motion.div>
                </button>

                {isExpanded && projectMilestones.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-3">Milestones</p>
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />
                      <div className="space-y-4">
                        {projectMilestones.map((m) => {
                          const isDone = m.status === 'completed';
                          const isActive = m.status === 'in_progress';
                          return (
                            <div key={m.id} className="relative">
                              <div className={`absolute -left-[17px] top-1.5 w-3 h-3 rounded-full border-2 ${
                                isDone ? 'bg-[#10B981] border-[#10B981]' :
                                isActive ? 'bg-[#06B6D4] border-[#06B6D4]' :
                                'bg-[#1E293B] border-slate-500'
                              }`} />
                              <div>
                                <p className={`text-sm font-medium ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>{m.name}</p>
                                {m.due_date && <p className="text-xs text-slate-500 mt-0.5">Due {new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}