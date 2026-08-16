import type { MonitorEvent } from './types';
import { sanitizePath } from './sanitise';

const MONITORING_PATH = '/api/uat/monitor/events';
const BLOCKED_SCHEMES = ['data:', 'blob:', 'chrome-extension:', 'moz-extension:', 'edge-extension:'];

export function createNetworkTracker(
  enqueue: (e: MonitorEvent) => void,
  getSettings: () => { capture_failed_requests: boolean; capture_slow_requests: boolean; slow_request_threshold_ms: number },
  getOrigin: () => string | null
) {
  const originalFetch = window.fetch.bind(window);
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  function isBlocked(url: string): boolean {
    if (url.includes(MONITORING_PATH)) return true;
    for (const scheme of BLOCKED_SCHEMES) {
      if (url.toLowerCase().startsWith(scheme)) return true;
    }
    return false;
  }

  function sendNetworkEvent(
    method: string,
    url: string,
    status: number | undefined,
    duration: number,
    failed: boolean
  ) {
    const settings = getSettings();
    const slow = !failed && settings.capture_slow_requests && duration >= settings.slow_request_threshold_ms;

    if (failed && !settings.capture_failed_requests) return;
    if (slow && !settings.capture_slow_requests) return;
    if (!failed && !slow) return;

    const path = sanitizePath(url) || url.split('?')[0] || '/';

    enqueue({
      event_type: failed ? 'api_failure' : 'api_slow',
      request_method: method,
      request_path: path,
      response_status: status || null,
      duration_ms: duration,
      severity: failed ? 'error' : 'warning',
      message: failed ? `Request failed: ${method} ${path}` : `Slow request: ${method} ${path} (${duration}ms)`,
    });
  }

  function start() {
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (args[1]?.method || 'GET').toUpperCase();

      if (isBlocked(url)) return originalFetch(...args);

      const startTime = performance.now();
      let failed = false;

      try {
        const res = await originalFetch(...args);
        const duration = Math.round(performance.now() - startTime);

        if (!res.ok || res.status >= 400) {
          sendNetworkEvent(method, url, res.status, duration, true);
        } else {
          sendNetworkEvent(method, url, res.status, duration, false);
        }
        return res;
      } catch (err) {
        failed = true;
        const duration = Math.round(performance.now() - startTime);
        sendNetworkEvent(method, url, undefined, duration, true);
        throw err;
      }
    };

    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]) {
      (this as any).__uat_method = method;
      (this as any).__uat_url = typeof url === 'string' ? url : url.href;
      (this as any).__uat_start = 0;
      return originalXHROpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: any[]) {
      const url = (this as any).__uat_url;
      const method = (this as any).__uat_method || 'GET';

      if (!url || isBlocked(url)) return originalXHRSend.call(this, ...args);

      (this as any).__uat_start = performance.now();

      this.addEventListener('loadend', function () {
        const start = (this as any).__uat_start;
        if (!start) return;
        const duration = Math.round(performance.now() - start);
        const failed = this.status === 0 || this.status >= 400;
        sendNetworkEvent(method, url, this.status || undefined, duration, failed);
      });

      return originalXHRSend.call(this, ...args);
    };
  }

  function stop() {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.send = originalXHRSend;
  }

  return { start, stop };
}