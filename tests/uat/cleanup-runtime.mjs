import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.DFP_UAT_SUPABASE_URL;
const serviceRoleKey = process.env.DFP_UAT_SUPABASE_SERVICE_ROLE_KEY;
const runId = process.env.DFP_UAT_RUN_ID || process.env.GITHUB_RUN_ID;

if (!supabaseUrl || !serviceRoleKey || !runId) {
  throw new Error('Supabase URL, service-role secret and UAT run ID are required for cleanup');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const env = (name) => process.env[`DFP_UAT_${name}`]?.trim() || '';

async function deleteBy(table, column, value) {
  if (!value) return;
  const { error } = await admin.from(table).delete().eq(column, value);
  if (error) throw new Error(`Cleanup failed for ${table}.${column}: ${error.message}`);
}

async function deleteLike(table, column, pattern) {
  const { error } = await admin.from(table).delete().like(column, pattern);
  if (error) throw new Error(`Cleanup failed for ${table}.${column} LIKE ${pattern}: ${error.message}`);
}

const cleanupErrors = [];
async function safe(label, action) {
  try {
    await action();
  } catch (error) {
    cleanupErrors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Browser-created public-form rows are tagged with the run id in the email.
const formEmailPattern = `dfp-browser-uat+${runId}-%@example.com`;
await safe('partner applications', () => deleteLike('partner_applications', 'email', formEmailPattern));
await safe('support submissions', () => deleteLike('digital_footprint_support', 'submitted_email', formEmailPattern));
await safe('lead submissions', () => deleteLike('leads', 'email', formEmailPattern));

// Delete dependent disposable rows before parents.
for (const id of [env('CLIENT_A_MESSAGE_THREAD_ID'), env('CLIENT_B_MESSAGE_THREAD_ID')]) {
  await safe(`message_threads ${id}`, () => deleteBy('message_threads', 'id', id));
}
for (const id of [env('CLIENT_A_SUPPORT_ID'), env('CLIENT_B_SUPPORT_ID')]) {
  await safe(`support_tickets ${id}`, () => deleteBy('support_tickets', 'id', id));
}
for (const id of [env('TESTER_A_ASSIGNMENT_ID'), env('TESTER_B_ASSIGNMENT_ID')]) {
  await safe(`uat_assignments ${id}`, () => deleteBy('uat_assignments', 'id', id));
}
await safe('uat job', () => deleteBy('uat_jobs', 'id', env('UAT_JOB_ID')));
for (const id of [env('TESTER_A_ID'), env('TESTER_B_ID')]) {
  await safe(`uat_testers ${id}`, () => deleteBy('uat_testers', 'id', id));
}
await safe('uat project', () => deleteBy('uat_projects', 'id', env('UAT_PROJECT_ID')));

for (const id of [env('CLIENT_A_FILE_ID'), env('CLIENT_B_FILE_ID')]) {
  await safe(`project_files ${id}`, () => deleteBy('project_files', 'id', id));
}
for (const id of [env('CLIENT_A_INVOICE_ID'), env('CLIENT_B_INVOICE_ID')]) {
  await safe(`invoices ${id}`, () => deleteBy('invoices', 'id', id));
}
for (const id of [env('CLIENT_A_PROJECT_ID'), env('CLIENT_B_PROJECT_ID')]) {
  await safe(`projects ${id}`, () => deleteBy('projects', 'id', id));
}
for (const id of [env('CLIENT_A_ID'), env('CLIENT_B_ID')]) {
  await safe(`clients ${id}`, () => deleteBy('clients', 'id', id));
}

// Profiles and role rows are keyed by Auth user id. Discover run-owned users by metadata so cleanup
// still works if fixture creation failed before all environment variables were exported.
let page = 1;
const runUsers = [];
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    cleanupErrors.push(`list Auth users: ${error.message}`);
    break;
  }
  const matches = data.users.filter((user) =>
    user.user_metadata?.dfp_uat === true &&
    String(user.user_metadata?.dfp_uat_run_id || '') === String(runId) &&
    user.email?.startsWith(`dfp-uat-${runId}-`),
  );
  runUsers.push(...matches);
  if (data.users.length < 1000) break;
  page += 1;
}

for (const user of runUsers) {
  await safe(`admin_profiles ${user.id}`, () => deleteBy('admin_profiles', 'id', user.id));
  await safe(`staff_profiles ${user.id}`, () => deleteBy('staff_profiles', 'id', user.id));
  await safe(`profiles ${user.id}`, () => deleteBy('profiles', 'id', user.id));
}

for (const user of runUsers) {
  await safe(`Auth user ${user.id}`, async () => {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  });
}

if (cleanupErrors.length) {
  console.error('DFP-UAT cleanup completed with errors:');
  for (const error of cleanupErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`DFP-UAT cleanup PASS for run ${runId}; removed ${runUsers.length} temporary Auth users.`);
