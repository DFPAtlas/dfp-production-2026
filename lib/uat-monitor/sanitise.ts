const SENSITIVE_PARAMS = [
  'token', 'access_token', 'refresh_token', 'code', 'secret', 'password',
  'key', 'session', 'invite', 'signature', 'email', 'phone',
  'payment_intent', 'client_secret', 'auth', 'authorization',
  'reset_token', 'verify_token', 'unsubscribe_token',
];

const EMAIL_RE = /[\w.\-+]+@[\w.\-]+\.[a-zA-Z]{2,}/g;
const BEARER_RE = /Bearer\s+\S+/gi;
const LONG_TOKEN_RE = /[A-Za-z0-9\-_]{32,}/g;
const API_KEY_RE = /(?:sk|pk|api[_-]?key)[=:]\s*\S+/gi;

export function sanitizeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    for (const key of SENSITIVE_PARAMS) {
      if (u.searchParams.has(key)) u.searchParams.set(key, '[REDACTED]');
    }
    u.username = '';
    u.password = '';
    u.hash = '';
    return u.toString();
  } catch {
    let safe = raw;
    try { safe = safe.replace(/token=[^&\s]+/gi, 'token=[REDACTED]'); } catch { /* */ }
    return safe;
  }
}

export function sanitizePath(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    for (const key of SENSITIVE_PARAMS) {
      if (u.searchParams.has(key)) u.searchParams.set(key, '[REDACTED]');
    }
    u.hash = '';
    return u.pathname + (u.search || '');
  } catch {
    return raw;
  }
}

export function sanitizeMessage(msg: string | undefined | null): string | null {
  if (!msg) return null;
  let s = msg;
  s = s.replace(EMAIL_RE, '[EMAIL]');
  s = s.replace(BEARER_RE, 'Bearer [REDACTED]');
  s = s.replace(LONG_TOKEN_RE, '[TOKEN]');
  s = s.replace(API_KEY_RE, '$1=[REDACTED]');
  return s.substring(0, 2000);
}

export function sanitizeSourcePath(path: string | undefined | null): string | null {
  if (!path) return null;
  let s = path.replace(/https?:\/\/[^/]+/, '');
  s = s.replace(LONG_TOKEN_RE, '[REDACTED]');
  return s.substring(0, 1000);
}

export function isValidOrigin(origin: string, allowedOrigin: string): boolean {
  try {
    const o = new URL(origin);
    const a = new URL(allowedOrigin);
    return o.hostname === a.hostname;
  } catch {
    return origin === allowedOrigin;
  }
}