'use client';

import { useRef, useState, useEffect } from 'react';
import { Check, CheckCircle2, Clock3, ListChecks } from 'lucide-react';

interface DemoTask {
  id: string;
  title: string;
  project: string;
  owner: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

interface TasksViewProps {
  tasks: DemoTask[];
  onToggleTask: (id: string) => void;
  onActivity: (message: string) => void;
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'priority', label: 'Priority' },
  { key: 'completed', label: 'Completed' },
];

export default function TasksView({
  tasks,
  onToggleTask,
  onActivity,
}: TasksViewProps) {
  const [filter, setFilter] = useState('all');
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const urgentCount = tasks.filter((t) => t.priority === 'High' && !t.completed).length;

  const visible = tasks.filter((task) =>
    filter === 'all' ||
    (filter === 'priority'
      ? task.priority === 'High' && !task.completed
      : task.completed),
  );

  const handleToggle = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    onToggleTask(id);
    onActivity(`${!task.completed ? 'Completed' : 'Reopened'} task: ${task.title}`);
    if (!task.completed) {
      setJustCompleted(id);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setJustCompleted(null);
      }, 1200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Today&apos;s Work</h2>
          <p className="mt-1 text-sm text-slate-400">
            {tasks.length} actions · {urgentCount} urgent · {completedCount} completed
          </p>
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${filter === f.key ? 'bg-cyan-500 text-slate-950' : 'bg-white/[0.05] text-slate-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0d111c] p-4">
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Operational task queue</h3>
        </div>

        <div className="space-y-2">
          {visible.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition ${task.completed ? 'border-emerald-500/10 bg-emerald-500/[0.03]' : 'border-white/[0.05] bg-white/[0.02]'}`}
            >
              <button
                type="button"
                onClick={() => handleToggle(task.id)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${task.completed ? 'border-emerald-500/30 bg-emerald-500 text-slate-950' : 'border-white/10 bg-white/[0.03] text-transparent hover:border-cyan-500/30'}`}
                aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
              >
                <Check className="h-3.5 w-3.5" />
              </button>

              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {task.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">{task.project} · {task.owner}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${task.priority === 'High' ? 'bg-orange-500/10 text-orange-400' : task.priority === 'Medium' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-white/[0.05] text-slate-500'}`}>
                  {task.priority}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock3 className="h-3 w-3" />
                  {task.due}
                </span>
              </div>

              {justCompleted === task.id && (
                <div className="animate-pulse">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}