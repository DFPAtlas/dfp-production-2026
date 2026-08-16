'use client';

import { motion } from '@/components/motion';
import Link from 'next/link';
import { getStatusDef, getPriorityDef, getTypeDef } from '@/lib/task-definitions';
import { Calendar, ArrowRight, ExternalLink } from 'lucide-react';

interface TasksTableProps {
  tasks: Record<string, unknown>[];
  onStatusChange?: (id: string, status: string) => void;
  emptyMessage?: string;
}

export default function TasksTable({ tasks, onStatusChange, emptyMessage = 'No tasks found' }: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'complete' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Related</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dep.</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const statusDef = getStatusDef(task.status as string);
              const priorityDef = getPriorityDef(task.priority as string);
              const typeDef = getTypeDef(task.task_type as string);
              const id = task.id as string;
              const ref = (task.task_reference as string) || (id ? id.slice(0, 8) : '');
              const dueDate = task.due_date as string | null;
              const overdue = isOverdue(dueDate, task.status as string);
              const dueToday = isDueToday(dueDate);

              return (
                <tr key={id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: `${typeDef.color}15`, color: typeDef.color }}>
                        {typeDef.label.slice(0, 3)}
                      </span>
                      <div>
                        <Link href={`/admin/tasks/${id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors cursor-pointer">
                          {task.title as string}
                        </Link>
                        {ref && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ref}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {(task.project_id as string) ? 'Project' : (task.client_id as string) ? 'Client' : (task.lead_id as string) ? 'Lead' : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {onStatusChange ? (
                      <div className="relative group inline-block">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer capitalize"
                          style={{ borderColor: `${statusDef.color}30`, color: statusDef.color }}>
                          {statusDef.label}
                        </span>
                        <div className="absolute left-0 top-full mt-1 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                          {['backlog', 'planned', 'ready', 'in_progress', 'blocked', 'awaiting_review', 'complete', 'cancelled'].map(s => (
                            <button key={s} onClick={() => onStatusChange(id, s)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors cursor-pointer capitalize text-slate-300">{s.replace(/_/g, ' ')}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDef.color }} />
                        {statusDef.label}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
                      {priorityDef.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {dueDate ? (
                      <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : dueToday ? 'text-amber-400' : 'text-slate-400'}`}>
                        {new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {overdue && ' ⚠'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {task.blocked_count ? (
                      <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{task.blocked_count as number}</span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/tasks/${id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}