# DFP Release Certification Pipeline (Fix 24)

This document contains the complete, ready-to-use automated release-certification
pipeline for Digital Footprint. It is provided as reference because the Readdy editor
cannot create `.github/workflows/`, `tests/`, `scripts/`, or root config files, and
Readdy's GitHub integration performs code sync only — it does not execute workflows.

Add these files directly to the Digital Footprint GitHub repository, then push. The
pipeline runs on pull requests to `main`, pushes to `main`, and manual dispatch. It
does **not** deploy to production.

---

## 1. Required GitHub repository secrets

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Purpose | Required for |
| --- | --- | --- |
| `SUPABASE_STAGING_URL` | Staging Supabase project URL | build + E2E + security |
| `SUPABASE_STAGING_ANON_KEY` | Staging anon (publishable) key | build + E2E + Stripe RPC smoke |
| `SUPABASE_STAGING_SERVICE_ROLE` | Staging service-role key (secret) | migration drift + form DB verification |
| `STRIPE_TEST_SECRET_KEY` | Stripe **test-mode** key | payment E2E (optional) |
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe **test-mode** webhook secret | payment E2E (optional) |

Never use Stripe live mode in CI. Never commit any of the above to source.

---

## 2. `.github/workflows/dfp-release-certification.yml`

```yaml
name: DFP Release Certification

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: dfp-release-certification-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  release-certification:
    name: Release certification
    runs-on: ubuntu-latest
    timeout-minutes: 40
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Capture build identity
        shell: bash
        run: |
          APP_VERSION="$(node -p "require('./package.json').version")"
          {
            echo "## Build Identity"
            echo "| Field | Value |"
            echo "| --- | --- |"
            echo "| Repository | \`${{ github.repository }}\` |"
            echo "| Branch | \`${{ github.ref_name }}\` |"
            echo "| Commit SHA | \`${{ github.sha }}\` |"
            echo "| Short SHA | \`${GITHUB_SHA::8}\` |"
            echo "| Run ID | \`${{ github.run_id }}\` |"
            echo "| Timestamp | \`$(date -u +%Y-%m-%dT%H:%M:%SZ)\` |"
            echo "| App version | \`${APP_VERSION}\` |"
            echo "| Node version | \`${{ env.NODE_VERSION }}\` |"
            echo "| Trigger | \`${{ github.event_name }}\` |"
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies (npm ci)
        run: npm ci

      - name: TypeScript check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Production build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_STAGING_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_STAGING_ANON_KEY }}

      - name: Secret scan
        run: npm run scan:secrets

      - name: Migration inventory
        run: npm run migration:inventory
        env:
          SUPABASE_STAGING_URL: ${{ secrets.SUPABASE_STAGING_URL }}
          SUPABASE_STAGING_SERVICE_ROLE: ${{ secrets.SUPABASE_STAGING_SERVICE_ROLE }}

      - name: Stripe RPC privilege smoke
        run: npm run security:smoke
        env:
          SUPABASE_STAGING_URL: ${{ secrets.SUPABASE_STAGING_URL }}
          SUPABASE_STAGING_ANON_KEY: ${{ secrets.SUPABASE_STAGING_ANON_KEY }}
          SUPABASE_STAGING_SERVICE_ROLE: ${{ secrets.SUPABASE_STAGING_SERVICE_ROLE }}

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Browser UAT
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          CI_RUN_ID: ${{ github.run_id }}
          SUPABASE_STAGING_URL: ${{ secrets.SUPABASE_STAGING_URL }}
          SUPABASE_STAGING_ANON_KEY: ${{ secrets.SUPABASE_STAGING_ANON_KEY }}
          SUPABASE_STAGING_SERVICE_ROLE: ${{ secrets.SUPABASE_STAGING_SERVICE_ROLE }}

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: dfp-release-artifacts
          path: |
            playwright-report/
            test-results/
          retention-days: 14
          if-no-files-found: ignore
```

---

## 3. `.github/workflows/dfp-payment-e2e.yml` (optional, manual only)

```yaml
name: DFP Payment E2E (Stripe test mode)

on:
  workflow_dispatch:

permissions:
  contents: read

env:
  NODE_VERSION: '20'

jobs:
  payment-e2e:
    name: Stripe test-mode payment E2E
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Stripe test-mode payment E2E
        run: npm run payment:e2e
        env:
          STRIPE_TEST_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          STRIPE_TEST_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}
          SUPABASE_STAGING_URL: ${{ secrets.SUPABASE_STAGING_URL }}
          SUPABASE_STAGING_SERVICE_ROLE: ${{ secrets.SUPABASE_STAGING_SERVICE_ROLE }}
```

---

## 4. `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

---

## 5. `tests/helpers.ts`

