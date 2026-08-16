import { appendFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DFP_UAT_SUPABASE_URL;
const anonKey = process.env.DFP_UAT_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.DFP_UAT_SUPABASE_SERVICE_ROLE_KEY;
const runId = process.env.GITHUB_RUN_ID || process.env.DFP_UAT_RUN_ID || String(Date.now());
const githubEnv = process.env.GITHUB_ENV;

if (!supabaseUrl || !anonKey || !serviceRoleKey || !githubEnv) {
  throw new Error('Supabase URL, publishable key, service-role secret and GITHUB_ENV are required');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const ids = {
  CLIENT_A_ID: randomUUID(),
  CLIENT_B_ID: randomUUID(),
  CLIENT_A_PROJECT_ID: randomUUID(),
  CLIENT_B_PROJECT_ID: randomUUID(),
  CLIENT_A_INVOICE_ID: randomUUID(),
  CLIENT_B_INVOICE_ID: randomUUID(),
  CLIENT_A_FILE_ID: randomUUID(),
  CLIENT_B_FILE_ID: randomUUID(),
  CLIENT_A_SUPPORT_ID: randomUUID(),
  CLIENT_B_SUPPORT_ID: randomUUID(),
  CLIENT_A_MESSAGE_THREAD_ID: randomUUID(),
  CLIENT_B_MESSAGE_THREAD_ID: randomUUID(),
  TESTER_A_ID: randomUUID(),
  TESTER_B_ID: randomUUID(),
  UAT_PROJECT_ID: randomUUID(),
  UAT_JOB_ID: randomUUID(),
  TESTER_A_ASSIGNMENT_ID: randomUUID(),
  TESTER_B_ASSIGNMENT_ID: randomUUID(),
};

async function exportEnv(name, value) {
  await appendFile(githubEnv, `${name}=${value}\n`, 'utf8');
}

await exportEnv('DFP_UAT_RUN_ID', runId);
await exportEnv('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES', 'true');
for (const [name, value] of Object.entries(ids)) await exportEnv(`DFP_UAT_${name}`, value);

const roles = [
  ['CLIENT_A', 'client-a'],
  ['CLIENT_B', 'client-b'],
  ['STAFF', 'staff'],
  ['ADMIN', 'admin'],
  ['TESTER_A', 'tester-a'],
  ['TESTER_B', 'tester-b'],
];

const accounts = {};

for (const [envRole, slug] of roles) {
  const email = `dfp-uat-${runId}-${slug}@example.com`;
  const password = `${randomBytes(24).toString('base64url')}Aa1!`;
  console.log(`::add-mask::${password}`);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      dfp_uat: true,
      dfp_uat_run_id: runId,
      dfp_uat_role: slug,
    },
  });

  if (error || !data.user) {
    throw new Error(`Admin Auth createUser failed for ${slug}: ${error?.message || 'no user returned'}`);
  }

  accounts[envRole] = { email, password, userId: data.user.id };
  await exportEnv(`DFP_UAT_${envRole}_EMAIL`, email);
  await exportEnv(`DFP_UAT_${envRole}_PASSWORD`, password);
}

async function insert(table, row) {
  const { error } = await admin.from(table).insert(row);
  if (error) throw new Error(`Could not create ${table} UAT fixture: ${error.message}`);
}

const marker = `DFP-UAT run ${runId}`;

for (const role of Object.keys(accounts)) {
  const account = accounts[role];
  const profileRole = role.startsWith('CLIENT') ? 'client' : role === 'STAFF' ? 'staff' : role === 'ADMIN' ? 'admin' : 'tester';
  const { error } = await admin.from('profiles').upsert({
    id: account.userId,
    auth_user_id: account.userId,
    email: account.email,
    full_name: `DFP UAT ${role.replaceAll('_', ' ')}`,
    role: profileRole,
    status: 'active',
    notes: marker,
  }, { onConflict: 'id' });
  if (error) throw new Error(`Could not upsert profiles UAT fixture for ${role}: ${error.message}`);
}

