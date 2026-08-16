# DFP Production Operations — Operational Handover & Launch Closeout

> **STATUS: PRE-LAUNCH — PRODUCTION NOT YET OPERATIONAL**
>
> This document is the single source of truth for operating Digital Footprint (DFP).
> It records the system as it **actually exists**, not as it is intended to be.
> Sections that reference capabilities which do not yet exist are explicitly marked
> `NOT CONFIGURED` / `NOT EXECUTED` rather than described as if they were live.

**Last verified:** Fix 37

---

## 1. Production Baseline

| Field | Value |
| --- | --- |
| Production SHA | **UNKNOWN** — no deployment has ever been recorded |
| Application version | `0.1.0` (`package.json`) |
| Deployment ID | **NONE** (`digital_footprint_deployments` = 0 rows, `release_versions` = 0 rows) |
| Migration head (tracked) | `20260817000000` |
| Production domain | `digital-footprint.uk` |
| Latest backup | **NONE** (`backup_records` = 0, `digital_footprint_backups` = 0) |
| Latest restore drill | **NONE** (all restore tables empty) |
| CI workflow | `.github/workflows/stripe-pr-validation.yml` only |
| Monitoring | Scheduler registered but **never auto-ran** (`last_auto_run_at` = NULL) |

> The release gate was NOT passed: Fix 34 returned `NO-GO`, Fix 35 returned
> `DEPLOYMENT BLOCKED BY RELEASE GATE`. There is no certifiable release candidate,
> and no production deployment has occurred. This baseline therefore describes a
> pre-launch environment.

---

## 2. System Component Inventory

| Component | Purpose | Environment | Owner/Role | Health source |
| --- | --- | --- | --- | --- |
| Next.js frontend | Public site, Portal, Staff, Admin, UAT, Email Studio, PBX | Production (undeployed) | Engineering | Build/CI |
| Supabase database | Primary data store | Production project | Engineering | `dfp_health_probe` |
| Supabase Auth | Client/Staff/Admin/UAT authentication | Production project | Engineering | `dfp_health_probe` |
| Supabase Storage | Client files, UAT evidence, careers docs | Production project | Engineering | `dfp_health_probe` |
| Edge Functions | Stripe, Email, n8n, UAT sandbox, health | Production project | Engineering | `dfp_health_probe` |
| Stripe | Payments/refunds | **Connected** (mode unverified) | Finance/Engineering | `stripe-webhook` |
| Resend | Transactional email | Key configured; domain `digital-footprint.uk` verified | Engineering | `resend-webhook` |
| n8n | Workflow automation | NOT CONFIGURED | Automation | n8n-webhook |
| PBX / provider | Telephony | **NOT CONFIGURED** (0 tenants/numbers) | Ops | — |
| UAT worker | Sandboxed test reproduction | Edge functions deployed; worker URL not configured | Engineering | UAT sandbox functions |
| Monitoring | Service health | Enabled, never auto-ran | Engineering | `dfp_health_scheduler_state` |
| CI/CD | Release certification | Only `stripe-pr-validation.yml` present | Engineering | GitHub Actions |
| Backups | DB + storage recovery | **NOT CONFIGURED** | Engineering | `backup_records` |

No secret values are stored in this document.

---

## 3. Environment Inventory

| Environment | App URL | Supabase | Stripe mode | Email mode | PBX | UAT worker |
| --- | --- | --- | --- | --- | --- | --- |
| Production | `digital-footprint.uk` | `zjqftnkrmqhmbrtkvafy.supabase.co` | Connected (live/test unverified) | Resend (key + domain) | Not configured | Not configured |
| Staging | Not established | Not established as separate project | — | — | — | — |
| Development | `localhost:3000` | `.env` `NEXT_PUBLIC_SUPABASE_URL` | — | — | — | Local |

> There is no dedicated staging Supabase project or staging environment currently
> provisioned. The release-certification reference (see §22) assumes a staging
> project with `SUPABASE_STAGING_URL` etc., which does not yet exist.

---

## 4. Secret Inventory (names only — never values)

