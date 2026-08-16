import type { MonitorEvent } from './types';
import { sanitizeMessage, sanitizeSourcePath } from './sanitise';

const DUPLICATE_SUPPRESS_MS = 30000;
const recentHashes = new Map<string, number>();

function generateHash(type: string, msg: string | null, file: string | null, line: number | null): string {
  const s = `${type}|${(msg || '').substring(0, 200)}|${file || ''}|${line || 0}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
  return `evt_${Math.abs(hash).toString(36)}`;
}

function isDuplicate(hash: string): boolean {
  const now = Date.now();
  const last = recentHashes.get(hash);
  if (last && now - last < DUPLICATE_SUPPRESS_MS) return true;
  recentHashes.set(hash, now);

  if (recentHashes.size > 200) {
    const cutoff = now - DUPLICATE_SUPPRESS_MS * 2;
    for (const [k, v] of recentHashes) { if (v < cutoff) recentHashes.delete(k); }
  }
  return false;
}

export function createErrorTracker(
  enqueue: (e: MonitorEvent) => void,
  getSettings: () => { capture_console_errors: boolean; capture_unhandled_rejections: boolean }
) {
  function onError(event: ErrorEvent) {
    if (!getSettings().capture_console_errors) return;
    const msg = sanitizeMessage(event.message || String(event.error || 'Unknown error'));
    const file = sanitizeSourcePath(event.filename);
    const hash = generateHash('javascript_error', msg, file, event.lineno);
    if (isDuplicate(hash)) return;

    enqueue({
      event_type: 'javascript_error',
      message: msg,
      source_file: file,
      source_line: event.lineno || null,
      source_column: event.colno || null,
      severity: 'error',
      event_name: event.error?.name || 'Error',
    });
  }

  function onRejection(event: PromiseRejectionEvent) {
    if (!getSettings().capture_unhandled_rejections) return;
    const reason = event.reason;
    const msg = sanitizeMessage(
      typeof reason === 'string' ? reason :
      reason?.message || String(reason || 'Unhandled rejection')
    );
    const hash = generateHash('unhandled_rejection', msg, null, null);
    if (isDuplicate(hash)) return;

    enqueue({
      event_type: 'unhandled_rejection',
      message: msg,
      severity: 'error',
    });
  }

  function start() {
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
  }

  function stop() {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    recentHashes.clear();
  }

  return { start, stop };
}