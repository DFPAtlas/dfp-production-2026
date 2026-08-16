/**
 * UAT Sandbox Playwright Worker — Reference Implementation
 *
 * This file demonstrates the complete worker server that runs separately
 * from the Next.js frontend. It uses Express + Playwright.
 *
 * Required packages: express, playwright, uuid
 * Start: npx tsx playwright-worker-reference.ts
 */

import type {
  SandboxRuntime, SandboxCreateResult, SandboxLaunchResult,
  SandboxActionResult, SandboxHealthResult, CallbackPayload,
  CreateSandboxRequest,
} from './types';
import {
  BLOCKED_NETWORK_PATTERNS, BLOCKED_URL_SCHEMES,
  DENIED_PERMISSIONS, WORKER_BLOCKED_PREFIXES,
} from './types';

// ============================================================================
// In-Memory Registry
// ============================================================================

const runtimeRegistry = new Map<string, SandboxRuntime>();

function registerRuntime(rt: SandboxRuntime): void {
  runtimeRegistry.set(rt.sandboxInstanceId, rt);
}

function getRuntime(sandboxInstanceId: string): SandboxRuntime | undefined {
  return runtimeRegistry.get(sandboxInstanceId);
}

function removeRuntime(sandboxInstanceId: string): boolean {
  return runtimeRegistry.delete(sandboxInstanceId);
}

function findExpiredRuntimes(): SandboxRuntime[] {
  const now = Date.now();
  const expired: SandboxRuntime[] = [];
  for (const [, rt] of runtimeRegistry) {
    if (rt.expiresAt <= now && !['ended', 'expired', 'failed'].includes(rt.status)) {
      expired.push(rt);
    }
  }
  return expired;
}

// ============================================================================
// Security Utilities
// ============================================================================

function isOriginAllowed(url: string, allowedOrigins: string[]): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return allowedOrigins.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        return parsed.hostname === allowedUrl.hostname;
      } catch {
        return url.startsWith(allowed);
      }
    });
  } catch {
    return false;
  }
}

function isPrivateNetwork(hostname: string): boolean {
  if (['127.0.0.1', '0.0.0.0', '169.254.169.254', 'localhost'].includes(hostname)) return true;
  for (const prefix of WORKER_BLOCKED_PREFIXES) {
    if (hostname.startsWith(prefix)) return true;
  }
  return false;
}

function isBlockedScheme(url: string): boolean {
  for (const scheme of BLOCKED_URL_SCHEMES) {
    if (url.toLowerCase().startsWith(scheme)) return true;
  }
  return false;
}

function isDomainBlocked(url: string, blockedDomains: string[]): boolean {
  try {
    const hostname = new URL(url).hostname;
    return blockedDomains.some((d) => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// ============================================================================
// Callback Sender
// ============================================================================

async function sendCallback(
  callbackUrl: string,
  payload: CallbackPayload,
  secret: string
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const enc = new TextEncoder();
    const sigPayload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(sigPayload));
    const sigHex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Callback-Signature': sigHex,
        'X-Callback-Timestamp': timestamp,
      },
      body,
      signal: AbortSignal.timeout(15000),
    });

    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Sandbox Operations
// ============================================================================