await insert('clients', [
  {
    id: ids.CLIENT_A_ID,
    user_id: accounts.CLIENT_A.userId,
    company_name: `DFP UAT Client A ${runId}`,
    contact_name: 'DFP UAT Client A',
    email: accounts.CLIENT_A.email,
    status: 'active',
    portal_access_state: 'active',
    notes: marker,
    client_reference: `DFP-UAT-${runId}-A`,
  },
  {
    id: ids.CLIENT_B_ID,
    user_id: accounts.CLIENT_B.userId,
    company_name: `DFP UAT Client B ${runId}`,
    contact_name: 'DFP UAT Client B',
    email: accounts.CLIENT_B.email,
    status: 'active',
    portal_access_state: 'active',
    notes: marker,
    client_reference: `DFP-UAT-${runId}-B`,
  },
]);

await insert('projects', [
  {
    id: ids.CLIENT_A_PROJECT_ID,
    client_id: ids.CLIENT_A_ID,
    name: `DFP UAT Project A ${runId}`,
    slug: `dfp-uat-${runId}-a`,
    status: 'active',
    description: marker,
    project_reference: `DFP-UAT-${runId}-PA`,
    client_visible: true,
  },
  {
    id: ids.CLIENT_B_PROJECT_ID,
    client_id: ids.CLIENT_B_ID,
    name: `DFP UAT Project B ${runId}`,
    slug: `dfp-uat-${runId}-b`,
    status: 'active',
    description: marker,
    project_reference: `DFP-UAT-${runId}-PB`,
    client_visible: true,
  },
]);

await insert('invoices', [
  {
    id: ids.CLIENT_A_INVOICE_ID,
    client_id: ids.CLIENT_A_ID,
    project_id: ids.CLIENT_A_PROJECT_ID,
    invoice_number: `DFP-UAT-${runId}-IA`,
    description: marker,
    amount: 1,
    status: 'draft',
    currency: 'GBP',
  },
  {
    id: ids.CLIENT_B_INVOICE_ID,
    client_id: ids.CLIENT_B_ID,
    project_id: ids.CLIENT_B_PROJECT_ID,
    invoice_number: `DFP-UAT-${runId}-IB`,
    description: marker,
    amount: 1,
    status: 'draft',
    currency: 'GBP',
  },
]);

await insert('project_files', [
  {
    id: ids.CLIENT_A_FILE_ID,
    project_id: ids.CLIENT_A_PROJECT_ID,
    uploaded_by: accounts.CLIENT_A.userId,
    file_name: `dfp-uat-${runId}-a.txt`,
    file_path: `dfp-uat/${runId}/a.txt`,
    visibility: 'client',
    category: 'general',
    description: marker,
  },
  {
    id: ids.CLIENT_B_FILE_ID,
    project_id: ids.CLIENT_B_PROJECT_ID,
    uploaded_by: accounts.CLIENT_B.userId,
    file_name: `dfp-uat-${runId}-b.txt`,
    file_path: `dfp-uat/${runId}/b.txt`,
    visibility: 'client',
    category: 'general',
    description: marker,
  },
]);

await insert('support_tickets', [
  {
    id: ids.CLIENT_A_SUPPORT_ID,
    ticket_reference: `DFP-UAT-${runId}-SA`,
    client_id: ids.CLIENT_A_ID,
    project_id: ids.CLIENT_A_PROJECT_ID,
    subject: `DFP UAT support A ${runId}`,
    description: marker,
    created_by: accounts.CLIENT_A.userId,
  },
  {
    id: ids.CLIENT_B_SUPPORT_ID,
    ticket_reference: `DFP-UAT-${runId}-SB`,
    client_id: ids.CLIENT_B_ID,
    project_id: ids.CLIENT_B_PROJECT_ID,
    subject: `DFP UAT support B ${runId}`,
    description: marker,
    created_by: accounts.CLIENT_B.userId,
  },
]);