| Secret name | Storage location | Type |
| --- | --- | --- |
| Supabase service role | Supabase project secrets / Edge Function secrets | Server-side |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Public (publishable) |
| Stripe secret key | Supabase Edge Function secrets | Server-side |
| Stripe webhook secret | Supabase Edge Function secrets | Server-side |
| `RESEND_API_KEY` | Supabase Edge Function secrets (Supabase Dashboard) | Server-side |
| `RESEND_FROM_DOMAIN` | Supabase Edge Function secrets | Server-side |
| n8n credentials | Supabase Edge Function secrets | Server-side |
| PBX (Twilio) credentials | Supabase Edge Function secrets (not yet configured) | Server-side |
| UAT worker token | Supabase Edge Function secrets | Server-side |

> Rule: no `NEXT_PUBLIC_*` variable may ever carry a real secret. The only public
> `NEXT_PUBLIC_*` values permitted are the Supabase URL and anon/publishable key.

---

## 5. Release Process

The intended sequence (documented from the reference certification pipeline). Only
the parts that actually exist are marked LIVE.

1. Create release candidate (exact SHA) — **not yet produced**
2. CI (npm ci, typecheck, lint, build) — **workflow NOT materialised** (see §22)
3. Migration verification — **script not in `package.json`**
4. Browser UAT (Playwright) — **not configured**
5. Backup — **NOT CONFIGURED**
6. Release gate (Fix 34) — **currently `NO-GO`**
7. Migration deploy — **blocked (drift outstanding)**
8. Edge Functions deploy — **blocked**
9. Frontend deploy — **blocked**
10. Smoke tests — **not run**
11. Monitoring — **scheduler never fired**
12. Release record — **none**

> Honest state: steps 1–12 have not completed end-to-end because the gate is closed.

---

## 6. Rollback Process

| Target | Procedure | Status |
| --- | --- | --- |
| Frontend | Redeploy previous known-good application SHA | No previous known-good SHA recorded |
| Edge Functions | Redeploy previous function versions | No versioned function rollback path established |
| Database | Restore from backup / forward-fix migration | No backup, no restore drill |

Decision points:
- Roll back immediately on: site outage, auth bypass, cross-tenant exposure, broken Admin/Portal/forms, payment corruption, critical migration issue, exposed secret, repeated 500s.
- **DB rollback is NOT instant.** Recovery requires restore (not yet available) or a
  forward-fix migration. Never instruct an operator to reverse data migrations blindly.

---

## 7. Database Migration Rules

- Filename format: `YYYYMMDDHHMMSS_snake_case_description.sql` (14-digit timestamp prefix).
- **Never edit an applied migration.** Create a new sequential migration for any change.
- **Never run `db reset` against production.**
- Migration parity must be checked before deploy: repo versions vs `supabase_migrations.schema_migrations`.
- Out-of-band changes are prohibited: all production object changes must be represented by tracked migrations.
- This is a **shared multi-product Supabase project** — do not drop/rename shared objects, and scope DFP objects clearly.

**Current drift (open):** three migration files exist in the repo but are not tracked in the live history:
- `20260813000000_restore_stripe_payment_rpcs.sql`
- `20260814000000_dfp_migration_parity_and_stripe_grants.sql`
- `20260818000000_dfp_health_scheduler_enable.sql`

These are idempotent; the outstanding statements are the `REVOKE`/`GRANT` hardening and the scheduler record. They must be applied in order via `supabase db push` (or the SQL editor), **not** by inserting rows into `schema_migrations`.

---

## 8. Financial Security Rule (Stripe RPC)

Required effective privileges for `record_stripe_invoice_payment` and `record_stripe_refund`:

| Role | Required |
| --- | --- |
| PUBLIC | **DENY** |
| `anon` | **DENY** |
| `authenticated` | **DENY** |
| `service_role` | **ALLOW** |

**Current state: FAIL.** Live `proacl` still shows `{=X, anon=X, authenticated=X, service_role=X}` — PUBLIC/anon/authenticated retain EXECUTE, mitigated only by the in-body `current_user` guard. This is the long-running privilege defect and remains a P0.

Verification query (read-only):

```sql
SELECT p.proname, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('record_stripe_invoice_payment','record_stripe_refund');
-- Must NOT contain =X, anon=X, authenticated=X
```

