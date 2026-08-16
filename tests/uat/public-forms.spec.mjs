import { test, expect } from '@playwright/test';
import {
  attachDiagnostics,
  collectBrowserDiagnostics,
  env,
  expectCriticalBrowserClean,
} from './helpers.mjs';

function chromiumOnly(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'form mutation tests run once on Chromium desktop');
}

function uniqueEmail(label) {
  const runId = env('DFP_UAT_RUN_ID');
  return `dfp-browser-uat+${runId}-${Date.now()}-${label}@example.com`;
}

async function waitForInsert(page, table) {
  return page.waitForResponse((response) => {
    if (!response.url().includes(`/rest/v1/${table}`)) return false;
    if (response.request().method() !== 'POST') return false;
    return response.status() >= 200 && response.status() < 300;
  }, { timeout: 20_000 });
}

test('@full CONTACT-SUBMIT', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  expect(env('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES')).toBe('true');
  const diagnostics = collectBrowserDiagnostics(page);
  const email = uniqueEmail('contact');

  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Full Name *').fill('DFP Browser UAT');
  await page.getByLabel('Email Address *').fill(email);
  await page.getByLabel('Company').fill('DFP Browser UAT Fixture');
  await page.getByLabel('Tell us about your project *').fill('Automated DFP Blocker 06 browser UAT submission. Please ignore.');

  const inserted = waitForInsert(page, 'leads');
  await page.getByRole('button', { name: /Send Message/i }).click();
  await inserted;
  await expect(page.getByRole('heading', { name: /Thank You!/i })).toBeVisible({ timeout: 15_000 });

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full SUPPORT-SUBMIT', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  expect(env('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES')).toBe('true');
  const diagnostics = collectBrowserDiagnostics(page);
  const email = uniqueEmail('support');

  await page.goto('/support/request', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="name"]').fill('DFP Browser UAT');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="organisation"]').fill('DFP Browser UAT Fixture');
  await page.locator('select[name="category"]').selectOption('general');
  await page.locator('select[name="urgency"]').selectOption('general');
  await page.locator('input[name="subject"]').fill('DFP Blocker 06 automated support UAT');
  await page.locator('textarea[name="description"]').fill('Automated browser UAT submission. Please ignore.');

  const inserted = waitForInsert(page, 'digital_footprint_support');
  await page.locator('form button[type="submit"]').click();
  await inserted;
  await expect(page.getByRole('heading', { name: /Request Submitted/i })).toBeVisible({ timeout: 15_000 });

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});

test('@full PARTNER-SUBMIT', async ({ page }, testInfo) => {
  chromiumOnly(testInfo);
  expect(env('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES')).toBe('true');
  const diagnostics = collectBrowserDiagnostics(page);
  const email = uniqueEmail('partner');

  await page.goto('/partners/apply', { waitUntil: 'domcontentloaded' });
  const typeSelect = page.locator('select[name="application_type"]');
  const typeValues = await typeSelect.locator('option').evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
  expect(typeValues.length, 'partner application type options').toBeGreaterThan(0);
  await typeSelect.selectOption(typeValues[0]);

  await page.locator('input[name="company_name"]').fill('DFP Browser UAT Fixture');
  await page.locator('input[name="applicant_name"]').fill('DFP Browser UAT');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('select[name="proposed_relationship"]').selectOption({ index: 1 });
  await page.locator('textarea[name="experience_summary"]').fill('Automated DFP Blocker 06 browser UAT submission. Please ignore.');
  await page.locator('input[name="privacy_acknowledged"]').check();

  const inserted = waitForInsert(page, 'partner_applications');
  await page.locator('form button[type="submit"]').click();
  await inserted;
  await expect(page.getByRole('heading', { name: /Application Submitted/i })).toBeVisible({ timeout: 15_000 });

  await attachDiagnostics(testInfo, diagnostics);
  expectCriticalBrowserClean(diagnostics);
});
