import { test, expect } from '@playwright/test';
import {
  attachDiagnostics,
  browserRestById,
  collectBrowserDiagnostics,
  env,
  expectCriticalBrowserClean,
  expectCrossTenantReadDenied,
  expectCrossTenantWriteDenied,
  injectSession,
  loginWithPasswordSession,
  signInWithPasswordSession,
} from './helpers.mjs';

function chromiumOnly(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'authenticated isolation runs once on Chromium desktop');
}

async function expectOwnRow(page, table, id) {
  const result = await browserRestById(page, table, id);
  expect(result.status).toBeLessThan(400);
  const rows = Array.isArray(result.data) ? result.data : [];
  expect(rows, `expected own ${table} row ${id}`).toHaveLength(1);
}

async function expectProtectedDenied(page, loginPattern) {
  await expect.poll(async () => {
    if (loginPattern.test(page.url())) return true;
    return page.getByRole('heading', { name: /Access Denied/i }).isVisible().catch(() => false);
  }, { timeout: 20_000 }).toBe(true);
}

async function loginClient(page, label) {
  await loginWithPasswordSession(
    page,
    env(`DFP_UAT_CLIENT_${label}_EMAIL`),
    env(`DFP_UAT_CLIENT_${label}_PASSWORD`),
  );
  await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/portal\/dashboard/, { timeout: 20_000 });
}

test('@full AUTH-LOGIN-VALID client A password session', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClient(page, 'A');
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full CLIENT-A-READ-A and CLIENT-A-READ-B-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClient(page, 'A');

  await expectOwnRow(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'invoices', env('DFP_UAT_CLIENT_B_INVOICE_ID'));
  await expectCrossTenantReadDenied(page, 'project_files', env('DFP_UAT_CLIENT_B_FILE_ID'));
  await expectCrossTenantWriteDenied(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'), {
    name: 'DFP-UAT forbidden Client A patch',
  });

  const supportId = env('DFP_UAT_CLIENT_B_SUPPORT_ID', false);
  if (supportId) await expectCrossTenantReadDenied(page, 'support_tickets', supportId);
  const messageId = env('DFP_UAT_CLIENT_B_MESSAGE_THREAD_ID', false);
  if (messageId) await expectCrossTenantReadDenied(page, 'message_threads', messageId);

  await page.goto(`/portal/projects/${env('DFP_UAT_CLIENT_B_PROJECT_ID')}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  const directRouteStillOpen = /\/portal\/projects\/[0-9a-f-]+$/i.test(page.url());
  const denialVisible = await page.getByText(/Access Denied|not found|not available/i).first().isVisible().catch(() => false);
  expect(directRouteStillOpen && !denialVisible, 'cross-tenant project route must not reveal the project').toBe(false);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full CLIENT-B-READ-B and CLIENT-B-READ-A-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClient(page, 'B');

  await expectOwnRow(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'invoices', env('DFP_UAT_CLIENT_A_INVOICE_ID'));
  await expectCrossTenantReadDenied(page, 'project_files', env('DFP_UAT_CLIENT_A_FILE_ID'));
  await expectCrossTenantWriteDenied(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'), {
    name: 'DFP-UAT forbidden Client B patch',
  });

  const supportId = env('DFP_UAT_CLIENT_A_SUPPORT_ID', false);
  if (supportId) await expectCrossTenantReadDenied(page, 'support_tickets', supportId);
  const messageId = env('DFP_UAT_CLIENT_A_MESSAGE_THREAD_ID', false);
  if (messageId) await expectCrossTenantReadDenied(page, 'message_threads', messageId);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full CLIENT-CANNOT-OPEN-ADMIN and CLIENT-CANNOT-OPEN-STAFF', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClient(page, 'A');

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expectProtectedDenied(page, /\/admin\/login(?:\?|$)/);

  await page.goto('/staff/dashboard', { waitUntil: 'domcontentloaded' });
  await expectProtectedDenied(page, /\/staff\/login(?:\?|$)/);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full STAFF-LOGIN and STAFF-CANNOT-GAIN-ADMIN-WITHOUT-ROLE', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/staff/login?from=gate', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('you@digital-footprint.uk').fill(env('DFP_UAT_STAFF_EMAIL'));
  await page.getByPlaceholder('Enter your password').fill(env('DFP_UAT_STAFF_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/staff\/dashboard/, { timeout: 20_000 });

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expectProtectedDenied(page, /\/admin\/login(?:\?|$)/);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full ADMIN-LOGIN and ADMIN-EXPECTED-ACCESS', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/admin/login?from=gate', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('admin@digital-footprint.uk').fill(env('DFP_UAT_ADMIN_EMAIL'));
  await page.getByPlaceholder('Enter your password').fill(env('DFP_UAT_ADMIN_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 20_000 });

  await page.goto('/admin/clients', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/clients/);
  await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/leads/);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full TESTER-A own assignment and TESTER-A-READ-B-ASSIGNMENT-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  const session = await signInWithPasswordSession(env('DFP_UAT_TESTER_A_EMAIL'), env('DFP_UAT_TESTER_A_PASSWORD'));
  await injectSession(page, session);
  await page.goto('/uat/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/uat\/dashboard/, { timeout: 20_000 });

  await expectOwnRow(page, 'uat_assignments', env('DFP_UAT_TESTER_A_ASSIGNMENT_ID'));
  await expectCrossTenantReadDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_B_ASSIGNMENT_ID'));
  await expectCrossTenantWriteDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_B_ASSIGNMENT_ID'), {
    status: 'completed',
  });

  const evidenceId = env('DFP_UAT_TESTER_B_EVIDENCE_ID', false);
  if (evidenceId) await expectCrossTenantReadDenied(page, 'uat_evidence', evidenceId);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full TESTER-B own assignment and TESTER-B-READ-A-ASSIGNMENT-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  const session = await signInWithPasswordSession(env('DFP_UAT_TESTER_B_EMAIL'), env('DFP_UAT_TESTER_B_PASSWORD'));
  await injectSession(page, session);
  await page.goto('/uat/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/uat\/dashboard/, { timeout: 20_000 });

  await expectOwnRow(page, 'uat_assignments', env('DFP_UAT_TESTER_B_ASSIGNMENT_ID'));
  await expectCrossTenantReadDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_A_ASSIGNMENT_ID'));
  await expectCrossTenantWriteDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_A_ASSIGNMENT_ID'), {
    status: 'completed',
  });

  const evidenceId = env('DFP_UAT_TESTER_A_EVIDENCE_ID', false);
  if (evidenceId) await expectCrossTenantReadDenied(page, 'uat_evidence', evidenceId);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});
