# DFP Migration Drift Guard

Repository migrations are the authoritative deployment record. This document contains the
drift-check SQL, the `db:verify` pre-deploy command, and the CI integration snippet.

## 1. Audit result (live, evidence-backed)

Live head `supabase_migrations.schema_migrations`: `20260817000000`.
Repo DFP timestamped head: `20260817000000`.

Untracked (repo present, not in live history):

- `20260813000000_restore_stripe_payment_rpcs.sql`
- `20260814000000_dfp_migration_parity_and_stripe_grants.sql`

Both are fully idempotent (`add column if not exists`, `create unique index if not exists`,
`create or replace function`, `revoke/grant`). Their objects already exist live — the only
statement that has NOT landed is the `REVOKE ... FROM public, anon, authenticated`, so
`record_stripe_invoice_payment` and `record_stripe_refund` still hold `EXECUTE` for PUBLIC/anon/authenticated
(mitigated today only by the in-body `current_user` guard).

## 2. Repair (safe, no production reset)

Run in the linked environment:

```
supabase db push
```

This applies the two untracked idempotent migrations in version order, lands the `REVOKE`,
and records both in `supabase_migrations.schema_migrations`. There is no `CREATE POLICY` /
`CREATE TABLE` collision — every statement is idempotent.

Do NOT manually insert rows into `supabase_migrations.schema_migrations` to silence the drift;
that would skip the `REVOKE` and leave the privilege gap permanently.

## 3. Drift-check SQL (read-only; run in Supabase Dashboard SQL editor or a restricted CI role)

```sql
-- 3a. Required DFP migrations present?
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version >= '20260813000000'
ORDER BY version;

-- Expected exactly these 8 (after repair), no duplicates, ascending order:
--   20260813000000  restore_stripe_payment_rpcs
--   20260813000100  digital_footprint_rls_hardening
--   20260813000200  dfp_health_probe
--   20260814000000  dfp_migration_parity_and_stripe_grants
--   20260814000100  dfp_public_support_rls
--   20260815000000  dfp_careers_duplicate_check
--   20260816000000  dfp_lead_notification_events
--   20260817000000  dfp_production_health_monitoring

-- 3b. Duplicate versions?
SELECT version, count(*) FROM supabase_migrations.schema_migrations
GROUP BY version HAVING count(*) > 1;

-- 3c. Stripe RPC effective privileges (must NOT contain =X, anon=X, authenticated=X)
SELECT p.proname, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('record_stripe_invoice_payment','record_stripe_refund');

-- 3d. Critical object existence
SELECT
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='record_stripe_invoice_payment') AS invoice_rpc,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='record_stripe_refund') AS refund_rpc,
  (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='stripe_webhook_events') AS webhook_ledger,
  (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dfp_service_health') AS service_health,
  (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename='dfp_health_checks') AS health_checks,
  (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='digital_footprint_support'
     AND policyname='digital_footprint_support_public_insert') AS support_insert_policy;

-- 3e. Dangerous RLS patterns (bare USING true / WITH CHECK true on anon/authenticated)
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual::text = 'true') OR (qual::text = 'true '::text)
    OR (with_check::text = 'true') OR (with_check::text = 'true '::text)
  )
  AND roles && ARRAY['anon','authenticated'];
```

## 4. `db:verify` pre-deploy command

`package.json`:

```json
{
  "scripts": {
    "db:verify": "node scripts/dfp-migration-drift.mjs"
  }
}
```

`scripts/dfp-migration-drift.mjs` (requires `DATABASE_URL` as a CI secret, never committed):

```js
import { Client } from 'pg';

const required = [
  '20260813000000', '20260813000100', '20260813000200',
  '20260814000000', '20260814000100', '20260815000000',
  '20260816000000', '20260817000000',
];

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const tracked = (await client.query(
  "SELECT version FROM supabase_migrations.schema_migrations WHERE version >= '20260813000000'"
)).rows.map(r => r.version);

const untracked = required.filter(v => !tracked.includes(v));
const dup = (await client.query(
  "SELECT version FROM supabase_migrations.schema_migrations GROUP BY version HAVING count(*) > 1"
)).rows;

const acl = (await client.query(
  `SELECT p.proname, p.proacl::text AS acl
   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname IN ('record_stripe_invoice_payment','record_stripe_refund')`
)).rows;

const failures = [];
if (untracked.length) failures.push(`untracked DFP migrations: ${untracked.join(', ')}`);
if (dup.length) failures.push(`duplicate versions: ${dup.map(d => d.version).join(', ')}`);
for (const row of acl) {
  if (/=X|anon=X|authenticated=X/.test(row.acl)) {
    failures.push(`unsafe privilege on ${row.proname}: ${row.acl}`);
  }
}

await client.end();

if (failures.length) {
  console.error('DFP migration drift detected:');
  failures.forEach(f => console.error(' - ' + f));
  process.exit(1);
}
console.log('DFP migration verification passed.');
```

## 5. CI integration (release-certification workflow)

Insert after typecheck/lint, before build:

```yaml
      - name: Verify DFP migration parity
        run: npm run db:verify
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
```

Required order: install → typecheck/lint → **db:verify** → build → browser/security tests.
Never run against production from PR CI; use a staging/read-only database URL.

## 6. Failure conditions (release blocker)

- Required DFP migration missing live
- Required DFP migration untracked
- Duplicate migration version
- `record_stripe_invoice_payment` or `record_stripe_refund` grants EXECUTE to public/anon/authenticated
- Critical live object absent (RPCs, webhook ledger, `dfp_service_health`, `dfp_health_checks`)
- Unexplained DFP migration drift