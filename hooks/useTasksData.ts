'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTasksData(taskId?: string) {
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [checklistItems, setChecklistItems] = useState<Record<string, unknown>[]>([]);
  const [dependencies, setDependencies] = useState<Record<string, unknown>[]>([]);
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [timeEntries, setTimeEntries] = useState<Record<string, unknown>[]>([]);
  const [watchers, setWatchers] = useState<Record<string, unknown>[]>([]);
  const [assignees, setAssignees] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: t, error: te } = await supabase.from('project_tasks').select('*').eq('id', id).maybeSingle();
      if (te) throw new Error(te.message);
      setTask(t);

      const [
        { data: ch }, { data: dp }, { data: cm },
        { data: ti }, { data: wt }, { data: as },
      ] = await Promise.all([
        supabase.from('task_checklist_items').select('*').eq('task_id', id).order('order_index'),
        supabase.from('task_dependencies').select('*').eq('task_id', id),
        supabase.from('task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
        supabase.from('task_time_entries').select('*').eq('task_id', id).order('entry_date', { ascending: false }),
        supabase.from('task_watchers').select('*').eq('task_id', id),
        supabase.from('task_assignees').select('*').eq('task_id', id),
      ]);

      setChecklistItems(ch || []);
      setDependencies(dp || []);
      setComments(cm || []);
      setTimeEntries(ti || []);
      setWatchers(wt || []);
      setAssignees(as || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.from('project_tasks')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (e) throw new Error(e.message);
      setTasks(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (taskId) fetchTaskDetail(taskId);
    else fetchAllTasks();
  }, [taskId, fetchTaskDetail, fetchAllTasks]);

  const refresh = useCallback(() => {
    if (taskId) fetchTaskDetail(taskId);
    else fetchAllTasks();
  }, [taskId, fetchTaskDetail, fetchAllTasks]);

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from('project_tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) refresh();
    return { error };
  };

  const insertTask = async (record: Record<string, unknown>) => {
    const { error } = await supabase.from('project_tasks').insert([record]);
    if (!error) refresh();
    return { error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('project_tasks').delete().eq('id', id);
    if (!error) refresh();
    return { error };
  };

  const insertRecord = async (table: string, record: Record<string, unknown>) => {
    const { error } = await supabase.from(table).insert([record]);
    if (!error) refresh();
    return { error };
  };

  const updateRecord = async (table: string, id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from(table).update(updates).eq('id', id);
    if (!error) refresh();
    return { error };
  };

  const deleteRecord = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) refresh();
    return { error };
  };

  return {
    task, tasks, checklistItems, dependencies, comments, timeEntries,
    watchers, assignees, loading, error, refresh,
    updateTask, insertTask, deleteTask, insertRecord, updateRecord, deleteRecord,
  };
}

export function useTasksOverview() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('status, priority, due_date, owner_id, assigned_to, review_status, completed_at');
      if (error || !data) { setLoading(false); return; }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const active = data.filter(t => t.status !== 'archived' && t.status !== 'cancelled' && t.status !== 'complete');
      const s: Record<string, number> = {
        total: data.length,
        open: active.length,
        myOpen: 0,
        dueToday: active.filter(t => {
          if (!t.due_date) return false;
          const d = new Date(t.due_date);
          return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        }).length,
        overdue: active.filter(t => t.due_date && new Date(t.due_date) < today).length,
        blocked: data.filter(t => t.status === 'blocked').length,
        unassigned: active.filter(t => !t.owner_id && !t.assigned_to).length,
        highPriority: active.filter(t => t.priority === 'urgent' || t.priority === 'critical').length,
        awaitingReview: data.filter(t => t.status === 'awaiting_review' || t.review_status === 'awaiting_review').length,
        recentlyCompleted: data.filter(t => {
          if (t.status !== 'complete' || !t.completed_at) return false;
          const completedTime = new Date(t.completed_at).getTime();
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return completedTime > weekAgo;
        }).length,
      };
      setStats(s);
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}

