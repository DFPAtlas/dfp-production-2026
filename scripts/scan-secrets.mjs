import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'out', 'dist', 'build',
  'coverage', 'test-results', 'playwright-report', '.vercel'
]);
const SKIP_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.json', '.md',
  '.yml', '.yaml', '.toml', '.html', '.css', '.sql', '.sh', '.txt',
  '.env', '.example', '.mts', '.cts'
]);

const SECRET_PATTERNS = [
  { name: 'Stripe live secret key', re: /\bsk_live_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe test secret key', re: /\bsk_test_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe restricted key', re: /\brk_(?:live|test)_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Stripe webhook secret', re: /\bwhsec_[0-9a-zA-Z]{16,}\b/g },
  { name: 'Resend API key', re: /\bre_[0-9a-zA-Z]{24,}\b/g },
  { name: 'GitHub token', re: /\bgh[pousr]_[0-9A-Za-z]{20,}\b/g },
  { name: 'Supabase service-role JWT', re: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g },
];

const PUBLIC_SECRET_NAMES = [
  'NEXT_PUBLIC_SERVICE_ROLE',
  'NEXT_PUBLIC_STRIPE_SECRET',
  'NEXT_PUBLIC_STRIPE_WEBHOOK',
  'NEXT_PUBLIC_RESEND',
  'NEXT_PUBLIC_UAT_WORKER_TOKEN',
  'NEXT_PUBLIC_N8N',
  'NEXT_PUBLIC_PBX',
  'NEXT_PUBLIC_TWILIO',
  'NEXT_PUBLIC_WEBHOOK_SECRET',
];

const BROWSER_DIRS = new Set(['app', 'components', 'lib', 'hooks', 'pages']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out.push(...walk(full));
      continue;
    }

    if (stat.isFile()) out.push(full);
  }
  return out;
}

function isText(file) {
  const base = file.split(/[\\/]/).pop() || '';
  if (SKIP_FILES.has(base)) return false;
  if (base.startsWith('.env')) return true;
  return TEXT_EXTENSIONS.has(extname(file));
}

function isBrowserCode(rel) {
  return BROWSER_DIRS.has(rel.split(/[\\/]/)[0]);
}

function redact(value) {
  if (value.length <= 10) return '[redacted]';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

const findings = [];
let scanned = 0;

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (!isText(file)) continue;

  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  scanned += 1;

  for (const { name, re } of SECRET_PATTERNS) {
    const matches = content.match(re) || [];
    for (const value of matches) {
      // Public Supabase anon JWTs are publishable by design. Only flag JWTs
      // when the surrounding text identifies them as service-role credentials.
      if (name === 'Supabase service-role JWT') {
        const idx = content.indexOf(value);
        const context = content.slice(Math.max(0, idx - 160), idx + value.length + 160);
        if (!/service[_ -]?role/i.test(context)) continue;
      }
      findings.push({ type: 'credential_value', name, file: rel, value: redact(value) });
    }
  }

  if (isBrowserCode(rel)) {
    for (const name of PUBLIC_SECRET_NAMES) {
      if (content.includes(name)) {
        findings.push({ type: 'browser_secret_exposure', name, file: rel });
      }
    }
  }
}

console.log(`Secret scan complete: ${scanned} text files scanned.`);

if (findings.length === 0) {
  console.log('SECRET SCAN: PASS');
  process.exit(0);
}

console.error(`SECRET SCAN: FAIL — ${findings.length} finding(s)`);
for (const finding of findings) {
  if (finding.type === 'credential_value') {
    console.error(`  [credential] ${finding.file}: ${finding.name} = ${finding.value}`);
  } else {
    console.error(`  [browser exposure] ${finding.file}: ${finding.name}`);
  }
}
process.exit(1);
