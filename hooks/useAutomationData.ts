import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WorkflowRecord {
  id: string;
  project_id: string | null;
  workflow_name: string;
  status: string;
  n8n_workflow_id: string | null;
  description: string | null;
  workflow_type: string;
  environment: string;
  editorial_status: string;
  health_status: string;
  criticality: string;
  version: number;
  timeout_seconds: number;
  human_approval_required: boolean;
  data_classification: string;
  runbook: string | null;
  trigger_type: string;
  total_executions: number;
  total_successes: number;
  total_failures: number;
  avg_duration_ms: number | null;
  tags: string[] | null;
  owner_id: string | null;
  client_id: string | null;
  service_id: string | null;
  last_run_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  latest_error: string | null;
  health_score: number | null;
  leads_generated: number | null;
  webhook_url: string | null;
  open_alert_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  digital_footprint_projects?: { name: string } | null;
}

export interface ExecutionRecord {
  id: string;
  workflow_id: string;
  provider_execution_id: string | null;
  environment: string;
  status: string;
  trigger_type: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  retry_number: number;
  parent_execution_id: string | null;
  correlation_id: string | null;
  error_category: string | null;
  error_summary: string | null;
  failed_node: string | null;
  token_count_input: number | null;
  token_count_output: number | null;
  cost_amount: number | null;
  cost_currency: string;
  cost_estimated: boolean;
  workflow?: { workflow_name: string; environment: string; criticality: string } | null;
  created_at: string;
}

export interface WebhookRecord {
  id: string;
  workflow_id: string;
  purpose: string | null;
  http_method: string;
  classification: string;
  auth_type: string;
  active: boolean;
  masked_path: string | null;
  last_request_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_count: number;
  environment: string;
  workflow?: { workflow_name: string } | null;
}

export interface ScheduleRecord {
  id: string;
  workflow_id: string;
  recurrence_rule: string;
  timezone: string;
  active: boolean;
  environment: string;
  next_expected_run: string | null;
  last_expected_run: string | null;
  last_actual_run: string | null;
  grace_period_minutes: number;
  missed_state: string;
  workflow?: { workflow_name: string } | null;
}

export interface AgentRecord {
  id: string;
  reference: string | null;
  name: string;
  purpose: string | null;
  status: string;
  environment: string;
  project_id: string | null;
  client_id: string | null;
  owner_id: string | null;
  provider: string | null;
  model_id: string | null;
  tool_permissions: any;
  data_scope: string;
  human_approval_required: boolean;
  total_runs: number;
  total_successes: number;
  total_failures: number;
  total_tokens: number;
  confirmed_cost: number;
  cost_currency: string;
  last_run_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  latest_error: string | null;
  service_id: string | null;
  created_at: string;
}

export interface ModelRecord {
  id: string;
  provider: string;
  model_identifier: string;
  display_name: string;
  connection_status: string;
  context_limit: number | null;
  pricing_per_1k_input: number | null;
  pricing_per_1k_output: number | null;
  pricing_currency: string;
  pricing_confirmed: boolean;
  approved_use: string;
  last_verified_at: string | null;
}

export interface ApprovalRecord {
  id: string;
  approval_type: string;
  workflow_id: string | null;
  agent_id: string | null;
  execution_id: string | null;
  title: string;
  description: string | null;
  requester_id: string | null;
  approver_id: string | null;
  status: string;
  decision_reason: string | null;
  expires_at: string | null;
  decided_at: string | null;
  created_at: string;
  workflow?: { workflow_name: string } | null;
  agent?: { name: string } | null;
}

export interface AutomationOverview {
  totalWorkflows: number;
  activeWorkflows: number;
  failingWorkflows: number;
  totalExecutions: number;
  successRate: number | null;
  avgDurationMs: number | null;
  webhookFailures: number;
  missedSchedules: number;
  activeAgents: number;
  failingAgents: number;
  totalTokens: number;
  confirmedCost: number;
  pendingApprovals: number;
  openIncidents: number;
}

