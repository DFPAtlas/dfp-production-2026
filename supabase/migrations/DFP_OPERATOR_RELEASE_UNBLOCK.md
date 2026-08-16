# DFP Operator Release Unblock Checklist

This is the **closure pack** for the six Digital Footprint release blockers.

It tells the operator exactly what must be executed **outside Readdy** to close each
blocker. It is not another release audit, not a new discovery exercise, and it does
not add new blockers or feature requirements.

**Scoring rule (fixed):** Do **not** calculate a new global launch-readiness
percentage during blocker closure. The score stays frozen until all six blocker
states are updated. After all six are `CLOSED`, run ONE final release assessment
against a single fixed 100-point model. Do not create new scoring criteria between
blockers.

---

## Current blocker register

| # | Blocker |
| --- | --- |
| 01 | Stripe financial RPC PostgreSQL EXECUTE privileges |
| 02 | Migration history reconciliation |
| 03 | Exact Git SHA + clean build + CI |
| 04 | Real production database backup |
| 05 | Isolated restore drill |
| 06 | Browser/runtime tenant-isolation UAT |

---

## PART 1 — Blocker 01: Stripe ACL

Run through the **Supabase Dashboard → correct production project → SQL Editor**.

Target functions: `record_stripe_invoice_payment`, `record_stripe_refund`.

```sql
revoke all on function public.record_stripe_invoice_payment(
  uuid,
  bigint,
  text,
  text,
  text,
  text,
  timestamp with time zone
) from public, anon, authenticated;

grant execute on function public.record_stripe_invoice_payment(
  uuid,
  bigint,
  text,
  text,
  text,
  text,
  timestamp with time zone
) to service_role;

revoke all on function public.record_stripe_refund(
  text,
  text,
  text,
  bigint,
  text,
  text,
  timestamp with time zone
) from public, anon, authenticated;

grant execute on function public.record_stripe_refund(
  text,
  text,
  text,
  bigint,
  text,
  text,
  timestamp with time zone
) to service_role;
```

Verification SQL (effective privilege check):

```sql
select r.rolname,
       p.proname,
       has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
from pg_proc p
cross join pg_roles r
where p.proname in ('record_stripe_invoice_payment', 'record_stripe_refund')
  and p.pronamespace = 'public'::regnamespace
  and r.rolname in ('public', 'anon', 'authenticated', 'service_role')
order by p.proname, r.rolname;
```

Required final result:

| Role | Result |
| --- | --- |
| `PUBLIC` | DENY |
| `anon` | DENY |
| `authenticated` | DENY |
| `service_role` | ALLOW |

The internal `current_user` guard inside the function is **not** treated as
sufficient — the PostgreSQL `EXECUTE` privilege must also be denied.

---

## PART 2 — Blocker 02: Migration reconciliation

Known migration state:

| Version | State |
| --- | --- |
| `20260813000000` | UNTRACKED + LIVE, with privilege tail previously missing |
| `20260813000100` | TRACKED + MATCHES |
| `20260813000200` | TRACKED + MATCHES |
| `20260814000000` | UNTRACKED; privilege repair migration |
| `20260814000100` | TRACKED + MATCHES |
| `20260815000000` | TRACKED + MATCHES |
| `20260816000000` | TRACKED + MATCHES |
| `20260817000000` | TRACKED + MATCHES |
| `20260818000000` | UNTRACKED + PARTIAL; scheduler objects partially live |

Operator steps:

1. Run `supabase migration list` against the production project.
2. Inspect the actual tracked vs. applied state.
3. Reconcile **only after** the intended live state is verified (see Part 3 for
   `20260818000000` — do not mark it applied until its function exists).
4. Use one of:
   - `supabase migration repair --status applied <version>` (supported), or
   - an approved `supabase db push`.

Do **not** recommend direct fake inserts into `supabase_migrations.schema_migrations`.

---

## PART 3 — Blocker 02 (continued): `20260818000000` partial state

Confirmed partial state:

- cron job `dfp-health-probe-auto` exists
- schedule `*/10 * * * *`
- scheduler state exists
- `dfp_verify_scheduler_token` is **missing**

The migration's complete intended state includes:

- Vault secret `dfp_scheduler_secret`
- `public.dfp_verify_scheduler_token(text)` function (security definer)
- seeded `dfp_service_health` rows
- pg_cron job `dfp-health-probe-auto`
- `dfp_health_scheduler_state` row

**Do not silently repair history without materialising the missing function.** The
operator must apply/reconcile the migration so its COMPLETE intended state exists
before marking it applied.

