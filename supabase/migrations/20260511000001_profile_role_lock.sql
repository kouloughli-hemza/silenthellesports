-- =============================================================================
-- Critical: plug role-escalation hole in profiles_self_update.
--
-- The original policy (in 20260425000002_rls.sql) put the role-immutability
-- check in USING (which gates the OLD row) instead of WITH CHECK (which gates
-- the NEW row). Net effect: any authenticated user could call
--
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
--
-- via the public anon-key client and grant themselves admin. This migration
-- moves the role check to WITH CHECK so the NEW row's role must equal the
-- user's CURRENT stored role.
-- =============================================================================

drop policy if exists profiles_self_update on public.profiles;

create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );
