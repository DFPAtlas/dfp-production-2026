import type { MonitorEvent } from './types';

export function createPerformanceTracker(
  enqueue: (e: MonitorEvent) => void,
  getSettings: () => { capture_performance: boolean }
) {
  let sent = false;

  function start() {
    sent = false;

    const collectPerformance = () => {
      if (sent || !getSettings().capture_performance) return;
      if (document.readyState === 'complete') {
        sent = true;
        sendPerformance();
      }
    };

    if (document.readyState === 'complete') {
      collectPerformance();
    } else {
      window.addEventListener('load', collectPerformance, { once: true });
      setTimeout(() => {
        if (!sent) collectPerformance();
      }, 10000);
    }
  }

  function sendPerformance() {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paintEntries = performance.getEntriesByType('paint');

    let fcp: number | undefined;
    let lcp: number | undefined;
    let cls: number | undefined;
    let ttfb: number | undefined;
    let domInteractive: number | undefined;
    let domComplete: number | undefined;

    if (nav) {
      ttfb = nav.responseStart > 0 ? Math.round(nav.responseStart - nav.requestStart) : undefined;
      domInteractive = nav.domInteractive > 0 ? Math.round(nav.domInteractive - nav.fetchStart) : undefined;
      domComplete = nav.domComplete > 0 ? Math.round(nav.domComplete - nav.fetchStart) : undefined;
    }

    for (const entry of paintEntries) {
      if (entry.name === 'first-contentful-paint') {
        fcp = Math.round(entry.startTime);
      }
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            lcp = Math.round(entry.startTime);
          }
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.disconnect();
    } catch { /* not supported */ }

    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput === false) {
            cls = Math.round(((entry as any).value || 0) * 1000) / 1000;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      clsObserver.disconnect();
    } catch { /* not supported */ }

    const perfData: Record<string, unknown> = {};
    if (ttfb !== undefined) perfData.ttfb_ms = ttfb;
    if (fcp !== undefined) perfData.fcp_ms = fcp;
    if (lcp !== undefined) perfData.lcp_ms = lcp;
    if (cls !== undefined) perfData.cls = cls;
    if (domInteractive !== undefined) perfData.dom_interactive_ms = domInteractive;
    if (domComplete !== undefined) perfData.dom_complete_ms = domComplete;

    if (Object.keys(perfData).length > 0) {
      enqueue({
        event_type: 'performance',
        performance_data: perfData,
      });
    }
  }

  function stop() {
    sent = true;
  }

  return { start, stop };
}