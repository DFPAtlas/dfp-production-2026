'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import Link from 'next/link';
import { getStatusDef, getPriorityDef, KANBAN_COLUMNS, type TaskStatus } from '@/lib/task-definitions';
import { GripVertical, Calendar, AlertTriangle } from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: Record<string, unknown>[];
  onDragEnd: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskKanbanBoard({ tasks, onDragEnd }: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getColumnTasks = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (status: TaskStatus) => {
    setDragOverColumn(null);
    if (draggedTask) {
      onDragEnd(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const totalValue = tasks
    .filter(t => t.estimated_value != null)
    .reduce((sum, t) => sum + (Number(t.estimated_value) || 0), 0);

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
      {KANBAN_COLUMNS.map(column => {
        const columnTasks = getColumnTasks(column);
        const statusDef = getStatusDef(column);
        const columnValue = columnTasks
          .filter(t => t.estimated_value != null)
          .reduce((sum, t) => sum + (Number(t.estimated_value) || 0), 0);

        return (
          <div
            key={column}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => handleDragOver(e, column)}
            onDrop={() => handleDrop(column)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusDef.color }} />
                <span className="text-sm font-semibold text-white">{statusDef.label}</span>
                <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{columnTasks.length}</span>
              </div>
              {columnValue > 0 && (
                <span className="text-[10px] text-slate-400">£{columnValue.toLocaleString()}</span>
              )}
            </div>

            <div
              className={`space-y-2 min-h-[200px] p-1 rounded-xl transition-colors ${
                dragOverColumn === column ? 'bg-[#06B6D4]/5 border border-dashed border-[#06B6D4]/20' : ''
              }`}
            >
              {columnTasks.map(task => {
                const id = task.id as string;
                const priorityDef = getPriorityDef(task.priority as string);
                const overdue = isOverdue(task.due_date as string | null);

                return (
                  <motion.div
                    key={id}
                    layoutId={id}
                    draggable
                    onDragStart={() => handleDragStart(id)}
                    onDragEnd={() => setDraggedTask(null)}
                    className="bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[rgba(255,255,255,0.15)] transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/tasks/${id}`} className="text-sm font-medium text-white hover:text-[#06B6D4] transition-colors line-clamp-2 cursor-pointer">
                          {task.title as string}
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityDef.color}15`, color: priorityDef.color }}>
                            {priorityDef.label}
                          </span>
                          {task.estimated_effort_hours != null && (
                            <span className="text-[10px] text-slate-500">{task.estimated_effort_hours as number}h</span>
                          )}
                        </div>
                        {task.due_date != null && (
                          <div className={`flex items-center gap-1 mt-2 text-[10px] ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                            {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                            <span>{new Date(task.due_date as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}
                        {task.task_reference != null && (
                          <p className="text-[10px] text-slate-600 font-mono mt-1">{task.task_reference as string}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className={`flex items-center justify-center h-24 rounded-xl border border-dashed ${
                  dragOverColumn === column ? 'border-[#06B6D4]/30 bg-[#06B6D4]/5' : 'border-[rgba(255,255,255,0.05)]'
                }`}>
                  <span className="text-xs text-slate-600">Drop here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
