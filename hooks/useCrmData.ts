'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { LeadStage, LeadPriority, LeadSource } from '@/lib/crm-definitions';
import { ACTIVE_STAGES, CLOSED_STAGES } from '@/lib/crm-definitions';

export interface CrmLead {
  id: string;
  lead_reference: string | null;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_phone: string | null;
  project_type: string | null;
  service_interest: string | null;
  budget_range: string | null;
  message: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  source: LeadSource;
  industry: string | null;
  organisation_size: string | null;
  campaign: string | null;
  estimated_value: number | null;
  currency: string | null;
  value_confidence: string | null;
  next_action: string | null;
  next_action_due: string | null;
  assigned_to: string | null;
  location: string | null;
  consent_marketing: boolean;
  consent_contact: boolean;
  do_not_contact: boolean;
  duplicate_of: string | null;
  duplicate_warning: boolean;
  converted_to_client: string | null;
  converted_to_project: string | null;
  converted_at: string | null;
  converted_by: string | null;
  archived_at: string | null;
  stage_changed_at: string | null;
  last_activity_at: string | null;
  lost_reason: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  owner_id: string;
  action: string;
  channel: string;
  due_at: string;
  completed_at: string | null;
  completed_by: string | null;
  outcome: string | null;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadStageChange {
  id: string;
  lead_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface CrmMetrics {
  total: number;
  newToday: number;
  newThisWeek: number;
  unassigned: number;
  needsFollowUp: number;
  overdueFollowUp: number;
  pipelineValue: number;
  wonValue: number;
  byStage: Record<string, number>;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
  recentlyUpdated: CrmLead[];
}

export function useCrmData() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchId = useRef(0);

  const fetchLeads = useCallback(async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (id !== fetchId.current) return;
    if (err) { setError(err.message); setLoading(false); return; }
    setLeads((data || []) as CrmLead[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const getMetrics = useCallback((): CrmMetrics => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);

    const byStage: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    let pipelineValue = 0;
    let wonValue = 0;

    for (const l of leads) {
      byStage[l.stage] = (byStage[l.stage] || 0) + 1;
      bySource[l.source] = (bySource[l.source] || 0) + 1;
      byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;

      if (l.estimated_value && ACTIVE_STAGES.includes(l.stage)) {
        pipelineValue += l.estimated_value;
      }
      if (l.estimated_value && l.stage === 'won') {
        wonValue += l.estimated_value;
      }
    }

    const newToday = leads.filter(l => l.created_at && new Date(l.created_at) >= todayStart).length;
    const newThisWeek = leads.filter(l => l.created_at && new Date(l.created_at) >= weekAgo).length;
    const unassigned = leads.filter(l => !l.assigned_to && !CLOSED_STAGES.includes(l.stage) && l.stage !== 'archived').length;
    const needsFollowUp = leads.filter(l => l.next_action_due && !l.next_action_due.includes && ACTIVE_STAGES.includes(l.stage)).length;
    const overdueFollowUp = leads.filter(l => l.next_action_due && new Date(l.next_action_due) < now && ACTIVE_STAGES.includes(l.stage)).length;
    const recentlyUpdated = leads.slice(0, 5);

    return {
      total: leads.length,
      newToday,
      newThisWeek,
      unassigned,
      needsFollowUp,
      overdueFollowUp,
      pipelineValue,
      wonValue,
      byStage,
      bySource,
      byPriority,
      recentlyUpdated,
    };
  }, [leads]);

  const updateLead = useCallback(async (id: string, updates: Partial<CrmLead>) => {
    const { error: err } = await supabase.from('leads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) throw err;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('leads').delete().eq('id', id);
    if (err) throw err;
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const bulkUpdate = useCallback(async (ids: string[], updates: Partial<CrmLead>) => {
    const { error: err } = await supabase.from('leads').update({ ...updates, updated_at: new Date().toISOString() }).in('id', ids);
    if (err) throw err;
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, ...updates } : l));
  }, []);

  return { leads, loading, error, fetchLeads, getMetrics, updateLead, deleteLead, bulkUpdate };
}

export function useLeadDetail(leadId: string) {
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [stageHistory, setStageHistory] = useState<LeadStageChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [leadRes, notesRes, fuRes, histRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).maybeSingle(),
      supabase.from('lead_notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('lead_follow_ups').select('*').eq('lead_id', leadId).order('due_at', { ascending: false }),
      supabase.from('lead_stage_history').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
    ]);

    if (leadRes.error) { setError(leadRes.error.message); setLoading(false); return; }
    setLead(leadRes.data as CrmLead | null);
    setNotes((notesRes.data || []) as LeadNote[]);
    setFollowUps((fuRes.data || []) as LeadFollowUp[]);
    setStageHistory((histRes.data || []) as LeadStageChange[]);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addNote = useCallback(async (content: string, authorId: string) => {
    const { data, error: err } = await supabase.from('lead_notes').insert({ lead_id: leadId, author_id: authorId, content }).select().single();
    if (err) throw err;
    setNotes(prev => [data as LeadNote, ...prev]);
    return data as LeadNote;
  }, [leadId]);

  const addFollowUp = useCallback(async (fu: { owner_id: string; action: string; channel: string; due_at: string }) => {
    const { data, error: err } = await supabase.from('lead_follow_ups').insert({ lead_id: leadId, ...fu }).select().single();
    if (err) throw err;
    setFollowUps(prev => [data as LeadFollowUp, ...prev]);
    return data as LeadFollowUp;
  }, [leadId]);

  const completeFollowUp = useCallback(async (fuId: string, outcome: string, userId: string) => {
    const now = new Date().toISOString();
    const { error: err } = await supabase.from('lead_follow_ups').update({ completed_at: now, completed_by: userId, outcome }).eq('id', fuId);
    if (err) throw err;
    setFollowUps(prev => prev.map(f => f.id === fuId ? { ...f, completed_at: now, completed_by: userId, outcome } : f));
  }, []);

  const changeStage = useCallback(async (newStage: LeadStage, userId: string, reason?: string) => {
    const currentStage = lead?.stage || 'new';
    const now = new Date().toISOString();

    const [, histErr] = await Promise.all([
      supabase.from('leads').update({ stage: newStage, stage_changed_at: now, updated_at: now, lost_reason: newStage === 'lost' ? (reason || null) : lead?.lost_reason }).eq('id', leadId),
      supabase.from('lead_stage_history').insert({ lead_id: leadId, from_stage: currentStage, to_stage: newStage, changed_by: userId, reason }),
    ]);

    if (histErr) throw histErr;
    setLead(prev => prev ? { ...prev, stage: newStage, stage_changed_at: now, lost_reason: newStage === 'lost' ? (reason || null) : prev.lost_reason } : null);
    setStageHistory(prev => [{ id: '', lead_id: leadId, from_stage: currentStage, to_stage: newStage, changed_by: userId, reason: reason || null, created_at: now }, ...prev]);
  }, [leadId, lead]);

  return { lead, notes, followUps, stageHistory, loading, error, fetchAll, addNote, addFollowUp, completeFollowUp, changeStage };
}