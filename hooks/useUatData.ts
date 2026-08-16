'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UatOverviewMetrics {
  activeProjects: number;
  recruitingProjects: number;
  jobsReadyForAssignment: number;
  activeSessions: number;
  feedbackAwaitingTriage: number;
  criticalDefects: number;
  fixesAwaitingRetest: number;
  overdueRetests: number;
  projectsAwaitingApproval: number;
  unavailableEnvironments: number;
  deadlinesApproaching: number;
  loading: boolean;
}

export function useUatOverview(): UatOverviewMetrics {
  const [metrics, setMetrics] = useState<UatOverviewMetrics>({
    activeProjects: 0, recruitingProjects: 0, jobsReadyForAssignment: 0,
    activeSessions: 0, feedbackAwaitingTriage: 0, criticalDefects: 0,
    fixesAwaitingRetest: 0, overdueRetests: 0, projectsAwaitingApproval: 0,
    unavailableEnvironments: 0, deadlinesApproaching: 0, loading: true,
  });

  const fetch = useCallback(async () => {
    const [
      { count: activeProjects },
      { count: recruitingProjects },
      { count: jobsReady },
      { count: activeSessions },
      { count: awaitingTriage },
      { count: criticalDefects },
      { count: fixesRetest },
      { count: overdueRetests },
      { count: awaitingApproval },
      { count: unavailableEnv },
      { count: deadlines },
    ] = await Promise.all([
      supabase.from('uat_projects').select('*', { count: 'exact', head: true }).in('status', ['testing', 'feedback_review', 'fixes_in_progress', 'retesting']),
      supabase.from('uat_projects').select('*', { count: 'exact', head: true }).eq('status', 'recruiting'),
      supabase.from('uat_jobs').select('*', { count: 'exact', head: true }).in('status', ['open', 'recruiting']),
      supabase.from('uat_sessions').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('uat_feedback').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'awaiting_triage']),
      supabase.from('uat_feedback').select('*', { count: 'exact', head: true }).eq('severity', 'critical').not('status', 'in', ['closed', 'resolved', 'rejected']),
      supabase.from('uat_feedback').select('*', { count: 'exact', head: true }).eq('status', 'ready_for_retest'),
      supabase.from('uat_retests').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
      supabase.from('uat_projects').select('*', { count: 'exact', head: true }).eq('status', 'awaiting_approval'),
      supabase.from('uat_environments').select('*', { count: 'exact', head: true }).in('is_active', [false]).not('environment_type', 'eq', 'retired'),
      supabase.from('uat_jobs').select('*', { count: 'exact', head: true }).not('status', 'in', ['completed', 'cancelled', 'archived']).lte('deadline', new Date(Date.now() + 7 * 86400000).toISOString()).gte('deadline', new Date().toISOString()),
    ]);

    setMetrics({
      activeProjects: activeProjects || 0,
      recruitingProjects: recruitingProjects || 0,
      jobsReadyForAssignment: jobsReady || 0,
      activeSessions: activeSessions || 0,
      feedbackAwaitingTriage: awaitingTriage || 0,
      criticalDefects: criticalDefects || 0,
      fixesAwaitingRetest: fixesRetest || 0,
      overdueRetests: overdueRetests || 0,
      projectsAwaitingApproval: awaitingApproval || 0,
      unavailableEnvironments: unavailableEnv || 0,
      deadlinesApproaching: deadlines || 0,
      loading: false,
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return metrics;
}

export function useUatProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('uat_projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { projects, loading, refetch: fetch };
}

export function useUatJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('uat_jobs').select('*, uat_projects:project_id(name)').order('created_at', { ascending: false });
    const merged = (data || []).map((j: any) => ({ ...j, project_name: j.uat_projects?.name || '' }));
    setJobs(merged);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { jobs, loading, refetch: fetch };
}

export function useUatFeedback(filters?: { status?: string; severity?: string; project_id?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('uat_feedback').select('*, uat_projects:project_id(name)').order('created_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.severity) q = q.eq('severity', filters.severity);
    if (filters?.project_id) q = q.eq('project_id', filters.project_id);
    const { data } = await q;
    setItems((data || []).map((f: any) => ({ ...f, project_name: f.uat_projects?.name || '' })));
    setLoading(false);
  }, [filters?.status, filters?.severity, filters?.project_id]);
  useEffect(() => { fetch(); }, [fetch]);
  return { items, loading, refetch: fetch };
}

export function useUatRetests() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('uat_retests').select('*, uat_feedback:feedback_id(title, severity, project_id)').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { items, loading, refetch: fetch };
}

export function useUatEnvironments() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('uat_environments').select('*, uat_projects:project_id(name)').order('created_at', { ascending: false });
    setItems((data || []).map((e: any) => ({ ...e, project_name: e.uat_projects?.name || '' })));
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { items, loading, refetch: fetch };
}