---

## PART 4 — Blocker 03: Real repository setup

Run these commands in the **actual Git repository**:

```bash
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short
```

Required evidence:

- correct repo (correct remote URL)
- intended branch
- full 40-char SHA
- clean working tree

If the tree is dirty, **do not freeze the candidate.**

---

## PART 5 — Blocker 03 (continued): Materialise CI files

Readdy cannot create root config, `.github/workflows/`, `tests/`, or `scripts/`.
These must be created directly in the actual repository. Source reference:

`supabase/migrations/DFP_RELEASE_CERTIFICATION.md`

Create:

- `playwright.config.ts`
- required `tests/*` (helpers, public routes, auth routes, contact form, partner
  form, responsive, accessibility)
- required `scripts/*` (secret scan, migration inventory, RLS security smoke,
  payment E2E)
- `.github/workflows/dfp-release-certification.yml`
- optional `.github/workflows/dfp-payment-e2e.yml` (manual, Stripe test mode only)

Do not invent additional frameworks.

---

## PART 6 — Blocker 03 (continued): package.json

Add the devDependency:

```json
"@playwright/test": "^1.49.0"
```

Add these scripts **only after the referenced files actually exist** (no dangling
references):

```json
"start": "next start -p 3000",
"test:e2e": "playwright test",
"scan:secrets": "node scripts/scan-secrets.mjs",
"migration:inventory": "node scripts/migration-inventory.mjs",
"security:smoke": "node scripts/rls-security-smoke.mjs",
"payment:e2e": "node scripts/payment-e2e.mjs"
```

`payment:e2e` points to the Stripe test-mode flow the operator authors (invoice →
webhook → refund → duplicate replay). It is a separate manual workflow so it never
runs against live mode automatically.

---

## PART 7 — Blocker 03 (continued): Build commands

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

If the `typecheck` script name differs in the repository, use the repository
equivalent.

Required:

- `npm ci` = PASS
- TypeScript = PASS
- Build = PASS

Do **not** recommend `ignoreBuildErrors`, TypeScript suppression, or bypassing the
lockfile.

**Record the SHA AFTER any build fixes are committed** — the frozen SHA is only
valid post-fix.

---

## PART 8 — Blocker 03 (continued): CI

Required CI sequence:

```
checkout → npm ci → typecheck → lint → DB verification → build → app start
→ Playwright → release summary
```

Capture:

- workflow run ID
- full SHA
- result (success/failure)

The CI SHA **must match** the frozen SHA.

---

## PART 9 — Blocker 03 (continued): GitHub secrets

Add these secrets under **Settings → Secrets and variables → Actions** (names only —
never commit values to source or this document):

| Secret | Purpose |
| --- | --- |
| `SUPABASE_STAGING_URL` | Staging Supabase project URL |
| `SUPABASE_STAGING_ANON_KEY` | Staging anon (publishable) key |
| `SUPABASE_STAGING_SERVICE_ROLE` | Staging service-role key (server-side tests only) |
| `STRIPE_TEST_SECRET_KEY` | Stripe test-mode key (optional, payment E2E) |
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe test-mode webhook secret (optional) |

Never use Stripe live mode in CI.

---

## PART 10 — Blocker 04: Production backup

Preferred SaaS Supabase path:

```
Dashboard → Production project → Database → Backups
```

Operator must obtain **real** evidence:

- backup / provider ID
- timestamp
- successful status
- retention
- PITR state / recovery window

If no managed backup exists, document the approved CLI dump alternative
(`supabase db dump`).

Do **not** count the `backup_records` application table as a backup — it is an
application-level record, not a database backup.

---

## PART 11 — Blocker 04 (continued): Storage backup warning

Postgres database backups do **not** automatically prove recovery of Storage object
bytes.

Known buckets include:

- `project-files`
- `bs-uat-evidence`
- `private`
- `identity-evidence`
- `privacy-exports`
- `inspection-media`
- `garageflow-audio`

Classify Storage backup coverage as exactly one of:

- VERIFIED
- PARTIAL
- NOT CONFIGURED

Do not fake coverage.

---

## PART 12 — Blocker 05: Isolated restore drill

Recovery test sequence:

```
Real production backup
→ isolated non-production target
→ external integrations disabled
→ restore
→ verify representative data
→ verify constraints
→ verify RLS
→ verify policies
→ verify Stripe RPC ACL
→ verify migration history
```

Never restore over production.

Capture:

