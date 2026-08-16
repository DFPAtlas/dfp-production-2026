const scope = (process.env.DFP_UAT_SCOPE || 'public').trim().toLowerCase();

const common = ['DFP_UAT_BASE_URL'];
const full = [
  'DFP_UAT_RUN_ID',
  'DFP_UAT_SUPABASE_URL',
  'DFP_UAT_SUPABASE_ANON_KEY',
  'DFP_UAT_CLIENT_A_EMAIL',
  'DFP_UAT_CLIENT_A_PASSWORD',
  'DFP_UAT_CLIENT_B_EMAIL',
  'DFP_UAT_CLIENT_B_PASSWORD',
  'DFP_UAT_CLIENT_A_PROJECT_ID',
  'DFP_UAT_CLIENT_B_PROJECT_ID',
  'DFP_UAT_CLIENT_A_INVOICE_ID',
  'DFP_UAT_CLIENT_B_INVOICE_ID',
  'DFP_UAT_CLIENT_A_FILE_ID',
  'DFP_UAT_CLIENT_B_FILE_ID',
  'DFP_UAT_STAFF_EMAIL',
  'DFP_UAT_STAFF_PASSWORD',
  'DFP_UAT_ADMIN_EMAIL',
  'DFP_UAT_ADMIN_PASSWORD',
  'DFP_UAT_TESTER_A_EMAIL',
  'DFP_UAT_TESTER_A_PASSWORD',
  'DFP_UAT_TESTER_B_EMAIL',
  'DFP_UAT_TESTER_B_PASSWORD',
  'DFP_UAT_TESTER_A_ASSIGNMENT_ID',
  'DFP_UAT_TESTER_B_ASSIGNMENT_ID',
];

const required = scope === 'full' ? [...common, ...full] : common;
const missing = required.filter((name) => !process.env[name]?.trim());

if (scope === 'full' && process.env.DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES !== 'true') {
  missing.push('DFP_UAT_ALLOW_PRODUCTION_FORM_WRITES=true');
}

if (!['public', 'full'].includes(scope)) {
  console.error(`Unsupported DFP_UAT_SCOPE: ${scope}. Use public or full.`);
  process.exit(1);
}

if (missing.length) {
  console.error(`DFP browser UAT preflight failed for scope=${scope}.`);
  console.error('Missing required configuration:');
  for (const name of missing) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`DFP browser UAT preflight PASS for scope=${scope}`);
console.log(`Base URL: ${process.env.DFP_UAT_BASE_URL}`);
console.log('No secret values are printed by this preflight.');
