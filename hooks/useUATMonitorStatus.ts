'use client';

import { useState, useCallback, useRef } from 'react';
import type { MonitorConnectionStatus, EventCounts } from '@/lib/uat-monitor/types';
import type { UATMonitor } from '@/lib/uat-monitor/client';

interface MonitorStatusState {
  status: MonitorConnectionStatus;
  lastEventAt: string | null;
  currentPage: string | null;
  errorCount: number;
  failedRequestCount: number;
  slowRequestCount: number;
  checkpointCount: number;
  pageViewCount: number;
  reconnect: () => void;
}

export function useUATMonitorStatus(
  monitorRef: React.MutableRefObject<UATMonitor | null>,
  onReconnect: () => void
): MonitorStatusState {
  const [status, setStatus] = useState<MonitorConnectionStatus>('not_enabled');
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [counts, setCounts] = useState<EventCounts>({
    errorCount: 0, failedRequestCount: 0, slowRequestCount: 0,
    checkpointCount: 0, pageViewCount: 0,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    const m = monitorRef.current;
    if (!m) return;
    const s = m.getStatus();
    setStatus(s.status);
    setLastEventAt(s.lastEventAt);
    setCurrentPage(s.currentPage);
    const c = m.getCounts();
    setCounts(c);
  }, [monitorRef]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    refresh();
    pollRef.current = setInterval(refresh, 3000);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const reconnect = useCallback(() => {
    onReconnect();
    startPolling();
  }, [onReconnect, startPolling]);

  return {
    status, lastEventAt, currentPage,
    errorCount: counts.errorCount,
    failedRequestCount: counts.failedRequestCount,
    slowRequestCount: counts.slowRequestCount,
    checkpointCount: counts.checkpointCount,
    pageViewCount: counts.pageViewCount,
    reconnect,
  };
}