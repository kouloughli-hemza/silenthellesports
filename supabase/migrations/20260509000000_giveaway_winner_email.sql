-- =============================================================================
-- Persist the winner's email + the chosen entry on the giveaways row.
--
-- Before this migration, drawWinnerAction wrote only `winner_user_id` to the
-- giveaways table. Anonymous entries left winner_user_id null, and even for
-- authed entries there was no UI surface to recover the email after refresh.
-- The audit log carried it but admins couldn't see it.
-- =============================================================================

alter table public.giveaways
  add column if not exists winner_email text,
  add column if not exists winner_entry_id uuid references public.giveaway_entries(id) on delete set null;

create index if not exists idx_giveaways_winner_entry on public.giveaways(winner_entry_id);
