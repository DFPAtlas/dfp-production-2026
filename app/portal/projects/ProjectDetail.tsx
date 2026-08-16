'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  Calendar,
  ChevronRight,
  AlertCircle,
  PauseCircle,
  TrendingUp,
  User,
  Flag,
  Activity,
  ArrowLeft,
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

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

interface ActivityItem {
  id: string;
  description: string;
  activity_type: string;
  created_at: string;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Clock; label: string }> = {
  active: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Clock, label: 'Active' },
  completed: { color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]/20', icon: CheckCircle, label: 'Completed' },
  on_hold: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: PauseCircle, label: 'On Hold' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, label: 'Cancelled' },
  planning: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', icon: TrendingUp, label: 'Planning' },
};

function getStatus(c: string) {
  return statusConfig[c] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock, label: c || 'Unknown' };
}

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'activity'>('overview');

  useEffect(() => {
    async function fetchData() {
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (proj) setProject(proj);

      const [{ data: m }, { data: a }] = await Promise.all([
        supabase.from('milestones').select('*').eq('project_id', projectId).order('sort_order'),
        supabase.from('project_activity').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      ]);

      if (m) setMilestones(m);
      if (a) setActivities(a);
      setLoading(false);
    }
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (!project) {
    return (
      <PortalShell>
        <div className="max-w-5xl mx-auto text-center py-20">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project not found</h2>
          <p className="text-slate-500 mb-6">This project may have been removed or you do not have access.</p>
          <Link href="/portal/projects" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#2563EB]/90 transition-colors cursor-pointer whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </PortalShell>
    );
  }

  const { color, bg, border, icon: SIcon, label } = getStatus(project.status);
  const progress = project.progress || 0;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;

  return (
    <PortalShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/portal/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to all projects
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <FolderKanban className={`w-7 h-7 ${color}`} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 truncate">{project.name}</h1>
                  {project.description && (
                    <p className="text-slate-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${color} ${bg} ${border} w-fit whitespace-nowrap flex-shrink-0`}>
                <SIcon className="w-4 h-4" />
                {label}
              </span>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Budget</p>
                <p className="text-xl font-bold text-slate-900">£{Number(project.budget || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Start Date</p>
                <p className="text-xl font-bold text-slate-900">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Expected Completion</p>
                <p className="text-xl font-bold text-slate-900">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Project Lead</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2563EB]/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{project.project_lead || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                <span className="text-sm font-bold text-slate-900">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#2563EB] to-[#00F0FF]'}`}
                />
              </div>
            </div>

            <div className="flex border-b border-slate-100 mb-6">
              {(['overview', 'milestones', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                    activeTab === tab ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'milestones' ? `Milestones (${completedMilestones}/${totalMilestones})` : 'Activity'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Project Timeline</h3>
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 bg-[#2563EB] rounded-full border-2 border-white" />
                      <p className="text-sm font-medium text-slate-900">Project Started</p>
                      <p className="text-xs text-slate-400">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      <p className="text-sm font-medium text-slate-900">In Progress</p>
                      <p className="text-xs text-slate-400">{progress}% complete — {totalMilestones > 0 ? `${completedMilestones} of ${totalMilestones} milestones done` : 'No milestones set'}</p>
                    </div>
                    {project.end_date && (
                      <div className="relative">
                        <div className="absolute -left-[29px] w-4 h-4 bg-slate-300 rounded-full border-2 border-white" />
                        <p className="text-sm font-medium text-slate-900">Target Completion</p>
                        <p className="text-xs text-slate-400">{new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                </div>

                {project.description && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Project Overview</h3>
                    <div className="bg-slate-50 rounded-xl p-5">
                      <p className="text-slate-600 leading-relaxed">{project.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Project Lead</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{project.project_lead || 'Unassigned'}</p>
                    <p className="text-xs text-slate-400 mt-1">Your main point of contact for this project</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Timeline</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {project.start_date && project.end_date
                        ? `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'Not set'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Estimated project duration</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div>
                {milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((m, i) => {
                      const isCompleted = m.status === 'completed';
                      const isInProgress = m.status === 'in_progress';
                      return (
                        <div key={m.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-[#2563EB]' : 'bg-slate-200'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : isInProgress ? (
                                <Clock className="w-5 h-5 text-white" />
                              ) : (
                                <Flag className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            {i < milestones.length - 1 && (
                              <div className={`w-0.5 flex-1 mt-1 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                          </div>
                          <div className={`flex-1 pb-6 ${i === milestones.length - 1 ? 'pb-0' : ''}`}>
                            <div className={`p-4 rounded-xl border ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : isInProgress ? 'bg-[#2563EB]/5 border-[#2563EB]/10' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-semibold text-sm ${isCompleted ? 'text-emerald-800' : isInProgress ? 'text-[#2563EB]' : 'text-slate-700'}`}>
                                  {m.name}
                                </h4>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  isCompleted ? 'bg-emerald-100 text-emerald-700' : isInProgress ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {m.status === 'completed' ? 'Done' : m.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                </span>
                              </div>
                              {m.description && (
                                <p className="text-sm text-slate-500 mt-1">{m.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                {m.due_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Due {new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                                {m.completed_at && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed {new Date(m.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No milestones set for this project yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((a, i) => (
                      <div key={a.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {a.activity_type === 'milestone' ? (
                              <Flag className="w-4 h-4 text-[#2563EB]" />
                            ) : a.activity_type === 'comment' ? (
                              <Activity className="w-4 h-4 text-violet-500" />
                            ) : (
                              <Activity className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          {i < activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
                        </div>
                        <div className={`flex-1 ${i === activities.length - 1 ? '' : 'pb-6'}`}>
                          <p className="text-sm text-slate-700">{a.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                            {new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No activity recorded yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PortalShell>
  );
}