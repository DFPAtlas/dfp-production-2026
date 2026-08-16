import type { ReproductionEventType } from './types';

export interface EvidenceCollector {
  events: Array<{
    event_type: ReproductionEventType;
    severity: string | null;
    safe_message: string | null;
    request_method: string | null;
    request_path: string | null;
    response_status: number | null;
    duration_ms: number | null;
    step_number: number | null;
    timestamp: string;
  }>;
  screenshots: Array<{ step_number: number; label: string; buffer: Buffer | Uint8Array }>;
  traceActive: boolean;
  tracePath: string | null;
}

export function createEvidenceCollector(): EvidenceCollector {
  return {
    events: [],
    screenshots: [],
    traceActive: false,
    tracePath: null,
  };
}

export function recordEvent(
  collector: EvidenceCollector,
  eventType: ReproductionEventType,
  details: {
    severity?: string | null;
    safeMessage?: string | null;
    requestMethod?: string | null;
    requestPath?: string | null;
    responseStatus?: number | null;
    durationMs?: number | null;
    stepNumber?: number | null;
  } = {}
): void {
  collector.events.push({
    event_type: eventType,
    severity: details.severity || null,
    safe_message: details.safeMessage || null,
    request_method: details.requestMethod || null,
    request_path: details.requestPath || null,
    response_status: details.responseStatus || null,
    duration_ms: details.durationMs || null,
    step_number: details.stepNumber || null,
    timestamp: new Date().toISOString(),
  });
}

export async function captureScreenshot(
  collector: EvidenceCollector,
  page: any,
  stepNumber: number,
  label: string
): Promise<Buffer | null> {
  try {
    const buffer = await page.screenshot({ fullPage: false, type: 'png' });
    collector.screenshots.push({ step_number: stepNumber, label, buffer });
    recordEvent(collector, 'screenshot_captured', { safeMessage: label, stepNumber });
    return buffer;
  } catch {
    return null;
  }
}

export async function startTrace(context: any, collector: EvidenceCollector, runId: string): Promise<void> {
  try {
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: false,
    });
    collector.traceActive = true;
    collector.tracePath = `/tmp/dfp-repro-${runId}-trace.zip`;
    recordEvent(collector, 'trace_started', { safeMessage: 'Playwright trace started' });
  } catch {
    recordEvent(collector, 'worker_warning', { safeMessage: 'Trace start failed - continuing without tracing' });
  }
}

export async function stopTrace(context: any, collector: EvidenceCollector): Promise<{ buffer: Buffer | null; path: string | null }> {
  if (!collector.traceActive) return { buffer: null, path: null };
  try {
    await context.tracing.stop({ path: collector.tracePath });
    collector.traceActive = false;
    recordEvent(collector, 'trace_completed', { safeMessage: 'Playwright trace completed' });

    const fs = await import('node:fs/promises');
    const buffer = await fs.readFile(collector.tracePath!);
    return { buffer: buffer as unknown as Buffer, path: collector.tracePath };
  } catch {
    recordEvent(collector, 'worker_warning', { safeMessage: 'Trace export failed' });
    return { buffer: null, path: null };
  }
}

export function setupPageListeners(page: any, collector: EvidenceCollector, currentStepRef: { current: number }): void {
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      recordEvent(collector, 'console_error', {
        severity: 'error',
        safeMessage: msg.text().substring(0, 300),
        stepNumber: currentStepRef.current,
      });
    }
  });

  page.on('pageerror', (err: Error) => {
    recordEvent(collector, 'page_error', {
      severity: 'error',
      safeMessage: err.message.substring(0, 300),
      stepNumber: currentStepRef.current,
    });
  });

  page.on('requestfailed', (req: any) => {
    const url = req.url();
    if (url.includes('uat-sandbox-callback') || url.includes('uat-monitor-events')) return;
    recordEvent(collector, 'request_failed', {
      severity: 'error',
      requestMethod: req.method(),
      requestPath: sanitiseUrl(url),
      stepNumber: currentStepRef.current,
    });
  });

  page.on('response', (res: any) => {
    if (res.status() >= 400) {
      const url = res.url();
      if (url.includes('uat-sandbox-callback') || url.includes('uat-monitor-events')) return;
      recordEvent(collector, 'response_error', {
        severity: res.status() >= 500 ? 'error' : 'warning',
        requestMethod: res.request().method(),
        requestPath: sanitiseUrl(url),
        responseStatus: res.status(),
        stepNumber: currentStepRef.current,
      });
    }
  });
}

function sanitiseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const sensitive = ['token', 'access_token', 'refresh_token', 'code', 'secret', 'password', 'key', 'session', 'signature', 'email', 'phone', 'payment_intent', 'client_secret'];
    for (const param of sensitive) {
      parsed.searchParams.delete(param);
    }
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.split('?')[0];
  }
}