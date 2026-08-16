# Digital Footprint build notes

This repo has been patched for the build blockers found in the uploaded zip and
now includes the Stripe Phase 1 payment foundation.

## Fixed

- Added the missing `package-lock.json` so `npm ci` is reproducible.
- Removed `next/font/google` from `app/layout.tsx` so the build does not fail when Google Fonts cannot be reached.
- Added static generation tuning in `next.config.ts` for local VM builds.
- Updated Next.js 15 dynamic route pages so `params` are awaited correctly.
- Fixed CDD section Framer Motion variant typing.
- Fixed Supabase `err` / `error` response handling on the new UAT project page.
- Fixed Supabase `count` handling on the UAT tester profile page.

## Stripe Phase 1

- Checkout amounts now come from authoritative invoice or milestone records.
- Checkout requires a valid user session and verifies access to the record.
- Stripe Customers are mapped to Digital Footprint clients.
- Redirects and browser origins are allow-listed.
- Checkout creation uses idempotency keys.
- Stripe webhook signatures are mandatory.
- Webhook event IDs are recorded and deduplicated.
- Successful invoice payments and refunds use transactional database functions.
- Payment, refund, invoice balance and reconciliation records stay aligned.
- Browser code sends only the invoice ID, not a trusted amount or customer identity.

Apply `supabase/migrations/20260726220000_stripe_phase_1_foundation.sql` before
deploying the updated Stripe Edge Functions.

## Run locally

```bash
npm ci
npm run build
```

## Notes

- The optimized application compilation succeeds.
- The full build currently stops on the pre-existing Next.js 15 dynamic route
  typing in `app/admin/clients/[id]/page.tsx`.
- ESLint currently fails to initialize because the repository combines ESLint
  10 with legacy configuration consumed through `@eslint/eslintrc`.
- Next.js 15.3.2 reports a known security advisory and should be upgraded in a
  separate, focused framework dependency pull request.

