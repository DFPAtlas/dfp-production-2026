'use client';

import { Building2, User, Mail, Phone, Globe, Clock } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  current_phase: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  status: string;
}

interface ClientInfo {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface ActivityItem {
  id: string;
  description: string | null;
  activity_type: string;
  created_at: string;
  actor_name?: string;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
}

export default function ProjectOverviewTab({
  project,
  client,
  recentActivity,
  staffList,
  leadId,
  openTasks,
  overdueTasks,
  milestonesTotal,
  milestonesCompleted,
}: {
  project: Project;
  client: ClientInfo | null;
  recentActivity: ActivityItem[];
  staffList: StaffInfo[];
  leadId: string | null;
  openTasks: number;
  overdueTasks: number;
  milestonesTotal: number;
  milestonesCompleted: number;
}) {
  const leadStaff = leadId ? staffList.find(s => s.id === leadId) : null;

  const formatActivityLabel = (type: string): string => {
    const labels: Record<string, string> = {
      task_completed: 'Task completed',
      task_created: 'Task created',
      milestone_completed: 'Milestone completed',
      milestone_created: 'Milestone created',
      message_sent: 'Message sent',
      project_created: 'Project created',
      project_updated: 'Project updated',
      status_change: 'Status changed',
      file_uploaded: 'File uploaded',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getActivityIcon = (type: string): string => {
    if (type.includes('task')) return 'ri-task-line';
    if (type.includes('milestone')) return 'ri-flag-line';
    if (type.includes('message')) return 'ri-message-2-line';
    if (type.includes('file')) return 'ri-file-line';
    if (type.includes('status')) return 'ri-arrow-left-right-line';
    return 'ri-history-line';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Project Description</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {project.description || project.objective || 'No description provided.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Delivery Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Progress</span>
                <span className="text-sm font-semibold text-white">{project.progress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, project.progress || 0))}%`,
                    backgroundColor: (project.progress || 0) >= 100 ? '#10B981' : (project.progress || 0) >= 60 ? '#06B6D4' : (project.progress || 0) >= 30 ? '#F59E0B' : 'rgba(255,255,255,0.12)',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-xs text-slate-500">Open Tasks</p>
                  <p className="text-lg font-bold text-white">{openTasks}</p>
                  {overdueTasks > 0 && <p className="text-[10px] text-[#EF4444] font-medium">{overdueTasks} overdue</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Milestones</p>
                  <p className="text-lg font-bold text-white">{milestonesCompleted}/{milestonesTotal}</p>
                  <p className="text-[10px] text-slate-400">completed</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Key Dates</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Start Date</span>
                <span className="text-sm text-white font-medium">
                  {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">End Date</span>
                <span className="text-sm text-white font-medium">
                  {project.end_date ? new Date(project.end_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Current Phase</span>
                <span className="text-sm text-[#06B6D4] font-medium capitalize">
                  {project.current_phase || project.status?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                <span className="text-sm text-white font-medium capitalize">
                  {project.status?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {client && (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Client Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Company', value: client.company_name, icon: Building2, href: null },
                { label: 'Contact', value: client.contact_name, icon: User, href: null },
                { label: 'Email', value: client.email, icon: Mail, href: client.email ? `mailto:${client.email}` : null },
                { label: 'Phone', value: client.phone, icon: Phone, href: client.phone ? `tel:${client.phone}` : null },
                { label: 'Website', value: client.website, icon: Globe, href: client.website || null },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                  <div className="flex items-center gap-1.5">
                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {item.href ? (
                      <a href={item.href} target={item.label === 'Website' ? '_blank' : undefined} rel={item.label === 'Website' ? 'noopener noreferrer' : undefined}
                        className="text-sm font-medium text-[#06B6D4] hover:underline truncate"
                      >
                        {item.value || '—'}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-300 truncate">{item.value || '—'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Project Team</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#06B6D4]" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Project Lead</p>
                <p className="text-sm font-semibold text-white">{leadStaff?.full_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((a, i) => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <i className={`${getActivityIcon(a.activity_type)} text-sm text-slate-400`} />
                    </div>
                    {i < Math.min(recentActivity.length, 6) - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className="text-sm text-slate-300">{a.description || formatActivityLabel(a.activity_type)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {a.actor_name && <span className="text-[10px] text-slate-500">{a.actor_name}</span>}
                      <span className="text-[10px] text-slate-500">
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}