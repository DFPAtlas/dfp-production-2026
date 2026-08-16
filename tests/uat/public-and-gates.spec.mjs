import { test, expect } from '@playwright/test';
import {
  attachDiagnostics,
  collectBrowserDiagnostics,
  expectCriticalBrowserClean,
  expectNoHorizontalOverflow,
} from './helpers.mjs';

const publicRoutes = [
  '/',
  '/pricing',
  '/contact',
  '/request-demo',
  '/support/request',
  '/partners/apply',
  '/blog',
  '/uat-testing/apply',
  '/login',
  '/portal/login',
  '/staff/login',
  '/admin/login',
];

const responsiveRoutes = ['/', '/pricing', '/contact', '/login'];

for (const route of publicRoutes) {
  test(`@public PUBLIC-LOAD ${route}`, async ({ page }, testInfo) => {
    const diagnostics = collectBrowserDiagnostics(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `no navigation response for ${route}`).not.toBeNull();
    expect(response.status(), `${route} should exist and load without HTTP error`).toBeLessThan(400);
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
    await attachDiagnostics(testInfo, diagnostics);
    expectCriticalBrowserClean(diagnostics);
  });
}

test('@public AUTH-PROTECTED-ROUTE-DENY portal', async ({ page }, testInfo) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/portal/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/portal\/login(?:\?|$)/, { timeout: 20_000 });
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@public AUTH-PROTECTED-ROUTE-DENY staff', async ({ page }, testInfo) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/staff/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/staff\/login(?:\?|$)/, { timeout: 20_000 });
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@public AUTH-PROTECTED-ROUTE-DENY admin', async ({ page }, testInfo) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 20_000 });
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@public AUTH-PROTECTED-ROUTE-DENY tester', async ({ page }, testInfo) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/uat/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/(login|uat\/login)(?:\?|$)/, { timeout: 20_000 });
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

for (const route of responsiveRoutes) {
  test(`@public RESPONSIVE-NO-OVERFLOW ${route}`, async ({ page }, testInfo) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await expectNoHorizontalOverflow(page);
    await attachDiagnostics(testInfo, diagnostics);
    expectCriticalBrowserClean(diagnostics);
  });
}

test('@public AUTH-LOGIN-INVALID staff', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'one invalid-login check is sufficient');
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/staff/login?from=gate', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('you@digital-footprint.uk').fill('dfp-browser-uat-invalid@example.com');
  await page.getByPlaceholder('Enter your password').fill('DFP-UAT-invalid-password-2026');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/Incorrect email or password|Invalid login credentials|Sign-in failed/i)).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/staff\/login/);
  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@public A11Y-KEYBOARD-SMOKE contact form', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'accessibility smoke runs once on Chromium');
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto('/contact', { waitUntil: 'domcontentloaded' });

  const name = page.getByLabel('Full Name *');
  const email = page.getByLabel('Email Address *');
  await expect(name).toBeVisible();
  await expect(email).toBeVisible();

  await page.keyboard.press('Tab');
  const activeTag = await page.evaluate(() => document.activeElement?.tagName || '');
  expect(activeTag, 'Tab should move focus to an interactive element').not.toBe('BODY');

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});
