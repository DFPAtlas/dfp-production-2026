const DEFAULT_SENSITIVE_PARAMS = [
  'token', 'access_token', 'refresh_token', 'code', 'secret', 'password',
  'key', 'session', 'invite', 'signature', 'email', 'phone',
  'payment_intent', 'client_secret', 'auth', 'authorization',
  'reset_token', 'verify_token', 'unsubscribe_token',
];

const EMAIL_PATTERN = /[\w.\-+]+@[\w.\-]+\.[a-zA-Z]{2,}/g;
const BEARER_PATTERN = /Bearer\s+\S+/gi;
const LONG_TOKEN_PATTERN = /[A-Za-z0-9\-_]{32,}/g;
const API_KEY_PATTERN = /(?:sk|pk|api[_-]?key)[=:]\s*\S+/gi;
const PASSWORD_PATTERN = /password[=:]\s*\S+/gi;

export function sanitizeUrl(
  raw: string | undefined | null,
  extraMaskedParams: string[] = []
): { url: string | null; path: string | null } {
  if (!raw) return { url: null, path: null };
  try {
    const u = new URL(raw);
    const allMasked = new Set([...DEFAULT_SENSITIVE_PARAMS, ...extraMaskedParams]);
    for (const key of allMasked) {
      if (u.searchParams.has(key)) {
        u.searchParams.set(key, '[REDACTED]');
      }
    }
    u.username = '';
    u.password = '';
    u.hash = '';
    return { url: u.toString(), path: u.pathname + (u.search || '') };
  } catch {
    let safe = raw;
    try { safe = raw.replace(/token=[^&\s]+/gi, 'token=[REDACTED]'); } catch { /* ignore */ }
    try { safe = safe.replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]'); } catch { /* ignore */ }
    return { url: safe, path: safe };
  }
}

export function sanitizeMessage(msg: string | undefined | null): string | null {
  if (!msg) return null;
  let s = msg;
  s = s.replace(EMAIL_PATTERN, '[EMAIL]');
  s = s.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
  s = s.replace(LONG_TOKEN_PATTERN, '[TOKEN]');
  s = s.replace(API_KEY_PATTERN, '$1=[REDACTED]');
  s = s.replace(PASSWORD_PATTERN, 'password=[REDACTED]');
  return s.substring(0, 2000);
}

export function sanitizeSourcePath(path: string | undefined | null): string | null {
  if (!path) return null;
  let s = path.replace(/https?:\/\/[^/]+/, '');
  s = s.replace(/\?[^\s]*$/, '');
  s = s.replace(LONG_TOKEN_PATTERN, '[REDACTED]');
  return s.substring(0, 1000);
}

export function generateEventHash(
  eventType: string,
  message: string | null | undefined,
  sourceFile: string | null | undefined,
  sourceLine: number | null | undefined
): string | null {
  if (!['javascript_error', 'unhandled_rejection'].includes(eventType)) return null;
  const simple = `${eventType}|${(message || '').substring(0, 200)}|${sourceFile || ''}|${sourceLine || 0}`;
  let hash = 0;
  for (let i = 0; i < simple.length; i++) {
    hash = ((hash << 5) - hash) + simple.charCodeAt(i);
    hash |= 0;
  }
  return `evt_${Math.abs(hash).toString(36)}`;
}

export const FORBIDDEN_METADATA_KEYS = new Set([
  'request_body', 'response_body', 'headers', 'cookies', 'authorization',
  'auth', 'form_values', 'form_data', 'token', 'password', 'secret',
  'storage', 'local_storage', 'session_storage', 'clipboard',
]);

export function sanitizeMetadata(meta: Record<string, unknown> | undefined | null): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {};
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (FORBIDDEN_METADATA_KEYS.has(k.toLowerCase())) continue;
    if (typeof v === 'string' && v.length > 4000) continue;
    if (typeof v === 'string') {
      cleaned[k] = sanitizeMessage(v) || '';
    } else if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}