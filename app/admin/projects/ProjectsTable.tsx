'use client';

import { motion } from '@/components/motion';
import { Edit2, Trash2, CheckCircle, Clock, AlertCircle, Target, PoundSterling } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  status: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  client_name?: string;
  milestone_count?: number;
  total_paid?: number;
}

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function ProjectsTable({ projects, onEdit, onDelete, onStatusChange }: ProjectsTableProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00FF41]/20 text-[#00FF41] text-xs font-mono rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#007AFF]/20 text-[#007AFF] text-xs font-mono rounded-full">
            <Clock className="w-3 h-3" />
            Active
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FF9500]/20 text-[#FF9500] text-xs font-mono rounded-full">
            <AlertCircle className="w-3 h-3" />
            On Hold
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-mono rounded-full">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-mono rounded-full">
            <Clock className="w-3 h-3" />
            Planning
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Project Name</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Client</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Budget</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Paid</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Milestones</th>
            <th className="text-left py-3 px-4 text-sm font-mono text-gray-400">Timeline</th>
            <th className="text-right py-3 px-4 text-sm font-mono text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const paymentProgress = project.budget && project.budget > 0
              ? Math.round(((project.total_paid || 0) / project.budget) * 100)
              : 0;

            return (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="font-mono font-medium">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-400 font-mono">
                    {project.client_name || 'Unassigned'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="relative group">
                    <button className="cursor-pointer">
                      {getStatusBadge(project.status)}
                    </button>
                    <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                      {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => onStatusChange(project.id, status)}
                          className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-white/10 transition-colors cursor-pointer capitalize"
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="font-mono text-[#007AFF]">
                    {project.budget ? `£${project.budget.toLocaleString()}` : '—'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <span className="font-mono text-[#00FF41]">
                      £{(project.total_paid || 0).toLocaleString()}
                    </span>
                    {project.budget && project.budget > 0 && (
                      <div className="mt-1 w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00FF41] rounded-full transition-all"
                          style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400 font-mono">
                      {project.milestone_count || 0}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-400 font-mono">
                    {project.start_date && (
                      <div>
                        {new Date(project.start_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    )}
                    {project.end_date && (
                      <div className="text-xs text-gray-500">
                        to {new Date(project.end_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    )}
                    {!project.start_date && !project.end_date && '—'}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(project)}
                      className="p-2 hover:bg-[#007AFF]/20 rounded-lg transition-colors cursor-pointer"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4 text-[#007AFF]" />
                    </button>
                    <button
                      onClick={() => onDelete(project.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
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