export function useAutomationOverview() {
  const [data, setData] = useState<AutomationOverview>({
    totalWorkflows: 0, activeWorkflows: 0, failingWorkflows: 0, totalExecutions: 0,
    successRate: null, avgDurationMs: null, webhookFailures: 0, missedSchedules: 0,
    activeAgents: 0, failingAgents: 0, totalTokens: 0, confirmedCost: 0,
    pendingApprovals: 0, openIncidents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [wfRes, execRes, whRes, schedRes, agentRes, tokenRes, appRes] = await Promise.all([
      supabase.from('digital_footprint_n8n_agents').select('status, health_status, open_alert_count').is('archived_at', null),
      supabase.from('workflow_executions').select('status, duration_ms'),
      supabase.from('workflow_webhooks').select('failure_count'),
      supabase.from('workflow_schedules').select('missed_state'),
      supabase.from('ai_agents').select('status, total_tokens, confirmed_cost').is('archived_at', null),
      supabase.from('ai_usage_logs').select('token_input, token_output'),
      supabase.from('automation_approvals').select('status').eq('status', 'pending'),
    ]);

    const wfs = wfRes.data || [];
    const execs = execRes.data || [];
    const whs = whRes.data || [];
    const scheds = schedRes.data || [];
    const agents = agentRes.data || [];
    const tokens = tokenRes.data || [];
    const approvals = appRes.data || [];

    const successful = execs.filter(e => e.status === 'successful').length;
    const rate = execs.length > 0 ? Math.round((successful / execs.length) * 100) : null;
    const durations = execs.filter(e => e.duration_ms != null).map(e => e.duration_ms as number);
    const avgDur = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    const totalTokensVal = tokens.reduce((sum, t) => sum + (t.token_input || 0) + (t.token_output || 0), 0) + agents.reduce((sum, a) => sum + (a.total_tokens || 0), 0);

    setData({
      totalWorkflows: wfs.length,
      activeWorkflows: wfs.filter(w => w.status === 'active').length,
      failingWorkflows: wfs.filter(w => w.health_status === 'failing').length,
      totalExecutions: execs.length,
      successRate: rate,
      avgDurationMs: avgDur,
      webhookFailures: whs.reduce((s, w) => s + (w.failure_count || 0), 0),
      missedSchedules: scheds.filter(s => s.missed_state === 'missed' || s.missed_state === 'alerted').length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      failingAgents: agents.filter(a => a.status === 'failing').length,
      totalTokens: totalTokensVal,
      confirmedCost: agents.reduce((sum, a) => sum + (a.confirmed_cost || 0), 0),
      pendingApprovals: approvals.length,
      openIncidents: wfs.filter(w => w.open_alert_count > 0).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('digital_footprint_n8n_agents')
      .select('*, digital_footprint_projects!inner(name)')
      .order('created_at', { ascending: false });
    setWorkflows((data || []) as WorkflowRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { workflows, loading, refetch: fetch };
}

export function useExecutions(workflowId?: string) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('workflow_executions').select('*, workflow:digital_footprint_n8n_agents!inner(workflow_name, environment, criticality)').order('created_at', { ascending: false }).limit(200);
    if (workflowId) query = query.eq('workflow_id', workflowId);
    const { data } = await query;
    setExecutions((data || []) as unknown as ExecutionRecord[]);
    setLoading(false);
  }, [workflowId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { executions, loading, refetch: fetch };
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('workflow_webhooks').select('*, workflow:digital_footprint_n8n_agents!inner(workflow_name)').order('created_at', { ascending: false });
    setWebhooks((data || []) as unknown as WebhookRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { webhooks, loading, refetch: fetch };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('workflow_schedules').select('*, workflow:digital_footprint_n8n_agents!inner(workflow_name)').order('next_expected_run', { ascending: true });
    setSchedules((data || []) as unknown as ScheduleRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { schedules, loading, refetch: fetch };
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('ai_agents').select('*').is('archived_at', null).order('created_at', { ascending: false });
    setAgents((data || []) as AgentRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { agents, loading, refetch: fetch };
}

export function useModels() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('ai_models').select('*').order('provider', { ascending: true });
    setModels((data || []) as ModelRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { models, loading, refetch: fetch };
}

export function useApprovals() {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('automation_approvals').select('*, workflow:digital_footprint_n8n_agents!inner(workflow_name), agent:ai_agents!inner(name)').order('created_at', { ascending: false });
    setApprovals((data || []) as unknown as ApprovalRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { approvals, loading, refetch: fetch };
}