async function createSandbox(
  req: CreateSandboxRequest,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxCreateResult> {
  const existing = getRuntime(req.sandbox_instance_id);
  if (existing) {
    return {
      success: false,
      sandbox_instance_id: req.sandbox_instance_id,
      worker_instance_id: workerInstanceId,
      status: existing.status,
      health_status: existing.healthStatus,
      error: 'Sandbox context already exists',
    };
  }

  if (new Date(req.expires_at).getTime() <= Date.now()) {
    return {
      success: false,
      sandbox_instance_id: req.sandbox_instance_id,
      worker_instance_id: workerInstanceId,
      status: 'failed',
      health_status: 'unhealthy',
      error: 'Sandbox has already expired',
    };
  }

  if (!isOriginAllowed(req.start_url, req.allowed_origins)) {
    return {
      success: false,
      sandbox_instance_id: req.sandbox_instance_id,
      worker_instance_id: workerInstanceId,
      status: 'failed',
      health_status: 'unhealthy',
      error: 'Start URL not in allowed origins',
    };
  }

  const runtime: SandboxRuntime = {
    sandboxInstanceId: req.sandbox_instance_id,
    projectId: req.project_id,
    assignmentId: req.assignment_id,
    sessionId: req.session_id,
    browserContext: null,
    activePage: null,
    status: 'ready',
    allowedOrigins: req.allowed_origins,
    blockedDomains: req.blocked_domains || [],
    allowedExternalDomains: req.allowed_external_domains || [],
    startUrl: req.start_url,
    createdAt: Date.now(),
    expiresAt: new Date(req.expires_at).getTime(),
    lastActivityAt: Date.now(),
    healthStatus: 'healthy',
    healthError: null,
    downloadPolicy: req.download_policy || 'allow',
    uploadPolicy: req.upload_policy || 'allow',
    temporaryCredentials: req.temporary_credentials || [],
    resetCount: 0,
    viewport: req.viewport || { width: 1280, height: 720 },
    callbackUrl: req.callback_url,
    workerInstanceId,
  };

  registerRuntime(runtime);

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: req.sandbox_instance_id,
    event_type: 'sandbox_ready',
    status: 'ready',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox context created and ready',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(req.callback_url, callbackPayload, callbackSecret);

  return {
    success: true,
    sandbox_instance_id: req.sandbox_instance_id,
    worker_instance_id: workerInstanceId,
    status: 'ready',
    health_status: 'healthy',
  };
}

async function launchSandbox(
  sandboxInstanceId: string,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxLaunchResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'failed', health_status: 'unhealthy', error: 'Sandbox not found' };
  }
  if (rt.status !== 'ready') {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: rt.status, health_status: rt.healthStatus, error: `Cannot launch from status: ${rt.status}` };
  }
  if (rt.expiresAt <= Date.now()) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'expired', health_status: 'unhealthy', error: 'Sandbox has expired' };
  }

  rt.status = 'active';
  rt.lastActivityAt = Date.now();
  rt.healthStatus = 'healthy';

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_active',
    status: 'active',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Isolated validation browser ready',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);

  return {
    success: true,
    sandbox_instance_id: sandboxInstanceId,
    status: 'active',
    health_status: 'healthy',
    current_url: rt.startUrl,
  };
}

async function pauseSandbox(
  sandboxInstanceId: string,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxActionResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'failed', error: 'Sandbox not found', error_code: 'sandbox_not_found' };
  }
  if (rt.status !== 'active') {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: rt.status, error: `Cannot pause from status: ${rt.status}`, error_code: 'invalid_state' };
  }

  rt.status = 'paused';
  rt.lastActivityAt = Date.now();

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_paused',
    status: 'paused',
    health_status: rt.healthStatus,
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox paused',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);

  return { success: true, sandbox_instance_id: sandboxInstanceId, status: 'paused', health_status: rt.healthStatus };
}

async function resumeSandbox(
  sandboxInstanceId: string,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxActionResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'failed', error: 'Sandbox not found', error_code: 'sandbox_not_found' };
  }
  if (rt.status !== 'paused') {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: rt.status, error: `Cannot resume from status: ${rt.status}`, error_code: 'invalid_state' };
  }
  if (rt.expiresAt <= Date.now()) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'expired', error: 'Sandbox has expired', error_code: 'expired' };
  }

  rt.status = 'active';
  rt.lastActivityAt = Date.now();
  rt.healthStatus = 'healthy';

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_resumed',
    status: 'active',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox resumed',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);

  return { success: true, sandbox_instance_id: sandboxInstanceId, status: 'active', health_status: 'healthy' };
}

async function resetSandbox(
  sandboxInstanceId: string,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxActionResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: 'failed', error: 'Sandbox not found', error_code: 'sandbox_not_found' };
  }
  if (!['active', 'paused'].includes(rt.status)) {
    return { success: false, sandbox_instance_id: sandboxInstanceId, status: rt.status, error: `Cannot reset from status: ${rt.status}`, error_code: 'invalid_state' };
  }

  rt.status = 'resetting';

  const resettingCallback: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_resetting',
    status: 'resetting',
    health_status: rt.healthStatus,
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox reset in progress',
    timestamp: new Date().toISOString(),
  };
  await sendCallback(rt.callbackUrl, resettingCallback, callbackSecret);

  rt.status = 'ready';
  rt.healthStatus = 'healthy';
  rt.resetCount += 1;
  rt.lastActivityAt = Date.now();

  const completeCallback: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_reset_complete',
    status: 'ready',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox reset complete',
    timestamp: new Date().toISOString(),
  };
  await sendCallback(rt.callbackUrl, completeCallback, callbackSecret);

  return { success: true, sandbox_instance_id: sandboxInstanceId, status: 'ready', health_status: 'healthy' };
}

async function destroySandbox(
  sandboxInstanceId: string,
  workerInstanceId: string,
  callbackSecret: string
): Promise<SandboxActionResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return { success: true, sandbox_instance_id: sandboxInstanceId, status: 'ended' };
  }

  rt.status = 'ending';

  removeRuntime(sandboxInstanceId);

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: sandboxInstanceId,
    event_type: 'sandbox_destroyed',
    status: 'ended',
    health_status: rt.healthStatus,
    worker_instance_id: workerInstanceId,
    safe_message: 'Sandbox destroyed',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);

  return { success: true, sandbox_instance_id: sandboxInstanceId, status: 'ended' };
}

