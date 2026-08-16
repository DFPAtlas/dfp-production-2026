import type { UATMonitor, UATMonitorConfig, MonitorStatus, MonitorConnectionStatus, EventCounts, MonitorEvent } from './types';
import { createTransport } from './transport';
import { createNavigationTracker } from './navigation';
import { createErrorTracker } from './errors';
import { createNetworkTracker } from './network';
import { createPerformanceTracker } from './performance';
import { sanitizePath, isValidOrigin } from './sanitise';

const HEARTBEAT_INTERVAL = 60000;

export function createUATMonitor(config: UATMonitorConfig): UATMonitor {
  let status: MonitorConnectionStatus = 'not_enabled';
  let token = config.token;
  let currentPage: string | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let visibilityHandler: (() => void) | null = null;
  let lastEventAt: string | null = null;

  let errorCount = 0;
  let failedRequestCount = 0;
  let slowRequestCount = 0;
  let checkpointCount = 0;
  let pageViewCount = 0;

  const getToken = () => token;
  const getSettings = () => config.settings;

  const transport = createTransport(config.endpoint, getToken);

  transport.setOnDisconnected(() => {
    setStatus('degraded');
    config.onDisconnected?.();
  });

  const navTracker = createNavigationTracker(transport.enqueue, getSettings);
  const errorTracker = createErrorTracker(transport.enqueue, getSettings);
  const networkTracker = createNetworkTracker(transport.enqueue, getSettings, () => null);
  const perfTracker = createPerformanceTracker(transport.enqueue, getSettings);

  function setStatus(s: MonitorConnectionStatus) {
    status = s;
    config.onStatusChange?.(s);
  }

  function enqueueWithCount(event: MonitorEvent) {
    lastEventAt = new Date().toISOString();
    transport.enqueue(event);

    switch (event.event_type) {
      case 'javascript_error': case 'unhandled_rejection': errorCount++; break;
      case 'api_failure': failedRequestCount++; break;
      case 'api_slow': slowRequestCount++; break;
      case 'tester_checkpoint': checkpointCount++; break;
      case 'page_view': case 'route_change': pageViewCount++; break;
    }
  }

  function sendHeartbeat() {
    if (status !== 'active') return;
    const path = sanitizePath(window.location.href);
    enqueueWithCount({
      event_type: 'heartbeat',
      page_path: path,
      page_title: document.title.substring(0, 500),
    });
  }

  function onVisibilityChange() {
    if (!getSettings().capture_visibility) return;
    const path = sanitizePath(window.location.href);
    if (document.hidden) {
      enqueueWithCount({ event_type: 'page_hidden', page_path: path });
    } else {
      currentPage = path;
      enqueueWithCount({ event_type: 'page_visible', page_path: path });
    }
  }

  function start() {
    if (status === 'active') return;
    if (!isValidOrigin(window.location.origin, config.allowedOrigin)) {
      return;
    }

    setStatus('connecting');

    navTracker.start();
    errorTracker.start();
    networkTracker.start();
    perfTracker.start();
    transport.start();

    visibilityHandler = onVisibilityChange;
    document.addEventListener('visibilitychange', visibilityHandler);

    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    currentPage = sanitizePath(window.location.href);
    enqueueWithCount({ event_type: 'monitoring_started' });
    enqueueWithCount({
      event_type: 'page_view',
      page_url: window.location.href,
      page_path: currentPage,
      page_title: document.title.substring(0, 500),
    });

    lastEventAt = new Date().toISOString();
    setStatus('active');
  }

  function stop() {
    enqueueWithCount({ event_type: 'monitoring_stopped' });

    transport.stopAndFlush();
    navTracker.stop();
    errorTracker.stop();
    networkTracker.stop();
    perfTracker.stop();

    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }

    token = '';
    currentPage = null;
    setStatus('disconnected');
  }

  function pause() {
    enqueueWithCount({ event_type: 'monitoring_stopped' });

    transport.pause();
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }

    setStatus('paused');
  }

  function resume(newToken: string) {
    token = newToken;

    transport.resume();

    visibilityHandler = onVisibilityChange;
    document.addEventListener('visibilitychange', visibilityHandler);

    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    currentPage = sanitizePath(window.location.href);
    enqueueWithCount({ event_type: 'monitoring_started' });
    enqueueWithCount({
      event_type: 'page_view',
      page_url: window.location.href,
      page_path: currentPage,
      page_title: document.title.substring(0, 500),
    });

    lastEventAt = new Date().toISOString();
    setStatus('active');
  }

  function checkpoint(label: string, metadata?: Record<string, unknown>) {
    if (status !== 'active') return;

    const safeLabel = label.substring(0, 255);
    const path = sanitizePath(window.location.href);

    enqueueWithCount({
      event_type: 'tester_checkpoint',
      event_name: safeLabel,
      message: metadata?.note ? String(metadata.note).substring(0, 2000) : undefined,
      page_path: path,
      safe_metadata: metadata || {},
      assignment_test_case_id: config.assignmentTestCaseId || undefined,
    });
  }

  function getStatus(): MonitorStatus {
    return {
      status,
      lastEventAt,
      queuedEvents: 0,
      currentPage,
    };
  }

  function getCounts(): EventCounts {
    return { errorCount, failedRequestCount, slowRequestCount, checkpointCount, pageViewCount };
  }

  return { start, stop, pause, resume, checkpoint, getStatus, getCounts };
}