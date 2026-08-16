import { appendFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DFP_UAT_SUPABASE_URL;
const anonKey = process.env.DFP_UAT_SUPABASE_ANON_KEY;
const runId = process.env.GITHUB_RUN_ID || process.env.DFP_UAT_RUN_ID || String(Date.now());
const githubEnv = process.env.GITHUB_ENV;

if (!supabaseUrl || !anonKey || !githubEnv) {
  throw new Error('DFP_UAT_SUPABASE_URL, DFP_UAT_SUPABASE_ANON_KEY and GITHUB_ENV are required');
}

const roles = [
  ['CLIENT_A', 'client-a'],
  ['CLIENT_B', 'client-b'],
  ['STAFF', 'staff'],
  ['ADMIN', 'admin'],
  ['TESTER_A', 'tester-a'],
  ['TESTER_B', 'tester-b'],
];

const accounts = {};

async function exportEnv(name, value) {
  await appendFile(githubEnv, `${name}=${value}\n`, 'utf8');
}

for (const [envRole, slug] of roles) {
  const email = `dfp-uat-${runId}-${slug}@example.com`;
  const password = `${randomBytes(24).toString('base64url')}Aa1!`;
  console.log(`::add-mask::${password}`);

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        dfp_uat: true,
        dfp_uat_run_id: runId,
        dfp_uat_role: slug,
      },
    },
  });

  if (error || !data.user) {
    throw new Error(`Temporary Auth signup failed for ${slug}: ${error?.message || 'no user returned'}`);
  }
  if (!data.session) {
    throw new Error(`Temporary Auth signup for ${slug} returned no session. Email confirmation is enabled; use the supported Auth Admin API path instead.`);
  }

  accounts[envRole] = { email, password, userId: data.user.id, client };
  await exportEnv(`DFP_UAT_${envRole}_EMAIL`, email);
  await exportEnv(`DFP_UAT_${envRole}_PASSWORD`, password);
  await new Promise((resolve) => setTimeout(resolve, 750));
}

const ids = {
  CLIENT_A_ID: randomUUID(),
  CLIENT_B_ID: randomUUID(),
  CLIENT_A_PROJECT_ID: randomUUID(),
  CLIENT_B_PROJECT_ID: randomUUID(),
  CLIENT_A_INVOICE_ID: randomUUID(),
  CLIENT_B_INVOICE_ID: randomUUID(),
  CLIENT_A_FILE_ID: randomUUID(),
  CLIENT_B_FILE_ID: randomUUID(),
  TESTER_A_ID: randomUUID(),
  TESTER_B_ID: randomUUID(),
  UAT_PROJECT_ID: randomUUID(),
  UAT_JOB_ID: randomUUID(),
  TESTER_A_ASSIGNMENT_ID: randomUUID(),
  TESTER_B_ASSIGNMENT_ID: randomUUID(),
};

await exportEnv('DFP_UAT_RUN_ID', runId);
await exportEnv('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES', 'true');
for (const [name, value] of Object.entries(ids)) {
  await exportEnv(`DFP_UAT_${name}`, value);
}

const manifest = {
  runId,
  accounts: Object.fromEntries(Object.entries(accounts).map(([role, value]) => [role, {
    email: value.email,
    userId: value.userId,
  }])),
  ids,
};

console.log('DFP_UAT_SAFE_MANIFEST=' + JSON.stringify(manifest));
console.log('Waiting for matching DFP-UAT database fixture rows...');

async function rowVisible(client, table, id) {
  const { data, error } = await client.from(table).select('id').eq('id', id);
  return !error && Array.isArray(data) && data.length === 1;
}

const deadline = Date.now() + 12 * 60 * 1000;
while (Date.now() < deadline) {
  const ready = await Promise.all([
    rowVisible(accounts.CLIENT_A.client, 'projects', ids.CLIENT_A_PROJECT_ID),
    rowVisible(accounts.CLIENT_B.client, 'projects', ids.CLIENT_B_PROJECT_ID),
    rowVisible(accounts.STAFF.client, 'staff_profiles', accounts.STAFF.userId),
    rowVisible(accounts.ADMIN.client, 'admin_profiles', accounts.ADMIN.userId),
    rowVisible(accounts.TESTER_A.client, 'uat_assignments', ids.TESTER_A_ASSIGNMENT_ID),
    rowVisible(accounts.TESTER_B.client, 'uat_assignments', ids.TESTER_B_ASSIGNMENT_ID),
  ]);

  if (ready.every(Boolean)) {
    console.log('DFP-UAT fixture readiness PASS');
    process.exit(0);
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
}

throw new Error('Timed out waiting for DFP-UAT database fixture rows');