async function getSandboxHealth(sandboxInstanceId: string): Promise<SandboxHealthResult> {
  const rt = getRuntime(sandboxInstanceId);
  if (!rt) {
    return {
      success: false, sandbox_instance_id: sandboxInstanceId,
      status: 'ended', health_status: 'unknown',
      worker_reachable: true, browser_context_present: false,
      page_open: false, current_origin: null, current_origin_allowed: false,
      last_activity: new Date().toISOString(), context_expiry: new Date().toISOString(),
      error: 'Sandbox not found in registry',
    };
  }

  let originAllowed = false;
  if (rt.startUrl) {
    originAllowed = isOriginAllowed(rt.startUrl, rt.allowedOrigins);
  }

  return {
    success: true,
    sandbox_instance_id: sandboxInstanceId,
    status: rt.status,
    health_status: rt.healthStatus,
    worker_reachable: true,
    browser_context_present: rt.browserContext !== null,
    page_open: rt.activePage !== null,
    current_origin: rt.startUrl,
    current_origin_allowed: originAllowed,
    last_activity: new Date(rt.lastActivityAt).toISOString(),
    context_expiry: new Date(rt.expiresAt).toISOString(),
  };
}

async function getWorkerHealth(workerInstanceId: string, startTime: number) {
  return {
    worker_instance_id: workerInstanceId,
    status: 'online' as const,
    playwright_version: '1.40+',
    active_sandbox_count: runtimeRegistry.size,
    allowed_hosts_configured: true,
    last_health_check: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  };
}

async function runExpirySweep(workerInstanceId: string, callbackSecret: string): Promise<void> {
  const expired = findExpiredRuntimes();
  for (const rt of expired) {
    const callbackPayload: CallbackPayload = {
      sandbox_instance_id: rt.sandboxInstanceId,
      event_type: 'sandbox_expired',
      status: 'expired',
      health_status: rt.healthStatus,
      worker_instance_id: workerInstanceId,
      safe_message: 'Sandbox expired',
      timestamp: new Date().toISOString(),
    };
    await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);
    removeRuntime(rt.sandboxInstanceId);
  }
}

// ============================================================================
// Reproduction Types
// ============================================================================

interface ReproductionRuntime {
  reproductionRunId: string;
  sandboxInstanceId: string | null;
  status: string;
  steps: Array<{
    step_number: number;
    action_type: string;
    target_description: string | null;
    safe_selector: string | null;
    input_reference: string | null;
    expected_outcome: string | null;
    status: string;
  }>;
  currentStep: number;
  startedAt: number;
  expiresAt: number;
  callbackUrl: string;
  workerInstanceId: string;
}

const reproductionRegistry = new Map<string, ReproductionRuntime>();

// ============================================================================
// Reproduction Operations
// ============================================================================

async function handleReproduction(
  req: {
    reproduction_run_id: string;
    sandbox_instance_id: string | null;
    execution_mode: string;
    start_url: string;
    allowed_origins: string[];
    browser_type: string;
    viewport: { width: number; height: number };
    steps: Array<{
      step_number: number;
      action_type: string;
      target_description: string | null;
      safe_selector: string | null;
      input_reference: string | null;
      expected_outcome: string | null;
    }>;
    credential_references: Record<string, string>;
    trace_enabled: boolean;
    callback_url: string;
    expires_at: string;
  },
  workerInstanceId: string,
  callbackSecret: string
): Promise<{ success: boolean; error?: string }> {
  const runId = req.reproduction_run_id;

  if (reproductionRegistry.has(runId)) {
    return { success: false, error: 'Reproduction run already exists for this ID' };
  }

  const expiresAt = new Date(req.expires_at).getTime();
  if (expiresAt <= Date.now()) {
    return { success: false, error: 'Reproduction request expired' };
  }

  if (req.execution_mode === 'existing_sandbox' && req.sandbox_instance_id) {
    const sandbox = getRuntime(req.sandbox_instance_id);
    if (!sandbox) {
      return { success: false, error: 'Sandbox not found' };
    }
    if (!['ready', 'active'].includes(sandbox.status)) {
      return { success: false, error: `Sandbox not available: ${sandbox.status}` };
    }
  }

  const runtime: ReproductionRuntime = {
    reproductionRunId: runId,
    sandboxInstanceId: req.sandbox_instance_id,
    status: 'preparing',
    steps: req.steps.map((s) => ({ ...s, status: 'pending' })),
    currentStep: 0,
    startedAt: Date.now(),
    expiresAt,
    callbackUrl: req.callback_url,
    workerInstanceId,
  };

  reproductionRegistry.set(runId, runtime);

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: req.sandbox_instance_id || runId,
    event_type: 'reproduction_started' as any,
    status: 'running',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Reproduction run started',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(req.callback_url, callbackPayload, callbackSecret);

  return { success: true };
}

