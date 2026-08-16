import { supabase } from '@/lib/supabase';

export interface WorkerSandboxStatus {
  status: string;
  health_status: string;
  worker_reachable: boolean;
  browser_context_present: boolean;
  page_open: boolean;
  current_origin: string | null;
  current_origin_allowed: boolean;
  last_activity: string | null;
  context_expiry: string | null;
  worker_instance_id: string | null;
}

export interface WorkerConnectionState {
  workerOnline: boolean;
  workerStatus: 'online' | 'degraded' | 'offline';
  activeSandboxCount: number;
  lastHealthCheck: string | null;
}

let cachedWorkerState: WorkerConnectionState = {
  workerOnline: false,
  workerStatus: 'offline',
  activeSandboxCount: 0,
  lastHealthCheck: null,
};

let cachedWorkerDetails: unknown = null;

export function getCachedWorkerState(): WorkerConnectionState {
  return { ...cachedWorkerState };
}

export function getCachedWorkerDetails(): unknown {
  return cachedWorkerDetails;
}

function offlineState(): WorkerConnectionState {
  return {
    workerOnline: false,
    workerStatus: 'offline',
    activeSandboxCount: 0,
    lastHealthCheck: new Date().toISOString(),
  };
}

async function callProxy(action: string, extra: Record<string, unknown>, timeoutMs: number): Promise<Record<string, any> | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uat-sandbox-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...extra }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function checkWorkerHealth(): Promise<WorkerConnectionState> {
  const data = await callProxy('health', {}, 5000);

  if (data && data.success) {
    cachedWorkerDetails = data;
    cachedWorkerState = {
      workerOnline: true,
      workerStatus: data.status === 'degraded' ? 'degraded' : 'online',
      activeSandboxCount: data.active_sandbox_count || 0,
      lastHealthCheck: new Date().toISOString(),
    };
  } else {
    cachedWorkerState = offlineState();
  }

  return { ...cachedWorkerState };
}

export async function getWorkerSandboxStatus(sandboxInstanceId: string): Promise<WorkerSandboxStatus | null> {
  const data = await callProxy('status', { sandbox_instance_id: sandboxInstanceId }, 10000);
  if (!data || !data.success) return null;

  return {
    status: data.status || 'unknown',
    health_status: data.health_status || 'unknown',
    worker_reachable: data.worker_reachable ?? true,
    browser_context_present: data.browser_context_present ?? false,
    page_open: data.page_open ?? false,
    current_origin: data.current_origin || null,
    current_origin_allowed: data.current_origin_allowed ?? false,
    last_activity: data.last_activity || null,
    context_expiry: data.context_expiry || null,
    worker_instance_id: data.worker_instance_id || null,
  };
}