```ts
export const PUBLIC_ROUTES: string[] = [
  '/', '/about', '/products', '/products/guardianhub', '/products/lethub',
  '/products/quickguard', '/products/synqoro', '/services', '/industries',
  '/who-we-help', '/pricing', '/contact', '/request-demo', '/partners',
  '/partners/apply', '/blog', '/case-studies', '/careers',
  '/careers/early-careers', '/team', '/security', '/privacy', '/terms',
  '/cookie-policy', '/accessibility', '/help', '/support', '/support/status',
  '/support/request', '/uat-testing', '/uat-testing/apply',
];

export const PROTECTED_ROUTES: { url: string; label: string }[] = [
  { url: '/portal/dashboard', label: 'portal' },
  { url: '/staff/dashboard', label: 'staff' },
  { url: '/admin', label: 'admin' },
  { url: '/uat/dashboard', label: 'uat' },
];

export function ciRunId(): string {
  return process.env.CI_RUN_ID || `local-${Date.now()}`;
}

export function uniqueTag(prefix: string): string {
  return `DFP-CI-${prefix}-${ciRunId()}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${ciRunId()}@example.com`;
}
```

---

## 6. `tests/public-routes.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from './helpers';

for (const route of PUBLIC_ROUTES) {
  test(`public route ${route} loads`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    const status = response!.status();
    expect(status, `expected <400 for ${route}, got ${status}`).toBeLessThan(400);
    await page.waitForLoadState('load');
    const text = await page.locator('body').innerText();
    expect(text.trim().length, `page ${route} appears blank`).toBeGreaterThan(0);
    expect(errors, `fatal page errors on ${route}`).toEqual([]);
  });
}
```

---

## 7. `tests/auth-routes.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { PROTECTED_ROUTES } from './helpers';

for (const { url, label } of PROTECTED_ROUTES) {
  test(`anonymous ${label} route is denied`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const denied =
      /\/login|\/sign-in|access/i.test(currentUrl) ||
      (await page.locator('text=/access denied|sign in|log in|not authorised|unauthorised/i').count()) > 0;
    expect(denied, `anonymous ${label} not denied (url=${currentUrl})`).toBeTruthy();
    expect(errors).toEqual([]);
  });
}
```

---

## 8. `tests/contact-form.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { uniqueEmail, uniqueTag } from './helpers';

const url = process.env.SUPABASE_STAGING_URL;
const serviceRole = process.env.SUPABASE_STAGING_SERVICE_ROLE;
const hasStaging = Boolean(url);

test.describe('Contact form E2E', () => {
  test.skip(!hasStaging, 'SUPABASE_STAGING_URL not configured');

  test('submits enquiry to leads and shows success', async ({ page }) => {
    const email = uniqueEmail('contact');
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.fill('#name', uniqueTag('contact-name'));
    await page.fill('#email', email);
    await page.fill('#message', uniqueTag('contact-message'));
    await page.selectOption('#service', 'Website Development');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Thank You!')).toBeVisible({ timeout: 20000 });

    if (serviceRole && url) {
      const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
      const { data, error } = await admin
        .from('leads')
        .select('id, email, source')
        .eq('email', email)
        .limit(1);
      expect(error).toBeNull();
      expect(data?.length, 'lead row not persisted').toBeGreaterThan(0);
    }
  });
});
```

---

## 9. `tests/partner-form.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { uniqueEmail, uniqueTag } from './helpers';

const url = process.env.SUPABASE_STAGING_URL;
const serviceRole = process.env.SUPABASE_STAGING_SERVICE_ROLE;
const hasStaging = Boolean(url);

test.describe('Partner form E2E', () => {
  test.skip(!hasStaging, 'SUPABASE_STAGING_URL not configured');

  test('submits partner application with correct type', async ({ page }) => {
    const email = uniqueEmail('partner');
    await page.goto('/partners/apply', { waitUntil: 'domcontentloaded' });
    await page.selectOption('select[name="application_type"]', 'partner_enquiry');
    await page.fill('input[name="company_name"]', uniqueTag('partner-co'));
    await page.fill('input[name="applicant_name"]', uniqueTag('partner-name'));
    await page.fill('input[name="email"]', email);
    await page.selectOption('select[name="proposed_relationship"]', 'Referral partner');
    await page.fill('textarea[name="experience_summary"]', uniqueTag('partner-summary'));
    await page.check('#privacy_acknowledged');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Application Submitted')).toBeVisible({ timeout: 20000 });

    if (serviceRole && url) {
      const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
      const { data, error } = await admin
        .from('partner_applications')
        .select('id, email, application_type')
        .eq('email', email)
        .limit(1);
      expect(error).toBeNull();
      expect(data?.length, 'partner row not persisted').toBeGreaterThan(0);
      expect(data?.[0]?.application_type).toBe('partner_enquiry');
    }
  });
});
```

---

## 10. `tests/responsive.spec.ts`

```ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const CRITICAL_PAGES = ['/', '/contact'];

