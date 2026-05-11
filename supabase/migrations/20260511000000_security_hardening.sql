-- =============================================================================
-- Security hardening pass — 2026-05-11
--
-- 1. uc_recharge_requests: switch from sequential UC-YYYY-NNNN (guessable,
--    enumerable) to UC-YYYY-{8 random hex chars}. The public status page
--    exposes WhatsApp + IGN, so guessable URLs are a real PII leak.
--    Existing rows keep their old numbers (we don't rewrite them).
--
-- 2. uc-proofs bucket: drop application/pdf, image/heic, image/heif from the
--    allowed list. Only PNG/JPEG/WebP, validated by magic bytes server-side.
--
-- 3. giveaway_entries: tighten the anon insert policy. Was:
--      "anyone can insert as long as the giveaway is active"
--    which let any holder of the public anon key write entries by-passing
--    the server action. Now requires auth.uid() = user_id, plus the active
--    window check. Service-role inserts (the actual server action path)
--    are unaffected because service-role bypasses RLS.
-- =============================================================================

begin;

-- 1) Random UC request numbers — using gen_random_uuid (built-in, no extension
--    needed) and taking the first 8 hex chars. 2^32 keyspace, enumeration-proof
--    for the volumes this site will see.
alter table public.uc_recharge_requests
  alter column request_number set default
    'UC-' || to_char(now(), 'YYYY') || '-' ||
    upper(substring(replace(gen_random_uuid()::text, '-', '') for 8));

-- 2) Tighten uc-proofs bucket allowed_mime_types
update storage.buckets
  set allowed_mime_types = array['image/png','image/jpeg','image/webp']
  where id = 'uc-proofs';

-- 3) Lock down giveaway_entries insert
drop policy if exists giveaway_entries_anon_insert on public.giveaway_entries;
create policy giveaway_entries_self_insert on public.giveaway_entries
  for insert with check (
    auth.uid() is not null
    and auth.uid() = user_id
    and exists (
      select 1 from public.giveaways g
      where g.id = giveaway_id
        and g.status = 'active'
        and g.starts_at <= now()
        and g.ends_at > now()
    )
  );

commit;
