import { createClient } from '@supabase/supabase-js';
import type { InterceptResult } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function getEdgeFunctionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`;
}

export interface EmailInterceptPayload {
  sender: string;
  recipient: string;
  subject: string;
  content_text: string;
  content_html?: string;
  template_reference?: string;
  provider_name?: string;
  provider_reference?: string;
  attachments?: Array<{
    filename: string;
    mime_type: string;
    size: number;
    storage_path?: string;
  }>;
}

export async function interceptEmail(
  adapterToken: string,
  payload: EmailInterceptPayload
): Promise<InterceptResult> {
  const url = getEdgeFunctionUrl('uat-sandbox-email');

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

export function maskEmail(email: string): string {
  return email.replace(/^([^@]{2})[^@]*(@.*)$/, '$1***$2');
}

export function sanitizeHtmlForPreview(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 1000);
}

export function isAllowedEmailAttachment(filename: string, mimeType: string): { allowed: boolean; reason?: string } {
  const lowerName = filename.toLowerCase();
  const blockedExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp', '.asp', '.aspx', '.jar', '.msi', '.dll', '.scr', '.com', '.html', '.htm', '.svg', '.zip', '.rar', '.7z', '.tar', '.gz', '.docm', '.xlsm', '.pptm'];
  if (blockedExts.some((ext) => lowerName.endsWith(ext))) {
    return { allowed: false, reason: 'Blocked file type' };
  }
  const blockedMimes = [
    'application/x-msdownload', 'application/x-sh', 'text/html', 'image/svg+xml',
    'application/zip', 'application/x-rar', 'application/x-7z-compressed',
    'application/x-tar', 'application/gzip',
    'application/vnd.ms-word.document.macroEnabled.12',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  ];
  if (blockedMimes.some((m) => mimeType.toLowerCase().startsWith(m))) {
    return { allowed: false, reason: 'Blocked MIME type' };
  }
  return { allowed: true };
}