await insert('message_threads', [
  {
    id: ids.CLIENT_A_MESSAGE_THREAD_ID,
    client_id: ids.CLIENT_A_ID,
    project_id: ids.CLIENT_A_PROJECT_ID,
    subject: `DFP UAT thread A ${runId}`,
    created_by: accounts.CLIENT_A.userId,
    client_visible: true,
  },
  {
    id: ids.CLIENT_B_MESSAGE_THREAD_ID,
    client_id: ids.CLIENT_B_ID,
    project_id: ids.CLIENT_B_PROJECT_ID,
    subject: `DFP UAT thread B ${runId}`,
    created_by: accounts.CLIENT_B.userId,
    client_visible: true,
  },
]);

await insert('staff_profiles', {
  id: accounts.STAFF.userId,
  email: accounts.STAFF.email,
  full_name: 'DFP UAT Staff',
  role: 'staff',
  active: true,
  status: 'active',
  reference: `DFP-UAT-${runId}-STAFF`,
});

await insert('admin_profiles', {
  id: accounts.ADMIN.userId,
  email: accounts.ADMIN.email,
  full_name: 'DFP UAT Admin',
  role: 'admin',
  active: true,
  status: 'active',
  reference: `DFP-UAT-${runId}-ADMIN`,
});

await insert('uat_testers', [
  {
    id: ids.TESTER_A_ID,
    user_id: accounts.TESTER_A.userId,
    full_name: 'DFP UAT Tester A',
    email: accounts.TESTER_A.email,
    is_over_18: true,
    devices: ['desktop'],
    browsers: ['chromium'],
    industries: ['uat'],
    availability: ['uat'],
    experience_level: 'beginner',
    status: 'approved',
    notes: marker,
    reference: `DFP-UAT-${runId}-TA`,
  },
  {
    id: ids.TESTER_B_ID,
    user_id: accounts.TESTER_B.userId,
    full_name: 'DFP UAT Tester B',
    email: accounts.TESTER_B.email,
    is_over_18: true,
    devices: ['desktop'],
    browsers: ['chromium'],
    industries: ['uat'],
    availability: ['uat'],
    experience_level: 'beginner',
    status: 'approved',
    notes: marker,
    reference: `DFP-UAT-${runId}-TB`,
  },
]);

await insert('uat_projects', {
  id: ids.UAT_PROJECT_ID,
  name: `DFP UAT Isolation ${runId}`,
  client_company: 'Digital Footprint UAT Fixture',
  description: marker,
  status: 'planning',
  reference: `DFP-UAT-${runId}-UP`,
  live_url: process.env.DFP_UAT_BASE_URL || 'https://digital-footprint.uk',
});

await insert('uat_jobs', {
  id: ids.UAT_JOB_ID,
  project_id: ids.UAT_PROJECT_ID,
  title: `DFP UAT Isolation Job ${runId}`,
  description: marker,
  status: 'draft',
  max_testers: 2,
  reference: `DFP-UAT-${runId}-UJ`,
});

await insert('uat_assignments', [
  {
    id: ids.TESTER_A_ASSIGNMENT_ID,
    job_id: ids.UAT_JOB_ID,
    tester_id: ids.TESTER_A_ID,
    status: 'assigned',
    agreed_pay: 0,
    internal_notes: marker,
  },
  {
    id: ids.TESTER_B_ASSIGNMENT_ID,
    job_id: ids.UAT_JOB_ID,
    tester_id: ids.TESTER_B_ID,
    status: 'assigned',
    agreed_pay: 0,
    internal_notes: marker,
  },
]);

console.log('DFP_UAT_SAFE_MANIFEST=' + JSON.stringify({
  runId,
  users: Object.fromEntries(Object.entries(accounts).map(([role, value]) => [role, value.userId])),
  ids,
}));
console.log('DFP-UAT disposable fixture creation PASS');