---

## 9. Backup Procedure

**Status: NOT CONFIGURED.** `backup_records` = 0 and `digital_footprint_backups` = 0.

No backup method, schedule, retention policy, storage coverage, operator responsibility, or failure alert currently exists. **Do not** describe a backup as "enabled" until a real backup has been produced and recorded.

---

## 10. Restore Procedure

**Status: NOT EXECUTED.** All restore tables (`restore_drills`, `restore_tests`, `bs_restore_exercises`, `bs_recovery_runs`, `bs_backup_checks`) are empty.

Intended procedure once a backup exists:
1. Obtain backup from the backup provider/storage.
2. Restore into an **isolated** target (never over production).
3. Verify representative data.
4. Verify RLS policies.
5. Verify Stripe RPC grants (per §8).
6. Verify functions and migration history.
7. Application smoke.

None of these steps have been exercised.

---

## 11. Monitoring Runbook

Monitored services (from `dfp_service_health`, seeded by `dfp-health-probe`):

| Service | HEALTHY | DEGRADED | DOWN | NOT CONFIGURED | STALE |
| --- | --- | --- | --- | --- | --- |
| Website | reachable, OK status | slow/partial | unreachable | — | not checked recently |
| Database | query OK | slow | unreachable | — | not checked recently |
| Auth | reachable | degraded | down | — | not checked recently |
| Storage | bucket API OK | partial | down | — | not checked recently |
| Stripe | config + reachable | webhook failures | down | no key | not checked recently |
| Email | config + provider OK | recent failures | down | no key | not checked recently |
| n8n | reachable | latency | down | no URL | not checked recently |
| PBX | provider OK | degraded | down | no tenant | not checked recently |
| UAT Worker | reachable/ready | degraded | down | no URL | not checked recently |
| Backup | recent success | old | none → CRITICAL | — | not checked recently |
| Deployment | metadata present | — | — | UNKNOWN | not checked recently |

Stale threshold: a service not checked within a significant multiple of the 10-minute
interval is shown as `STALE`/`UNKNOWN`, never left green.

**Current state: FAIL.** Scheduler is `enabled=true` (`pg_cron`) but `last_auto_run_at`
is NULL and `dfp_health_checks` = 0 — no automatic run has ever completed.

---

## 12. Incident Runbook

Process: **detect → assess severity → contain → communicate → fix/rollback → verify → close → review.**

Severity:
- **P0** — immediate outage, security breach, or data loss. Contain first.
- **P1** — severe production/business failure requiring urgent fix.
- **P2** — important but non-critical.
- **P3** — minor/cosmetic.

---

## 13. P0 Examples

- Production outage
- Active auth bypass
- Cross-client data leak
- Exposed secret
- Payment/accounting corruption
- Major data loss

P0 response prioritises containment.

---

## 14. P1 Examples

- Contact forms unusable
- Client Portal unavailable
- Admin finance broken
- Stripe webhook processing failure
- Backup failure without immediate data loss
- UAT system critically unavailable

---

## 15. Stripe Runbook

Investigation path for checkout/webhook/duplicate/mismatch issues:

```
provider event ID (Stripe)
  → stripe_webhook_events (ledger)
  → payments / refunds record
  → invoice state
```

- Verify the webhook signature is valid before trusting an event.
- Duplicate protection is via `provider_event_id` + idempotency key dedup.
- Amount/refund mismatches: trace provider event → ledger → payment/refund → invoice.
- **Do not** manually edit accounting rows as a first fix — prove the cause first, then forward-fix via migration/RPC if needed.

**Current state:** `stripe_webhook_events` contains 1 row; payment/refund E2E and idempotency are unverified.

---

## 16. Form Runbook

Submission path: form → Supabase table → Admin view → notification (where enabled).

| Form | Table |
| --- | --- |
| Contact | `leads` |
| Demo / Request Demo | `leads` |
| Support | `digital_footprint_support` |
| Partners | `partner_applications` |
| Careers | `career_applications` |
| UAT applications | `uat_tester_applications` |

> No Readdy form endpoint is used in production source (confirmed by scan). Forms
> write directly to Supabase tables.

