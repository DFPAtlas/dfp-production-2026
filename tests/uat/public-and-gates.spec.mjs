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
const crossBrowserRoutes = ['/', '/contact', '/login'];

async function dismissCookieConsent(page) {
  const reject = page.getByRole('button', { name: 'Reject Non-Essential' });
  try {
    await reject.waitFor({ state: 'visible', timeout: 4_000 });
    await reject.click();
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeHidden({ timeout: 5_000 });
  } catch {
    // The consent dialog is not shown when a prior preference already exists.
  }
}

for (const route of publicRoutes) {
  test(`@public PUBLIC-LOAD ${route}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'full public route sweep runs once on desktop Chromium');
    const diagnostics = collectBrowserDiagnostics(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `no navigation response for ${route}`).not.toBeNull();
    expect(response.status(), `${route} should exist and load without HTTP error`).toBeLessThan(400);
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
    await attachDiagnostics(testInfo, diagnostics);
    expectCriticalBrowserClean(diagnostics);
  });
}

for (const route of crossBrowserRoutes) {
  test(`@public CROSS-BROWSER-SANITY ${route}`, async ({ page }, testInfo) => {
    test.skip(!['firefox-desktop', 'webkit-desktop'].includes(testInfo.project.name), 'cross-browser sanity is Firefox/WebKit only');
    const diagnostics = collectBrowserDiagnostics(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status(), `${route} should load in ${testInfo.project.name}`).toBeLessThan(400);
    await page.waitForTimeout(500);
    await attachDiagnostics(testInfo, diagnostics);
    expectCriticalBrowserClean(diagnostics);
  });
}

for (const [name, route, loginUrl] of [
  ['portal', '/portal/dashboard', /\/portal\/login(?:\?|$)/],
  ['staff', '/staff/dashboard', /\/staff\/login(?:\?|$)/],
  ['admin', '/admin', /\/admin\/login(?:\?|$)/],
  ['tester', '/uat/dashboard', /\/(login|uat\/login)(?:\?|$)/],
]) {
  test(`@public AUTH-PROTECTED-ROUTE-DENY ${name}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'protected-route gates run once on desktop Chromium');
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect.poll(async () => {
      if (loginUrl.test(page.url())) return true;
      return page.getByRole('heading', { name: 'Access Denied' }).isVisible().catch(() => false);
    }, {
      message: `${name} protected route should redirect to login or render an access-denied gate`,
      timeout: 20_000,
    }).toBe(true);

    if (!loginUrl.test(page.url())) {
      await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
      await expect(page.getByText(/unauthenticated|No active session found/i)).toBeVisible();
    }

    await attachDiagnostics(testInfo, diagnostics);
    expectCriticalBrowserClean(diagnostics);
  });
}

for (const route of responsiveRoutes) {
  test(`@public RESPONSIVE-NO-OVERFLOW ${route}`, async ({ page }, testInfo) => {
    test.skip(!['chromium-desktop', 'chromium-tablet', 'chromium-mobile'].includes(testInfo.project.name), 'responsive matrix uses Chromium at the three required viewports');
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
  await dismissCookieConsent(page);
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
  await dismissCookieConsent(page);

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
