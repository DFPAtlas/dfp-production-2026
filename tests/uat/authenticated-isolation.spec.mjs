import { test, expect } from '@playwright/test';
import {
  attachDiagnostics,
  browserRestById,
  collectBrowserDiagnostics,
  env,
  expectCriticalBrowserClean,
  expectCrossTenantReadDenied,
  expectNoopCrossTenantWriteDenied,
  injectSession,
  loginClientWithMagicLink,
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

test('@full AUTH-LOGIN-VALID client A magic link', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClientWithMagicLink(page, env('DFP_UAT_CLIENT_A_EMAIL'));
  await expect(page).toHaveURL(/\/portal\/dashboard/);
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full CLIENT-A-READ-A and CLIENT-A-READ-B-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClientWithMagicLink(page, env('DFP_UAT_CLIENT_A_EMAIL'));

  await expectOwnRow(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'invoices', env('DFP_UAT_CLIENT_B_INVOICE_ID'));
  await expectCrossTenantReadDenied(page, 'project_files', env('DFP_UAT_CLIENT_B_FILE_ID'));
  await expectNoopCrossTenantWriteDenied(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'), 'name');

  const supportId = env('DFP_UAT_CLIENT_B_SUPPORT_ID', false);
  if (supportId) await expectCrossTenantReadDenied(page, 'support_tickets', supportId);
  const messageId = env('DFP_UAT_CLIENT_B_MESSAGE_THREAD_ID', false);
  if (messageId) await expectCrossTenantReadDenied(page, 'message_threads', messageId);

  await page.goto(`/portal/projects/${env('DFP_UAT_CLIENT_B_PROJECT_ID')}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  expect(page.url()).not.toMatch(/\/portal\/projects\/[0-9a-f-]+$/i);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full CLIENT-B-READ-B and CLIENT-B-READ-A-DENY', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  const diagnostics = collectBrowserDiagnostics(page);
  await loginClientWithMagicLink(page, env('DFP_UAT_CLIENT_B_EMAIL'));

  await expectOwnRow(page, 'projects', env('DFP_UAT_CLIENT_B_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'));
  await expectCrossTenantReadDenied(page, 'invoices', env('DFP_UAT_CLIENT_A_INVOICE_ID'));
  await expectCrossTenantReadDenied(page, 'project_files', env('DFP_UAT_CLIENT_A_FILE_ID'));
  await expectNoopCrossTenantWriteDenied(page, 'projects', env('DFP_UAT_CLIENT_A_PROJECT_ID'), 'name');

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
  await loginClientWithMagicLink(page, env('DFP_UAT_CLIENT_A_EMAIL'));

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 20_000 });

  await page.goto('/staff/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/staff\/login(?:\?|$)/, { timeout: 20_000 });

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
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 20_000 });

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
  await expectNoopCrossTenantWriteDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_B_ASSIGNMENT_ID'), 'status');

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
  await expectNoopCrossTenantWriteDenied(page, 'uat_assignments', env('DFP_UAT_TESTER_A_ASSIGNMENT_ID'), 'status');

  const evidenceId = env('DFP_UAT_TESTER_A_EVIDENCE_ID', false);
  if (evidenceId) await expectCrossTenantReadDenied(page, 'uat_evidence', evidenceId);

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});
