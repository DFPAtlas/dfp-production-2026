import type { InterceptResult } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function getEdgeFunctionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`;
}

export interface SmsInterceptPayload {
  sender: string;
  recipient: string;
  content_text: string;
  provider_name?: string;
}

export async function interceptSms(
  adapterToken: string,
  payload: SmsInterceptPayload
): Promise<InterceptResult> {
  const url = getEdgeFunctionUrl('uat-sandbox-sms');

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

export function maskPhone(phone: string): string {
  return phone.substring(0, 4) + '****';
}