**Current state:** all form tables are empty (0 rows) — no submissions have flowed through yet.

---

## 17. Email Runbook

- Provider: **Resend** (`RESEND_API_KEY` + `RESEND_FROM_DOMAIN`, domain `digital-footprint.uk` verified).
- Send path: Edge Functions (`send-email`, `send-template-email`, `send-lead-notification`, `resend-webhook`).
- Event/log: `email_delivery_events`, `lead_notification_events`, `email_webhook_deliveries`.
- Webhook: `resend-webhook` implemented with Svix signature verification + dedup + bounce suppression; **webhook URL not yet registered in Resend dashboard**.
- Suppression: bounce → SHA-256 hashed suppression in `email_suppressions`.
- Failed-send investigation: check provider message ID → `email_delivery_events` → webhook delivery.

Do not include API keys in runbooks. **Current state:** 0 deliveries, 0 lead notifications — no sends have occurred.

---

## 18. PBX Runbook

**Status: NOT CONFIGURED.**

- Provider: Twilio (referenced in UI), no credentials/tenants/numbers configured.
- `pbx_tenants`, `pbx_numbers`, `pbx_users`, `pbx_call_logs`, `pbx_messages`, `pbx_voicemail_*` are all empty.
- n8n dependency: not wired.
- No routing, voicemail, SMS, or webhook to operate.

Until a tenant + number + provider credentials are provisioned, PBX must remain described as not configured (the Admin UI already reflects this truthfully).

---

## 19. UAT Runbook

Operational flow: application → approval → terms → assignment → session → evidence → defect → retest → completion/payment (where applicable).

Privacy requirement: monitoring telemetry must **never** capture passwords, tokens, form field values, or clipboard secrets.

**Current state:** UAT tables are present; Edge Functions deployed. Worker URL not configured (no `localhost` fallback in production — missing config returns `NOT CONFIGURED`).

---

## 20. Access Control Matrix

High-level. UI visibility is not security — backend RLS/privileges govern.

| Role | Public site | Client Portal | Admin | UAT | Finance RPC | Storage | System health |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Anonymous | ALLOW (read) | DENY | DENY | DENY | DENY (see §8) | DENY | DENY |
| Client | ALLOW | ALLOW (own) | DENY | DENY | DENY | own files | DENY |
| Staff | ALLOW | scoped | scoped | scoped | DENY | scoped | scoped |
| Admin | ALLOW | ALLOW | ALLOW | ALLOW | DENY (service_role only) | ALLOW | ALLOW |
| UAT Tester | ALLOW | DENY | DENY | own assignments | DENY | own evidence | DENY |
| service_role | — | — | — | — | ALLOW | ALLOW | ALLOW |

**Current risk:** the Finance RPC column is NOT enforced at the privilege layer (see §8) — `anon`/`authenticated` still hold EXECUTE, guarded only by the function body.

---

## 21. Test Accounts

Staging test identities (Client A/B, Tester A/B, Staff, Admin) are intended to be created in a dedicated staging Supabase project. **No staging project currently exists**, so no test identities are provisioned.

Never document real passwords. Test identities must be environment-scoped and never used in production.

---

## 22. CI Runbook

**Actual CI:** only `.github/workflows/stripe-pr-validation.yml` exists.

**Intended (reference, NOT materialised):** the release-certification pipeline documented in
`supabase/migrations/DFP_RELEASE_CERTIFICATION.md` describes a full workflow
(`dfp-release-certification.yml`) plus scripts (`scan:secrets`, `migration:inventory`,
`security:smoke`, `test:e2e`). None of these scripts exist in `package.json`
(current scripts: `build`, `dev`, `lint`, `typecheck` only), and the workflow file is not
present in this repository.

Required secret NAMES (for the intended pipeline): `SUPABASE_STAGING_URL`,
`SUPABASE_STAGING_ANON_KEY`, `SUPABASE_STAGING_SERVICE_ROLE`, `STRIPE_TEST_SECRET_KEY`,
`STRIPE_TEST_WEBHOOK_SECRET`, `STAGING_DATABASE_URL`. No values are recorded here.

---

