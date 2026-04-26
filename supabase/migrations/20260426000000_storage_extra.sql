-- ============================================================================
-- Silent Hell Esports — Storage buckets (additions)
-- Adds trophies + events buckets so admin image upload can target them.
-- Idempotent on bucket creation; policies guarded by IF NOT EXISTS.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('trophies', 'trophies', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif']),
  ('events', 'events', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read trophies') then
    create policy "Public read trophies" on storage.objects
      for select using (bucket_id = 'trophies');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read events') then
    create policy "Public read events" on storage.objects
      for select using (bucket_id = 'events');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin write trophies') then
    create policy "Admin write trophies" on storage.objects
      for all using (bucket_id = 'trophies' and public.is_admin())
      with check (bucket_id = 'trophies' and public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin write events') then
    create policy "Admin write events" on storage.objects
      for all using (bucket_id = 'events' and public.is_admin())
      with check (bucket_id = 'events' and public.is_admin());
  end if;
end $$;
