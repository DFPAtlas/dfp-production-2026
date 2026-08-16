import { expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export const BASE_URL = process.env.DFP_UAT_BASE_URL || 'https://digital-footprint.uk';
export const SUPABASE_URL = process.env.DFP_UAT_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.DFP_UAT_SUPABASE_ANON_KEY || '';

export function env(name, required = true) {
  const value = process.env[name]?.trim();
  if (!value && required) throw new Error(`Missing required UAT environment variable: ${name}`);
  return value || '';
}

export function authStorageKey() {
  if (!SUPABASE_URL) throw new Error('DFP_UAT_SUPABASE_URL is required');
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
  return `sb-${ref}-auth-token`;
}

export function collectBrowserDiagnostics(page) {
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    serverErrors: [],
    readdyFormRequests: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') diagnostics.consoleErrors.push(msg.text());
  });

  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));

  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  });

  page.on('response', (response) => {
    if (response.status() >= 500) diagnostics.serverErrors.push(`${response.status()} ${response.url()}`);
  });

  page.on('request', (request) => {
    if (/readdy\.ai\/api\/form/i.test(request.url())) diagnostics.readdyFormRequests.push(request.url());
  });

  return diagnostics;
}

export async function attachDiagnostics(testInfo, diagnostics) {
  await testInfo.attach('browser-diagnostics.json', {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
    contentType: 'application/json',
  });
}

export function expectCriticalBrowserClean(diagnostics) {
  expect(diagnostics.pageErrors, 'uncaught browser page errors').toEqual([]);
  expect(diagnostics.serverErrors, 'unexpected HTTP 5xx responses').toEqual([]);
  expect(diagnostics.readdyFormRequests, 'production must not call readdy.ai/api/form').toEqual([]);

  const criticalConsole = diagnostics.consoleErrors.filter((message) =>
    /uncaught|unhandled|react.{0,20}(error|fatal)|typeerror|referenceerror/i.test(message),
  );
  expect(criticalConsole, 'critical application console errors').toEqual([]);
}

export async function expectNoHorizontalOverflow(page) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(result.scrollWidth, `horizontal overflow: ${JSON.stringify(result)}`).toBeLessThanOrEqual(result.clientWidth + 2);
}

export async function signInWithPasswordSession(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase URL and anon key are required');
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`Supabase password sign-in failed: ${error?.message || 'no session returned'}`);
  return data.session;
}

export async function injectSession(page, session) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const key = authStorageKey();
  await page.evaluate(({ storageKey, value }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, { storageKey: key, value: session });
}

export async function loginWithPasswordSession(page, email, password) {
  const session = await signInWithPasswordSession(email, password);
  await injectSession(page, session);
  return session;
}

export async function getBrowserAccessToken(page) {
  const key = authStorageKey();
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.access_token || parsed?.currentSession?.access_token || null;
    } catch {
      return null;
    }
  }, key);
}

export async function browserRestById(page, table, id, method = 'GET', body = undefined) {
  const token = await getBrowserAccessToken(page);
  if (!token) throw new Error('No Supabase access token found in browser session');
  const query = new URLSearchParams({ id: `eq.${id}`, select: '*' });
  return page.evaluate(async ({ url, anonKey, accessToken, requestMethod, requestBody }) => {
    const response = await fetch(url, {
      method: requestMethod,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: response.status, data };
  }, {
    url: `${SUPABASE_URL}/rest/v1/${table}?${query.toString()}`,
    anonKey: SUPABASE_ANON_KEY,
    accessToken: token,
    requestMethod: method,
    requestBody: body,
  });
}

export async function expectCrossTenantReadDenied(page, table, id) {
  const result = await browserRestById(page, table, id);
  expect(result.status, `${table} RLS request should not fail server-side`).toBeLessThan(500);
  const rows = Array.isArray(result.data) ? result.data : [];
  expect(rows, `cross-tenant read leaked ${table} ${id}`).toHaveLength(0);
}

export async function expectCrossTenantWriteDenied(page, table, id, patch) {
  const result = await browserRestById(page, table, id, 'PATCH', patch);
  expect(result.status, `${table} cross-tenant PATCH should not be a server error`).toBeLessThan(500);
  const rows = Array.isArray(result.data) ? result.data : [];
  expect(rows, `cross-tenant write was allowed on ${table} ${id}`).toHaveLength(0);
}
