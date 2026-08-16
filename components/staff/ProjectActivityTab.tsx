'use client';

import { Activity, AlertCircle, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  description: string | null;
  activity_type: string;
  created_at: string;
  actor_id: string | null;
  actor_name?: string;
}

export default function ProjectActivityTab({
  activities,
  loading,
  error,
  onRetry,
}: {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const formatActivityLabel = (type: string): string => {
    const labels: Record<string, string> = {
      task_completed: 'Task completed',
      task_created: 'Task created',
      task_updated: 'Task updated',
      milestone_completed: 'Milestone completed',
      milestone_created: 'Milestone created',
      message_sent: 'Message sent',
      project_created: 'Project created',
      project_updated: 'Project updated',
      status_change: 'Status changed',
      file_uploaded: 'File uploaded',
      file_deleted: 'File deleted',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getActivityIcon = (type: string): string => {
    if (type.includes('task')) return 'ri-task-line';
    if (type.includes('milestone')) return 'ri-flag-line';
    if (type.includes('message')) return 'ri-message-2-line';
    if (type.includes('file')) return 'ri-file-line';
    if (type.includes('status')) return 'ri-arrow-left-right-line';
    if (type.includes('project')) return 'ri-folder-line';
    return 'ri-history-line';
  };

  const getActivityColor = (type: string): string => {
    if (type.includes('completed')) return '#10B981';
    if (type.includes('created') || type.includes('uploaded')) return '#06B6D4';
    if (type.includes('updated') || type.includes('change')) return '#F59E0B';
    if (type.includes('deleted')) return '#EF4444';
    if (type.includes('message')) return '#8B5CF6';
    return '#9CA3AF';
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/5 shrink-0" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load activity</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-medium mb-1">No activity recorded</p>
          <p className="text-sm text-slate-500">Project activity will appear here as work progresses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
      <div className="space-y-0">
        {activities.map((a, i) => {
          const color = getActivityColor(a.activity_type);
          return (
            <div key={a.id} className="flex gap-3 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                <i className={`${getActivityIcon(a.activity_type)} text-sm`} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-300">
                  {a.description || formatActivityLabel(a.activity_type)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400">
                    {formatActivityLabel(a.activity_type)}
                  </span>
                  {a.actor_name && (
                    <span className="text-[10px] text-slate-500">{a.actor_name}</span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}