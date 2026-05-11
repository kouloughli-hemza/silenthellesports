-- =============================================================================
-- ROLLBACK for 20260510000001_uc_recharge.sql
--
-- WHEN TO RUN: only if the UC recharge feature is being scrapped.
-- This will permanently delete:
--   * all uc_packages rows
--   * all uc_recharge_requests rows
--   * all files in the uc-proofs storage bucket
--   * the bucket itself
--
-- HOW TO RUN:
--   psql "$DATABASE_URL" -f supabase/rollbacks/20260510000001_uc_recharge_rollback.sql
-- or paste into Supabase SQL editor.
-- =============================================================================

begin;

-- 1) drop policies on storage.objects (must drop before deleting bucket cleanly)
drop policy if exists "Authenticated upload uc-proofs own folder" on storage.objects;
drop policy if exists "Owner read uc-proofs" on storage.objects;
drop policy if exists "Admin all uc-proofs" on storage.objects;

-- 2) delete all stored objects in the bucket, then the bucket
delete from storage.objects where bucket_id = 'uc-proofs';
delete from storage.buckets where id = 'uc-proofs';

-- 3) drop tables (cascade clears policies, indexes, triggers)
drop table if exists public.uc_recharge_requests cascade;
drop table if exists public.uc_packages cascade;

-- 4) drop the request-number sequence
drop sequence if exists uc_request_number_seq;

-- 5) remove the migration row so supabase CLI doesn't think it's still applied
delete from supabase_migrations.schema_migrations where version = '20260510000001';

commit;