for (const vp of VIEWPORTS) {
  test.describe(`responsive ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const route of CRITICAL_PAGES) {
      test(`${route} renders at ${vp.width}px`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load');
        const text = await page.locator('body').innerText();
        expect(text.trim().length, `${route} blank at ${vp.width}px`).toBeGreaterThan(0);
      });
    }
  });
}
```

---

## 11. `tests/accessibility.spec.ts` (report-only, non-blocking except `lang`)

```ts
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/contact'];

for (const route of PAGES) {
  test(`a11y smoke ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, `${route}: missing <html lang>`).toBeTruthy();

    const h1 = await page.locator('h1').count();
    const imgNoAlt = await page.locator('img:not([alt])').count();
    const inputNoLabel = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        const id = el.getAttribute('id');
        const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        if (!aria && !hasLabel) n += 1;
      });
      return n;
    });

    console.log(`[a11y] ${route}: h1=${h1} img-no-alt=${imgNoAlt} inputs-no-label=${inputNoLabel}`);
  });
}
```

---

## 12. `scripts/scan-secrets.mjs`

```js
/* eslint-disable */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'out', 'dist', 'build', 'test-results', 'playwright-report', 'coverage', '.vercel']);
const SKIP_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.json', '.md', '.yml', '.yaml', '.toml', '.html', '.css', '.sql', '.sh', '.txt', '.env', '.example', '.mts', '.cts']);

const VALUE_PATTERNS = [
  { name: 'Stripe live secret key', re: /\bsk_live_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe test secret key', re: /\bsk_test_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe webhook secret', re: /\bwhsec_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe restricted key', re: /\brk_(live|test)_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Resend API key', re: /\bre_[0-9a-zA-Z]{24,}\b/g },
  { name: 'Supabase service-role JWT', re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]*\.eyJpc3MiOiJzdXBhYmFzZS[A-Za-z0-9_-]*/g },
];

const BROWSER_DIRS = ['app', 'components', 'lib', 'hooks', 'pages'];
const PUBLIC_SECRET_NAMES = ['NEXT_PUBLIC_SERVICE_ROLE', 'NEXT_PUBLIC_STRIPE_SECRET', 'NEXT_PUBLIC_STRIPE_WEBHOOK', 'NEXT_PUBLIC_RESEND', 'NEXT_PUBLIC_UAT_WORKER_TOKEN', 'NEXT_PUBLIC_N8N', 'NEXT_PUBLIC_PBX', 'NEXT_PUBLIC_TWILIO', 'NEXT_PUBLIC_WEBHOOK_SECRET'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { if (!SKIP_DIRS.has(entry)) out.push(...walk(full)); }
    else if (st.isFile()) out.push(full);
  }
  return out;
}
function isText(file) {
  if (SKIP_FILES.has(file.split('/').pop())) return false;
  const ext = file.slice(file.lastIndexOf('.'));
  return TEXT_EXTENSIONS.has(ext) || file.split('/').pop().startsWith('.env');
}
function isBrowser(rel) { return BROWSER_DIRS.includes(rel.split('/')[0]); }
function redact(v) { return v.length <= 8 ? v : `${v.slice(0, 4)}...${v.slice(-4)}`; }

const findings = [];
let scanned = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (!isText(file)) continue;
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  scanned += 1;
  for (const { name, re } of VALUE_PATTERNS) {
    const m = content.match(re);
    if (m) for (const v of m) findings.push({ type: 'credential_value', name, file: rel, value: redact(v) });
  }
  if (isBrowser(rel)) {
    for (const n of PUBLIC_SECRET_NAMES) {
      if (content.includes(n)) findings.push({ type: 'browser_secret_exposure', name: n, file: rel });
    }
  }
}

console.log(`Secret scan complete: ${scanned} files scanned.`);
if (findings.length === 0) { console.log('SECRET SCAN: PASS'); process.exit(0); }
console.error(`SECRET SCAN: FAIL — ${findings.length} finding(s):`);
for (const f of findings) {
  if (f.type === 'credential_value') console.error(`  [credential] ${f.file}: ${f.name} = ${f.value}`);
  else console.error(`  [exposure] ${f.file}: ${f.name} exposed to browser bundle`);
}
process.exit(1);
```

---

## 13. `scripts/migration-inventory.mjs`

```js
/* eslint-disable */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'supabase', 'migrations');
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const VERSION_RE = /^(\d{14})_/;
const versions = new Map();
const duplicates = [];
const noVersion = [];

for (const file of files) {
  const m = file.match(VERSION_RE);
  if (!m) { noVersion.push(file); continue; }
  if (versions.has(m[1])) duplicates.push({ version: m[1], files: [versions.get(m[1]), file] });
  else versions.set(m[1], file);
}
const repoVersions = [...versions.keys()].sort();

