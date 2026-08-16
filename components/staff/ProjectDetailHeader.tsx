'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import {
  ArrowLeft, FolderKanban, Calendar, User, CheckCircle,
  AlertTriangle, Target, ChevronDown, Edit2, Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  status: string;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  project_lead: string | null;
  health: string | null;
  completed_at: string | null;
}

interface ClientInfo {
  id: string;
  company_name: string | null;
  contact_name: string | null;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
}

interface SummaryData {
  progress: number;
  progressLabel: string;
  openTasks: number;
  overdueTasks: number;
  nextMilestone: { title: string; due_date: string | null; isOverdue: boolean } | null;
  leadName: string;
}

const VALID_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

const statusMetaMap: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#3B82F6', bg: 'bg-[#3B82F6]/10' },
  active: { label: 'Active', color: '#10B981', bg: 'bg-[#10B981]/10' },
  on_hold: { label: 'On Hold', color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' },
  completed: { label: 'Completed', color: '#06B6D4', bg: 'bg-[#06B6D4]/10' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'bg-[#EF4444]/10' },
};

function getHealthMeta(health: string | null, status: string): { label: string; color: string; bg: string } {
  if (status === 'completed') return { label: 'Completed', color: '#10B981', bg: 'bg-[#10B981]/10' };
  if (status === 'on_hold') return { label: 'On Hold', color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' };
  if (health === 'at_risk' || health === 'critical') return { label: 'At Risk', color: '#EF4444', bg: 'bg-[#EF4444]/10' };
  if (health === 'healthy' || health === 'on_track') return { label: 'On Track', color: '#10B981', bg: 'bg-[#10B981]/10' };
  if (health === 'needs_attention') return { label: 'Needs Attention', color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
  return { label: 'On Track', color: '#10B981', bg: 'bg-[#10B981]/10' };
}

export default function ProjectDetailHeader({
  project,
  client,
  summary,
  staffList,
  canEditStatus,
  onStatusChange,
  statusSaving,
  canEditProject,
  onEditProject,
}: {
  project: Project;
  client: ClientInfo | null;
  summary: SummaryData;
  staffList: StaffInfo[];
  canEditStatus: boolean;
  onStatusChange: (newStatus: string) => Promise<void>;
  statusSaving: boolean;
  canEditProject: boolean;
  onEditProject: () => void;
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const statusMeta = statusMetaMap[project.status] || { label: project.status, color: '#9CA3AF', bg: 'bg-white/5' };
  const healthMeta = getHealthMeta(project.health, project.status);
  const leadStaff = staffList.find(s => s.id === project.project_lead);

  const handleStatusSelect = async (newStatus: string) => {
    setShowStatusPicker(false);
    if (newStatus !== project.status) {
      await onStatusChange(newStatus);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/staff/projects" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{project.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {client?.company_name || client?.contact_name || 'No client'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${healthMeta.bg}`} style={{ color: healthMeta.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: healthMeta.color }} />
                {healthMeta.label}
              </span>

              {canEditStatus ? (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusPicker(!showStatusPicker)}
                    disabled={statusSaving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${statusMeta.bg}`}
                    style={{ color: statusMeta.color, borderColor: statusMeta.color + '30' }}
                  >
                    {statusSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {statusMeta.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {showStatusPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1 w-44 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        {VALID_STATUSES.map(s => {
                          const sm = statusMetaMap[s] || { label: s, color: '#9CA3AF', bg: 'bg-white/5' };
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusSelect(s)}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer whitespace-nowrap hover:bg-white/5 ${s === project.status ? 'bg-white/5' : ''}`}
                              style={{ color: sm.color }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sm.color }} />
                              {sm.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${statusMeta.bg}`} style={{ color: statusMeta.color, borderColor: statusMeta.color + '30' }}>
                  {statusMeta.label}
                </span>
              )}
            </div>

            {canEditProject && (
              <button
                onClick={onEditProject}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,255,255,0.1)] rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                title="Edit project"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Progress</span>
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#06B6D4]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{summary.progressLabel}</p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, summary.progress))}%`,
                backgroundColor: summary.progress >= 100 ? '#10B981' : summary.progress >= 60 ? '#06B6D4' : summary.progress >= 30 ? '#F59E0B' : 'rgba(255,255,255,0.12)',
              }}
            />
          </div>
        </div>

        <Link href={`/staff/tasks?project=${project.id}`}
          className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 transition-all hover:border-[rgba(255,255,255,0.18)] cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{summary.openTasks}</p>
          {summary.overdueTasks > 0 && (
            <p className="text-xs text-[#EF4444] mt-1 font-medium">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {summary.overdueTasks} overdue
            </p>
          )}
        </Link>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Next Milestone</span>
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#8B5CF6]" />
            </div>
          </div>
          {summary.nextMilestone ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{summary.nextMilestone.title}</p>
              <p className={`text-xs mt-1 ${summary.nextMilestone.isOverdue ? 'text-[#EF4444] font-medium' : 'text-slate-400'}`}>
                {summary.nextMilestone.due_date
                  ? new Date(summary.nextMilestone.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'No date'}
                {summary.nextMilestone.isOverdue && ' — Overdue'}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-500">None</p>
              <p className="text-xs text-slate-500 mt-1">No upcoming milestone</p>
            </>
          )}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Lead</span>
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#10B981]" />
            </div>
          </div>
          <p className="text-lg font-semibold text-white">{summary.leadName}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>
              {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              {' → '}
              {project.end_date ? new Date(project.end_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}