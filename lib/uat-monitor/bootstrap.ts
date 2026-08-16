import { createUATMonitor } from './client';
import type { UATMonitor, MonitoringTokenResponse } from './types';

const TOKEN_ENDPOINT = '/functions/v1/create-uat-monitoring-token';

export async function bootstrapMonitoring(
  assignmentId: string,
  sessionId: string,
  origin: string,
  supabaseClient: any
): Promise<UATMonitor | null> {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return null;

    const res = await fetch(
      `${supabaseClient.supabaseUrl}${TOKEN_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ assignment_id: assignmentId, session_id: sessionId, origin }),
      }
    );

    if (!res.ok) return null;

    const data: MonitoringTokenResponse = await res.json();
    if (!data.success || !data.token || !data.settings) return null;

    const monitor = createUATMonitor({
      endpoint: `${supabaseClient.supabaseUrl}/functions/v1/uat-monitor-events`,
      token: data.token,
      allowedOrigin: origin,
      settings: data.settings,
      assignmentId,
      onTokenExpired: () => {
        monitor.stop();
      },
    });

    monitor.start();
    return monitor;
  } catch {
    return null;
  }
}