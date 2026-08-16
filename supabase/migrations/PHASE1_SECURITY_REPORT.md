# DFP Supabase Security Remediation - Phase 1 Report
# Date: 31 July 2026
# Status: COMPLETE

## Migrations Created
1. 20260731220000_secure_checkout_orders.sql - Remove unsafe public policies on dfp_checkout_orders
2. 20260731220100_secure_support_ticket_functions.sql - Fix create_client_support_ticket, add audit table, revoke anon EXECUTE
3. 20260731220200_clean_message_policies.sql - Clean up message RLS policies, add immutable columns trigger
4. 20260731220300_restrict_notification_deliveries.sql - Restrict notification_deliveries table access

## Policies Removed (7 total)
- dfp_checkout_orders: "Public can read own checkout orders by project_reference" (qual=true)
- dfp_checkout_orders: "Service role can manage dfp_checkout_orders" (ALL to public)
- message_read_receipts: receipts_insert_own, receipts_select_own, receipts_update_own (v1 duplicates)
- message_threads: threads_update_client_v2 (broken self-comparison)
- notification_deliveries: ndeliveries_insert_service (public INSERT with_check=true)

## Policies Retained (9 total)
- message_threads: threads_insert_client, threads_select_client, threads_update_client, threads_internal
- message_read_receipts: receipts_*_v2 (3 policies) + receipts_internal
- notification_deliveries: ndeliveries_select_own

## Grants Revoked
- dfp_checkout_orders: ALL from anon, authenticated
- notification_deliveries: INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER from anon, authenticated
- 5 SECURITY DEFINER functions: EXECUTE revoked from anon and PUBLIC

## Function Signatures Changed
- create_client_support_ticket: removed p_created_by parameter; added SET search_path=''; added validation
- client_close_ticket: added SET search_path=''; fully qualified objects
- client_reopen_ticket: added SET search_path=''; fully qualified objects

## New Objects
- Table: public.support_ticket_audit_log (RLS enabled, no anon/authenticated access)
- Trigger: trg_message_thread_immutable_columns (blocks client modification of 9 protected columns)

## Frontend Changes
- app/portal/support/page.tsx: removed p_created_by from RPC call

## Verification
- All 4 tables: RLS enabled
- dfp_checkout_orders: 0 policies, 0 anon/authenticated privileges
- notification_deliveries: only SELECT for anon/authenticated
- message_read_receipts: 4 policies (down from 7)
- message_threads: 4 policies + trigger
- All 5 functions: 0 anon/PUBLIC grants
- No production data deleted