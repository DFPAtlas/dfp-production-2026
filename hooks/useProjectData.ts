'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useProjectData(projectId?: string) {
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [phases, setPhases] = useState<Record<string, unknown>[]>([]);
  const [milestones, setMilestones] = useState<Record<string, unknown>[]>([]);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [risks, setRisks] = useState<Record<string, unknown>[]>([]);
  const [issues, setIssues] = useState<Record<string, unknown>[]>([]);
  const [decisions, setDecisions] = useState<Record<string, unknown>[]>([]);
  const [changes, setChanges] = useState<Record<string, unknown>[]>([]);
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [updates, setUpdates] = useState<Record<string, unknown>[]>([]);
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [activity, setActivity] = useState<Record<string, unknown>[]>([]);
  const [deployments, setDeployments] = useState<Record<string, unknown>[]>([]);
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: p, error: pe } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
      if (pe) throw new Error(pe.message);
      setProject(p);

      if (p?.client_id) {
        const { data: c } = await supabase.from('clients').select('id, company_name, contact_name, email').eq('id', p.client_id).maybeSingle();
        setClient(c || null);
      }

      const [
        { data: ph }, { data: mi }, { data: ta }, { data: ri },
        { data: is }, { data: de }, { data: ch }, { data: fi },
        { data: ms }, { data: up }, { data: me }, { data: ac },
        { data: dp },
      ] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', id).order('order_index'),
        supabase.from('milestones').select('*').eq('project_id', id).order('order_index'),
        supabase.from('project_tasks').select('*').eq('project_id', id).order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('project_risks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_issues').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_decisions').select('*').eq('project_id', id).order('decision_date', { ascending: false, nullsFirst: false }),
        supabase.from('project_changes').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_messages').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_updates').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('project_access').select('*').eq('project_id', id),
        supabase.from('project_activity').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(100),
        supabase.from('digital_footprint_deployments').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      setPhases(ph || []);
      setMilestones(mi || []);
      setTasks(ta || []);
      setRisks(ri || []);
      setIssues(is || []);
      setDecisions(de || []);
      setChanges(ch || []);
      setFiles(fi || []);
      setMessages(ms || []);
      setUpdates(up || []);
      setMembers(me || []);
      setActivity(ac || []);
      setDeployments(dp || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  const refresh = useCallback(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  const updateProject = async (updates: Record<string, unknown>) => {
    if (!projectId) return { error: 'No project ID' };
    const { error } = await supabase.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', projectId);
    if (!error) refresh();
    return { error };
  };

  const insertRecord = async (table: string, record: Record<string, unknown>) => {
    if (!projectId) return { error: 'No project ID' };
    const { error } = await supabase.from(table).insert([{ ...record, project_id: projectId }]);
    if (!error) refresh();
    return { error };
  };

  const updateRecord = async (table: string, id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) refresh();
    return { error };
  };

  const deleteRecord = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) refresh();
    return { error };
  };

  return {
    project, client, phases, milestones, tasks, risks, issues,
    decisions, changes, files, messages, updates, members,
    activity, deployments, loading, error, refresh,
    updateProject, insertRecord, updateRecord, deleteRecord,
  };
}

export function useProjectsOverview() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('projects').select('status, health, uat_state');
      if (error || !data) { setLoading(false); return; }

      const s: Record<string, number> = {
        total: data.length,
        active: data.filter(p => p.status === 'active').length,
        atRisk: data.filter(p => p.health === 'at_risk' || p.health === 'critical' || p.status === 'at_risk').length,
        draft: data.filter(p => p.status === 'draft').length,
        planning: data.filter(p => p.status === 'planning').length,
        ready: data.filter(p => p.status === 'ready' || p.status === 'ready_for_launch').length,
        onHold: data.filter(p => p.status === 'on_hold').length,
        awaitingClient: data.filter(p => p.status === 'awaiting_client').length,
        awaitingUat: data.filter(p => p.status === 'awaiting_uat' || p.uat_state === 'pending').length,
        complete: data.filter(p => p.status === 'complete').length,
        cancelled: data.filter(p => p.status === 'cancelled').length,
        archived: data.filter(p => p.status === 'archived').length,
        healthy: data.filter(p => p.health === 'healthy').length,
        watch: data.filter(p => p.health === 'watch').length,
        critical: data.filter(p => p.health === 'critical').length,
      };
      setStats(s);
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}