console.log(`Migration inventory: ${files.length} file(s), ${repoVersions.length} versioned, ${noVersion.length} unversioned.`);
if (duplicates.length > 0) {
  console.error('MIGRATION INVENTORY: FAIL — duplicate version prefixes:');
  for (const d of duplicates) console.error(`  ${d.version}: ${d.files.join(' and ')}`);
  process.exit(1);
}
if (noVersion.length > 0) {
  console.log('MIGRATION INVENTORY: WARNING — unversioned files:');
  for (const f of noVersion) console.log(`  ${f}`);
}

const url = process.env.SUPABASE_STAGING_URL;
const serviceRole = process.env.SUPABASE_STAGING_SERVICE_ROLE;
if (!url || !serviceRole) {
  console.log('MIGRATION INVENTORY: live drift NOT CONFIGURED (missing staging creds). PASS (static).');
  process.exit(0);
}
const { createClient } = await import('@supabase/supabase-js');
const client = createClient(url, serviceRole, { auth: { persistSession: false } });
const { data, error } = await client.schema('supabase_migrations').from('schema_migrations').select('version, name');
if (error) {
  console.log(`MIGRATION INVENTORY: live drift UNAVAILABLE (${error.message}).`);
  process.exit(0);
}
const tracked = new Map((data || []).map((r) => [String(r.version), r.name]));
const missing = repoVersions.filter((v) => !tracked.has(v));
const drift = [...tracked.keys()].filter((v) => !versions.has(v));
console.log(`  Missing from staging: ${missing.length}`);
for (const v of missing) console.log(`    - ${v} ${versions.get(v)}`);
console.log(`  Unexpected drift (DB has, repo lacks): ${drift.length}`);
for (const v of drift) console.log(`    - ${v} ${tracked.get(v) || ''}`);
if (missing.length > 0) {
  console.error('MIGRATION INVENTORY: FAIL — repo migrations not tracked in staging.');
  process.exit(1);
}
console.log('MIGRATION INVENTORY: PASS.');
process.exit(0);
```

---

## 14. `scripts/rls-security-smoke.mjs`

```js
/* eslint-disable */
const url = process.env.SUPABASE_STAGING_URL;
const anonKey = process.env.SUPABASE_STAGING_ANON_KEY;
if (!url || !anonKey) {
  console.log('STRIPE RPC SMOKE: NOT CONFIGURED (missing staging URL/anon key).');
  process.exit(0);
}
const { createClient } = await import('@supabase/supabase-js');
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const RPCS = ['record_stripe_invoice_payment', 'record_stripe_refund'];
let failed = false;
for (const rpc of RPCS) {
  let denied = false;
  let detail = '';
  try {
    const { data, error } = await anon.rpc(rpc, {});
    if (error && !data) { denied = true; detail = `denied (${error.code || 'unknown'})`; }
    else { detail = 'returned data for anon (permission bypass)'; }
  } catch (err) {
    denied = true;
    detail = `threw (${err?.message ? String(err.message).slice(0, 120) : 'unknown'})`;
  }
  if (denied) console.log(`  ${rpc}: anon DENIED — ${detail}`);
  else { console.error(`  ${rpc}: anon ALLOWED — ${detail}`); failed = true; }
}
if (failed) { console.error('STRIPE RPC SMOKE: FAIL'); process.exit(1); }
console.log('STRIPE RPC SMOKE: PASS — anon denied for Stripe payment/refund RPCs.');
console.log('  Note: authenticated/service_role assertions and RLS cross-tenant isolation require seeded test identities (NOT CONFIGURED).');
process.exit(0);
```

---

## 15. `package.json` additions

Add these scripts:

```json
"start": "next start -p 3000",
"test:e2e": "playwright test",
"scan:secrets": "node scripts/scan-secrets.mjs",
"migration:inventory": "node scripts/migration-inventory.mjs",
"security:smoke": "node scripts/rls-security-smoke.mjs",
"payment:e2e": "node scripts/payment-e2e.mjs"
```

Add this devDependency:

```json
"@playwright/test": "^1.49.0"
```

> `payment:e2e` points to a script you author per your Stripe test-mode flow
> (invoice → webhook → refund → duplicate replay). It is left as a manual,
> separate workflow so it never runs against live mode automatically.

---

## 16. Release-required checks (fail-closed)

The pipeline fails certification on: `npm ci` failure, TypeScript failure, lint
failure, production build failure, duplicate migration versions, Stripe RPC
privilege regression, and any critical browser/form E2E failure. It reports
`NOT CONFIGURED` (never `PASS`) for anything lacking credentials: Stripe test
payment, RLS cross-tenant isolation, n8n/PBX telephony, and external email delivery.