- backup ID
- restore target
- start/end timestamps
- result

---

## PART 13 — Blocker 06: Staging candidate

After build/CI, deploy the **frozen SHA** to staging.

Capture:

- staging URL
- branch
- full SHA
- deployment ID

Blocker 06 evidence is only final when tests reference this exact candidate.

---

## PART 14 — Blocker 06 (continued): Test identities

Create staging-only identities:

- Client A
- Client B
- Staff
- Admin
- Tester A
- Tester B

Do **not** use genuine customer/tester accounts. Create clearly tagged records:

- `DFP-UAT-A-*`
- `DFP-UAT-B-*`

---

## PART 15 — Blocker 06 (continued): Cross-client matrix

Client A expected results:

| Action | Result |
| --- | --- |
| Own project | ALLOW |
| Client B project | DENY |
| Own invoice | ALLOW |
| Client B invoice | DENY |
| Own files | ALLOW |
| Client B files | DENY |
| Own support | ALLOW |
| Client B support | DENY |
| Manipulated ownership IDs (`client_id`, `project_id`, `owner_id`, `user_id`) | DENY / rejected or overridden |

Run via both:

- UI
- API/Supabase with Client A session token

Static policy inspection is **not** sufficient.

---

## PART 16 — Blocker 06 (continued): Cross-tester matrix

Tester A expected results:

| Action | Result |
| --- | --- |
| Own assignment | ALLOW |
| Tester B assignment | DENY |
| Tester B evidence | DENY |
| Tester B mailbox / private records | DENY |
| Private Storage | DENY |

Capture runtime evidence (UI + direct query + API).

---

## PART 17 — Blocker 06 (continued): Form E2E

Run browser submissions on:

- `/contact`
- `/partners/apply`

Verify:

- browser submission → success state
- database row (`leads` / `partner_applications`)
- correct `source` / `type` / `status` / `application_type`
- Admin visibility where intended

Record network requests to `readdy.ai/api/form`. Expected count: `0`.

---

## PART 18 — Blocker 06 (continued): Client journey

Run one complete Client A workflow:

```
Admin/Staff project → Client Portal → file request → upload → approval
→ message → support ticket → Admin response
```

Refresh between important steps. Verify persistence.

---

## PART 19 — Blocker 06 (continued): UAT journey

Run:

```
application → approval → terms → assignment → session → evidence
→ defect → retest
```

Verify monitoring does **not** capture:

- passwords
- tokens
- form values (where policy forbids)
- clipboard contents

---

## PART 20 — Blocker 06 (continued): Browser evidence

Capture safe artifacts:

- Playwright HTML report
- screenshots
- traces
- console report
- failed-network report

HAR may be captured only if sanitised. Do **not** retain:

- Authorization headers
- session tokens
- passwords
- secret API keys

---

## PART 21 — Blocker 06 (continued): Responsive

Test at:

- 390px
- 768px
- 1440px

At minimum: Home, Contact, Client Portal, Admin, UAT.

---

## PART 22 — Blocker closure order

Preferred operator order:

1. Blocker 01 — Stripe ACL
2. Blocker 02 — migration reconciliation
3. Blocker 03 — Git/build/CI/SHA
4. Blocker 04 — backup
5. Blocker 05 — restore
6. Blocker 06 — runtime/browser UAT

Some independent work may happen in parallel, but final certification requires all
six.

---

## PART 23 — Blocker checkbox

```
[ ] Blocker 01 — CLOSED
    evidence: ______  date: ______  SHA/version: ______

[ ] Blocker 02 — CLOSED
    evidence: ______  date: ______  SHA/version: ______

[ ] Blocker 03 — CLOSED
    evidence: ______  date: ______  SHA/version: ______

[ ] Blocker 04 — CLOSED
    evidence: ______  date: ______  SHA/version: ______

[ ] Blocker 05 — CLOSED
    evidence: ______  date: ______  SHA/version: ______

[ ] Blocker 06 — CLOSED
    evidence: ______  date: ______  SHA/version: ______
```

---

## PART 24 — Fixed scoring rule

**Do not calculate another global launch-readiness percentage during blocker
closure.** The score remains frozen until all six blocker states have been updated.

After all six are `CLOSED`, run ONE final release assessment against one fixed
100-point scoring model. Do not create new scoring criteria between blockers.

---

## PART 25 — No new audits

This document must **not** introduce:

- new launch phases
- new broad audits
- additional blockers
- new feature requirements

This is a closure pack, not another discovery exercise.