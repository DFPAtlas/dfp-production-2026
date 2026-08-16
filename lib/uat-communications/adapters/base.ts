import { supabase } from '@/lib/supabase';
import type { CommunicationSettings, InterceptResult } from '../types';

export interface ProjectAdapter {
  projectId: string;
  environmentId?: string;
  supportsEmail: boolean;
  supportsSms: boolean;
  supportsWebhook: boolean;
}

export async function getProjectAdapter(projectId: string): Promise<ProjectAdapter | null> {
  const { data: settings } = await supabase
    .from('uat_sandbox_communication_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!settings) return null;

  const s = settings as CommunicationSettings;
  return {
    projectId,
    environmentId: s.environment_id || undefined,
    supportsEmail: s.email_interception_enabled,
    supportsSms: s.sms_interception_enabled,
    supportsWebhook: s.webhook_interception_enabled,
  };
}

export async function loadCommunicationSettings(projectId: string): Promise<CommunicationSettings | null> {
  const { data } = await supabase
    .from('uat_sandbox_communication_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  return data as CommunicationSettings | null;
}

export async function generateAdapterToken(
  sandboxInstanceId: string,
  assignmentId: string,
  sessionId: string | null,
  testerId: string,
  projectId: string
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const payload = {
      sandbox_instance_id: sandboxInstanceId,
      assignment_id: assignmentId,
      session_id: sessionId,
      tester_id: testerId,
      project_id: projectId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signingInput = `${header}.${body}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode('dfp-uat-adapter-secret');
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signingInput));
    const sigArray = Array.from(new Uint8Array(signature));
    const sigHex = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const sigB64 = btoa(sigHex);

    return `${header}.${body}.${sigB64}`;
  } catch {
    return null;
  }
}

export function formatMessageTypeLabel(type: string): string {
  switch (type) {
    case 'email': return 'Email';
    case 'sms': return 'SMS';
    case 'webhook': return 'Webhook';
    case 'notification': return 'Notification';
    default: return type;
  }
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'intercepted': return 'Intercepted';
    case 'simulated_delivered': return 'Simulated Delivered';
    case 'simulated_failed': return 'Simulated Failed';
    case 'blocked': return 'Blocked';
    case 'quarantined': return 'Quarantined';
    case 'reviewed': return 'Reviewed';
    case 'expired': return 'Expired';
    default: return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'intercepted': return 'bg-blue-100 text-blue-700';
    case 'simulated_delivered': return 'bg-emerald-100 text-emerald-700';
    case 'simulated_failed': return 'bg-red-100 text-red-700';
    case 'blocked': return 'bg-amber-100 text-amber-700';
    case 'quarantined': return 'bg-purple-100 text-purple-700';
    case 'reviewed': return 'bg-slate-100 text-slate-700';
    case 'expired': return 'bg-gray-100 text-gray-500';
    default: return 'bg-slate-100 text-slate-600';
  }
}