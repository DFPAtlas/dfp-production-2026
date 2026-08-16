'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePBXMetrics() {
  const [metrics, setMetrics] = useState({
    totalTenants: 0, activeTenants: 0, totalNumbers: 0, assignedNumbers: 0,
    callsToday: 0, missedCalls: 0, voicemailsToday: 0, messagesToday: 0,
    activeQueues: 0, webhookFailures: 0, connectionFailures: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [
      { count: totalTenants }, { count: activeTenants },
      { count: totalNumbers }, { count: assignedNumbers },
      { count: callsToday }, { count: missedCalls },
      { count: voicemailsToday },
      { count: messagesToday }, { count: activeQueues },
      { count: webhookFailures }, { count: connectionFailures },
    ] = await Promise.all([
      supabase.from('pbx_tenants').select('*', { count: 'exact', head: true }),
      supabase.from('pbx_tenants').select('*', { count: 'exact', head: true }).eq('commercial_status', 'active'),
      supabase.from('pbx_numbers').select('*', { count: 'exact', head: true }).eq('archive_status', 'active'),
      supabase.from('pbx_numbers').select('*', { count: 'exact', head: true }).eq('assignment_status', 'assigned').eq('archive_status', 'active'),
      supabase.from('pbx_call_logs').select('*', { count: 'exact', head: true }).gte('start_time', today),
      supabase.from('pbx_call_logs').select('*', { count: 'exact', head: true }).eq('status', 'no_answer').gte('start_time', today),
      supabase.from('pbx_voicemail_messages').select('*', { count: 'exact', head: true }).gte('received_at', today),
      supabase.from('pbx_messages').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('pbx_queues').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('pbx_webhook_events').select('*', { count: 'exact', head: true }).not('status', 'eq', 'processed').gte('created_at', today),
      supabase.from('pbx_tenants').select('*', { count: 'exact', head: true }).eq('connection_status', 'authentication_failed'),
    ]);
    setMetrics({
      totalTenants: totalTenants ?? 0, activeTenants: activeTenants ?? 0,
      totalNumbers: totalNumbers ?? 0, assignedNumbers: assignedNumbers ?? 0,
      callsToday: callsToday ?? 0, missedCalls: missedCalls ?? 0,
      voicemailsToday: voicemailsToday ?? 0, messagesToday: messagesToday ?? 0,
      activeQueues: activeQueues ?? 0, webhookFailures: webhookFailures ?? 0,
      connectionFailures: connectionFailures ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { metrics, loading, refetch: fetch };
}

export function usePBXTenants() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('pbx_tenants').select('*').order('created_at', { ascending: false });
    setTenants(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { tenants, loading, refetch: fetch };
}

export function usePBXTenant(id: string | null) {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    const { data } = await supabase.from('pbx_tenants').select('*').eq('id', id).maybeSingle();
    setTenant(data);
    setLoading(false);
  }, [id]);
  useEffect(() => { fetch(); }, [fetch]);
  return { tenant, loading, refetch: fetch };
}

export function usePBXNumbers(tenantId?: string | null) {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_numbers').select('*, pbx_tenants!inner(name)').eq('archive_status', 'active');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setNumbers(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { numbers, loading, refetch: fetch };
}

export function usePBXUsers(tenantId?: string | null) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_users').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('extension');
    setUsers(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { users, loading, refetch: fetch };
}

export function usePBXCallLogs(tenantId?: string | null) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_call_logs').select('*, pbx_tenants!inner(name)', { count: 'exact' });
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data, count } = await q.order('start_time', { ascending: false }).limit(200);
    setCalls(data || []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { calls, loading, totalCount, refetch: fetch };
}

export function usePBXRoutingRules(tenantId?: string | null) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_routing_rules').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('priority');
    setRules(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch };
}

export function usePBXQueues(tenantId?: string | null) {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_queues').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('name');
    setQueues(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { queues, loading, refetch: fetch };
}

export function usePBXBusinessHours(tenantId?: string | null) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_business_hours').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('name');
    setSchedules(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { schedules, loading, refetch: fetch };
}

export function usePBXVoicemailBoxes(tenantId?: string | null) {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_voicemail_boxes').select('*, pbx_users!left(name)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('extension_number');
    setBoxes(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { boxes, loading, refetch: fetch };
}

export function usePBXVoicemailMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('pbx_voicemail_messages').select('*').order('received_at', { ascending: false }).limit(100);
    setMessages(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { messages, loading, refetch: fetch };
}

export function usePBXMessages(tenantId?: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_messages').select('*, pbx_tenants!inner(name)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false }).limit(200);
    setMessages(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { messages, loading, refetch: fetch };
}

export function usePBXWebhookEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('pbx_webhook_events').select('*').order('created_at', { ascending: false }).limit(100);
    setEvents(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { events, loading, refetch: fetch };
}

export function usePBXSyncLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    const { data } = await supabase.from('pbx_sync_logs').select('*, pbx_tenants!left(name)').order('started_at', { ascending: false }).limit(50);
    setLogs(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { fetch(); }, [fetch]);
  return { logs, loading, refetch: fetch };
}

export function usePBXCosts(tenantId?: string | null) {
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_costs').select('*, pbx_tenants!inner(name)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('period_start', { ascending: false }).limit(50);
    setCosts(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { costs, loading, refetch: fetch };
}

export function usePBXIVRMenus(tenantId?: string | null) {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_ivr_menus').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('name');
    setMenus(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { menus, loading, refetch: fetch };
}

export function usePBXRingGroups(tenantId?: string | null) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_ring_groups').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('name');
    setGroups(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { groups, loading, refetch: fetch };
}

export function usePBXRecordings(tenantId?: string | null) {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_recordings').select('*, pbx_call_logs!left(from_number, to_number, duration_seconds)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false }).limit(100);
    setRecordings(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { recordings, loading, refetch: fetch };
}

export function usePBXPortingRequests(tenantId?: string | null) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => {
    let q = supabase.from('pbx_porting_requests').select('*, pbx_tenants!inner(name)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { fetch(); }, [fetch]);
  return { requests, loading, refetch: fetch };
}