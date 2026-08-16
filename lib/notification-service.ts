import { supabase } from '@/lib/supabase';
import { getEventDefinition, EVENT_CATALOGUE } from '@/lib/event-catalogue';
import type { EventCategory, EventSeverity, SourceSystem } from '@/lib/event-catalogue';

export interface CreateNotificationParams {
  recipientUserId: string;
  eventType: string;
  title: string;
  message?: string;
  relatedModule?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  route?: string;
  actorUserId?: string;
  sourceSystem?: SourceSystem;
  dedupKey?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateActivityParams {
  actorUserId?: string;
  activityType: string;
  title: string;
  description?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAuditParams {
  actorUserId?: string;
  action: string;
  module?: string;
  targetRecordType?: string;
  targetRecordId?: string;
  result?: 'success' | 'denied' | 'failed' | 'partial';
  reason?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  correlationId?: string;
  source?: SourceSystem;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const eventDef = getEventDefinition(params.eventType);
  const category: EventCategory = eventDef?.category || 'system';
  const severity: EventSeverity = eventDef?.defaultSeverity || 'info';
  const dedupWindow = eventDef?.dedupWindowMinutes || 0;

  if (params.dedupKey && dedupWindow > 0) {
    const windowStart = new Date(Date.now() - dedupWindow * 60000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id, occurrence_count')
      .eq('dedup_key', params.dedupKey)
      .eq('recipient_user_id', params.recipientUserId)
      .gte('created_at', windowStart)
      .is('dismissed_at', null)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from('notifications')
        .update({
          occurrence_count: (existing.occurrence_count || 1) + 1,
          last_occurred_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateErr) return { success: false, error: updateErr.message };
      return { success: true, id: existing.id };
    }
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_user_id: params.recipientUserId,
      event_type: params.eventType,
      category,
      severity,
      title: params.title,
      message: params.message || null,
      related_module: params.relatedModule || null,
      related_record_type: params.relatedRecordType || null,
      related_record_id: params.relatedRecordId || null,
      route: params.route || null,
      actor_user_id: params.actorUserId || null,
      source_system: params.sourceSystem || 'system',
      dedup_key: params.dedupKey || null,
      metadata: params.metadata || null,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function createActivity(params: CreateActivityParams): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('project_activity')
    .insert({
      actor_id: params.actorUserId || null,
      activity_type: params.activityType,
      title: params.title,
      description: params.description || null,
      project_id: params.projectId || null,
      metadata: params.metadata || null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createAudit(params: CreateAuditParams): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('admin_security_audit_log')
    .insert({
      actor_id: params.actorUserId || null,
      action: params.action,
      module: params.module || null,
      target_record_type: params.targetRecordType || null,
      target_record_id: params.targetRecordId || null,
      result: params.result || 'success',
      reason: params.reason || null,
      before_summary: params.beforeSummary || null,
      after_summary: params.afterSummary || null,
      correlation_id: params.correlationId || null,
      source: params.source || 'system',
      success: params.result ? params.result === 'success' : true,
      details: params.metadata || {},
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export function buildMentionNotifications(
  mentionedUserIds: string[],
  actorUserId: string,
  recordType: string,
  recordId: string,
  recordTitle: string,
  route: string,
): CreateNotificationParams[] {
  return mentionedUserIds.map((userId) => ({
    recipientUserId: userId,
    eventType: 'mention.created',
    title: 'You were mentioned',
    message: `You were mentioned in ${recordTitle}`,
    relatedModule: recordType,
    relatedRecordType: recordType,
    relatedRecordId: recordId,
    route,
    actorUserId,
    sourceSystem: 'human',
    dedupKey: `mention:${recordType}:${recordId}:${userId}`,
  }));
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_user_id', userId)
    .is('read_at', null);

  return !error;
}

export async function dismissNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

export function generateDedupKey(eventType: string, recordType: string, recordId: string, recipientId: string): string {
  return `${eventType}:${recordType}:${recordId}:${recipientId}`;
}