-- =============================================================================
-- Tighten event_signups insert policy.
--
-- The original (in 20260425000002_rls.sql) was named *_anon_insert and let
-- anyone with the public anon key write a signup row by-passing the server
-- action's auth check. Server actions also use the service-role client today
-- (which bypasses RLS anyway), so this policy is purely defence in depth for
-- the case where someone calls the anon REST endpoint directly.
--
-- New rule: must be authenticated AND must insert with user_id = auth.uid().
-- Active-window check on the parent event is preserved.
-- =============================================================================

drop policy if exists event_signups_anon_insert on public.event_signups;

create policy event_signups_self_insert on public.event_signups
  for insert with check (
    auth.uid() is not null
    and auth.uid() = user_id
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status in ('open', 'upcoming')
        and e.registration_closes_at > now()
    )
  );