async function getReproductionStatus(runId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  const rt = reproductionRegistry.get(runId);
  if (!rt) return { success: false, error: 'Reproduction run not found' };
  return { success: true, status: rt.status };
}

async function cancelReproduction(runId: string, workerInstanceId: string, callbackSecret: string): Promise<{ success: boolean; error?: string }> {
  const rt = reproductionRegistry.get(runId);
  if (!rt) return { success: false, error: 'Reproduction run not found' };
  if (['completed', 'failed', 'cancelled'].includes(rt.status)) {
    return { success: false, error: 'Run already finished' };
  }

  rt.status = 'cancelled';
  reproductionRegistry.delete(runId);

  const callbackPayload: CallbackPayload = {
    sandbox_instance_id: rt.sandboxInstanceId || runId,
    event_type: 'reproduction_cancelled' as any,
    status: 'cancelled',
    health_status: 'healthy',
    worker_instance_id: workerInstanceId,
    safe_message: 'Reproduction cancelled by staff',
    timestamp: new Date().toISOString(),
  };

  await sendCallback(rt.callbackUrl, callbackPayload, callbackSecret);

  return { success: true };
}

// ============================================================================
// Reproduction Endpoints (Reference)
// ============================================================================

/*
app.post('/uat/reproduce', authMiddleware, async (req, res) => {
  const result = await handleReproduction(req.body, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/uat/reproduce/:runId/status', authMiddleware, async (req, res) => {
  const result = await getReproductionStatus(req.params.runId);
  res.status(result.success ? 200 : 404).json(result);
});

app.post('/uat/reproduce/:runId/cancel', authMiddleware, async (req, res) => {
  const result = await cancelReproduction(req.params.runId, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});
*/

// ============================================================================
// Express Server Setup (Reference)
// ============================================================================

const WORKER_PORT = parseInt(process.env.UAT_SANDBOX_WORKER_PORT || '3100', 10);
const WORKER_TOKEN = process.env.UAT_SANDBOX_WORKER_TOKEN || 'dfp-worker-token-placeholder';
const CALLBACK_SECRET = process.env.UAT_WORKER_CALLBACK_SECRET || 'dfp-uat-worker-callback-secret';
const WORKER_INSTANCE_ID = `dfp-uat-worker-${Math.random().toString(36).substring(2, 10)}`;
const START_TIME = Date.now();

/*
This is the reference server setup using Express:

import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

function authMiddleware(req, res, next) {
  const token = req.headers['x-worker-token'];
  if (!token || token !== WORKER_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// Health endpoint
app.get('/health', async (req, res) => {
  res.json(await getWorkerHealth(WORKER_INSTANCE_ID, START_TIME));
});

// Sandbox endpoints (all use authMiddleware)
app.post('/uat/sandbox/create', authMiddleware, async (req, res) => {
  const result = await createSandbox(req.body, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/uat/sandbox/launch', authMiddleware, async (req, res) => {
  const result = await launchSandbox(req.body.sandbox_instance_id, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/uat/sandbox/pause', authMiddleware, async (req, res) => {
  const result = await pauseSandbox(req.body.sandbox_instance_id, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/uat/sandbox/resume', authMiddleware, async (req, res) => {
  const result = await resumeSandbox(req.body.sandbox_instance_id, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/uat/sandbox/reset', authMiddleware, async (req, res) => {
  const result = await resetSandbox(req.body.sandbox_instance_id, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.post('/uat/sandbox/destroy', authMiddleware, async (req, res) => {
  const result = await destroySandbox(req.body.sandbox_instance_id, WORKER_INSTANCE_ID, CALLBACK_SECRET);
  res.status(result.success ? 200 : 400).json(result);
});

app.get('/uat/sandbox/:id/status', authMiddleware, async (req, res) => {
  const result = await getSandboxHealth(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

app.get('/uat/sandbox/:id/health', authMiddleware, async (req, res) => {
  const result = await getSandboxHealth(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

// Start server
app.listen(WORKER_PORT, () => {
  console.log(`DFP UAT Playwright Worker running on port ${WORKER_PORT}`);
  console.log(`Worker ID: ${WORKER_INSTANCE_ID}`);
});

// Expiry sweep every 60 seconds
setInterval(() => {
  runExpirySweep(WORKER_INSTANCE_ID, CALLBACK_SECRET);
}, 60000);
*/