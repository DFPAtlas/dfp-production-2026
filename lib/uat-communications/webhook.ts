import type { InterceptResult } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function getEdgeFunctionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`;
}

export interface WebhookInterceptPayload {
  event_name: string;
  http_method?: string;
  destination_url?: string;
  safe_summary?: Record<string, unknown>;
  provider_name?: string;
}

export async function interceptWebhook(
  adapterToken: string,
  payload: WebhookInterceptPayload
): Promise<InterceptResult> {
  const url = getEdgeFunctionUrl('uat-sandbox-webhook');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sandbox-Adapter-Token': `Bearer ${adapterToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return { success: false, error: data.message || `HTTP ${res.status}` };
  }

  return data as InterceptResult;
}

export function sanitizeWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  const forbiddenKeys = new Set([
    'authorization', 'auth', 'token', 'api_key', 'secret', 'password',
    'cookie', 'session', 'cookie_header', 'x-api-key', 'x-auth-token',
    'stripe_signature', 'webhook_secret', 'private_key', 'client_secret',
  ]);
  for (const [k, v] of Object.entries(payload)) {
    const lower = k.toLowerCase();
    if (forbiddenKeys.has(lower)) continue;
    if (typeof v === 'string' && v.length > 4000) continue;
    if (typeof v === 'string') cleaned[k] = v;
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) cleaned[k] = v;
  }
  return cleaned;
}