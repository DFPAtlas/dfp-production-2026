import type { MonitorEvent, TransportResult } from './types';

const MAX_BATCH = 50;
const FLUSH_INTERVAL = 10000;
const BATCH_SIZE_TRIGGER = 25;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export function createTransport(endpoint: string, getToken: () => string | null) {
  let queue: MonitorEvent[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let flushing = false;
  let retryCount = 0;
  let stopped = false;
  let onDisconnected: (() => void) | null = null;

  function scheduleFlush() {
    if (stopped) return;
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flushQueue, FLUSH_INTERVAL);
  }

  function cancelFlush() {
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  }

  async function flushQueue(): Promise<void> {
    if (flushing || queue.length === 0 || stopped) return;
    flushing = true;

    let batch = queue.splice(0, MAX_BATCH);
    const token = getToken();
    if (!token) { flushing = false; return; }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(batch),
        });

        if (res.ok) {
          retryCount = 0;
          flushing = false;

          if (queue.length >= BATCH_SIZE_TRIGGER) {
            batch = queue.splice(0, MAX_BATCH);
            flushing = true;
            attempt = -1;
            continue;
          }
          return;
        }

        if (res.status === 401 || res.status === 423) {
          retryCount = MAX_RETRIES;
          break;
        }
      } catch {
        /* network error, retry */
      }

      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_BASE_MS * Math.pow(2, attempt));
      }
    }

    retryCount++;
    if (retryCount >= 3) {
      retryCount = 0;
      onDisconnected?.();
    }
    flushing = false;
  }

  function enqueue(event: MonitorEvent) {
    if (stopped) return;
    queue.push(event);
    if (queue.length >= BATCH_SIZE_TRIGGER) {
      flushQueue();
    }
  }

  function start() {
    stopped = false;
    scheduleFlush();
  }

  function pause() {
    cancelFlush();
    flushQueue();
  }

  function resume() {
    stopped = false;
    scheduleFlush();
  }

  async function stopAndFlush() {
    stopped = true;
    cancelFlush();

    if (queue.length === 0) return;
    const token = getToken();
    if (!token) return;

    try {
      const batch = queue.splice(0, MAX_BATCH);
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(batch),
          keepalive: true,
        });
      }
    } catch { /* best effort */ }
  }

  return {
    enqueue, start, pause, resume, stopAndFlush, flushQueue,
    setOnDisconnected(fn: () => void) { onDisconnected = fn; },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}