## 23. Deployment Checklist

Reusable pre-deploy checklist (fail-closed):

- [ ] Exact certified SHA known
- [ ] CI PASS (npm ci, typecheck, lint, build)
- [ ] Migration parity PASS
- [ ] Security PASS (Stripe RPC hardened, secret scan clean)
- [ ] Backup PASS (real, fresh)
- [ ] Browser UAT PASS
- [ ] Release gate GO (not NO-GO)
- [ ] Deploy migrations → Edge Functions → frontend (in order)
- [ ] Smoke tests (public + auth + forms)
- [ ] Monitoring reflects new SHA
- [ ] Release record created

---

## 24. Monthly Recovery Test

Recommended recurring verification (cadence not yet approved/configured):
- Confirm backups exist and are within retention.
- Inspect retention coverage.
- Perform a periodic isolated restore drill.
- Verify RLS + Stripe RPC grants after restore (§8).

**Actual configured schedule: NONE.** This is a recommended cadence, separate from the (not-yet-existing) configured schedule.

---

## 25. Dependency Review

Critical external dependencies and failure impact (no formal SLAs are contracted unless stated):

| Dependency | Failure impact |
| --- | --- |
| Supabase (DB/Auth/Storage) | Total outage of data, auth, storage |
| Stripe | Payments/refunds halted |
| Resend | Transactional email halted |
| n8n | Automation workflows halted (currently not configured) |
| PBX provider (Twilio) | Telephony unavailable (currently not configured) |
| Hosting (Vercel/edge) | Site down |
| UAT worker | Sandbox reproduction unavailable |

---

## 26. Outstanding Technical Debt

**P1**
- Stripe RPC privilege hardening not applied (PUBLIC/anon/authenticated EXECUTE).
- Migration drift: `20260813000000`, `20260814000000`, `20260818000000` untracked.
- No real database backup / no restore drill.
- Monitoring scheduler never auto-ran.
- No certifiable release candidate (SHA/CI unavailable).

**P2**
- Email Studio conditional: Resend webhook URL + provider init + lead recipient secret pending.
- PBX fully not configured.
- Storage recovery coverage NONE.
- Stripe payment/refund E2E + idempotency unverified.

**P3**
- Release-certification scripts/workflow not materialised in `package.json`/`.github`.
- No dedicated staging environment.

---

## 27. Launch Evidence Index

| Evidence | Status |
| --- | --- |
| Final CI run | None (workflow not present) |
| Release SHA | None (no deployment) |
| Migration verification | Drift outstanding |
| Stripe RPC privilege tests | FAIL (still PUBLIC EXECUTE) |
| Cross-tenant tests | Not executed |
| Backup | None |
| Restore drill | None |
| Browser UAT | Not run |
| Production deployment | None |
| Production monitoring | Never auto-ran |

---

## 28. Document Location

This is the central operational document. Related reference material (non-authoritative for live state, provided as reference) lives in:
- `supabase/migrations/DFP_RELEASE_CERTIFICATION.md`
- `supabase/migrations/DFP_MIGRATION_DRIFT_GUARD.md`
- `supabase/migrations/PHASE1_SECURITY_REPORT.md`
- `supabase/migrations/PHASE2_RELEASE_AUDIT.md`

---

## 29. README Link

A link from `README.md` to this document is **required but not yet applied** — `README.md`
is a protected file in this environment and could not be modified. Apply manually:

> See `supabase/migrations/DFP_PRODUCTION_OPERATIONS.md` for the operational runbook.

---

## 30. Final Validation (self-check)

- [x] Paths reference real files (migration docs exist; README exists but is protected).
- [x] Scripts accurately described as NOT materialised (only `build/dev/lint/typecheck` present).
- [x] Workflow accurately described (`stripe-pr-validation.yml` only).
- [x] Table names match live schema (`leads`, `partner_applications`, `digital_footprint_support`, `career_applications`, `uat_tester_applications`, `stripe_webhook_events`, `dfp_service_health`, etc.).
- [x] No Readdy form architecture described as live.
- [x] Stripe privileges recorded as FAIL (not falsely "hardened").
- [x] No fake backup claims (backup = 0 rows).