'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import { Edit2, Trash2, FolderKanban, Calendar, ExternalLink } from 'lucide-react';
import { getStatusDef, getHealthDef } from '@/lib/project-definitions';

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

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function ProjectsTable({ projects, onEdit, onDelete, onStatusChange }: ProjectsTableProps) {
  if (projects.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Health</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
            <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
            <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const statusDef = getStatusDef(project.status || 'draft');
            const healthDef = getHealthDef(project.health || 'not_enough_data');
            const progressVal = project.progress || 0;

            return (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4]/10 to-[#8B5CF6]/10 flex items-center justify-center">
                      <FolderKanban className="w-4 h-4 text-[#06B6D4]" />
                    </div>
                    <div>
                      <Link href={`/admin/projects/${project.id}`} className="text-sm font-semibold text-white hover:text-[#06B6D4] transition-colors cursor-pointer">
                        {project.name}
                      </Link>
                      <p className="text-[10px] text-slate-500 font-mono">{project.project_reference || 'No ref'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-slate-300">{project.client_name || 'Unassigned'}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="relative group inline-block">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer"
                      style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color, borderColor: `${statusDef.color}30` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDef.color }} />
                      {statusDef.label}
                    </span>
                    <div className="absolute left-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      {['draft', 'planning', 'ready', 'active', 'on_hold', 'at_risk', 'awaiting_client', 'awaiting_uat', 'ready_for_launch', 'complete', 'cancelled', 'archived'].map(s => (
                        <button
                          key={s}
                          onClick={() => onStatusChange(project.id, s)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors cursor-pointer capitalize"
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: `${healthDef.color}15`, color: healthDef.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthDef.color }} />
                    {healthDef.label}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-slate-400 capitalize">{project.priority || 'medium'}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-slate-400">{project.current_phase ? project.current_phase.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '—'}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] transition-all"
                        style={{ width: `${Math.min(progressVal, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{progressVal}%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/projects/${project.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#06B6D4]/10 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button onClick={() => onEdit(project)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(project.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}