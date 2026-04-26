-- ============================================================================
-- Silent Hell Esports — Storage buckets
-- Public-read buckets for media that ships with the public site.
-- Writes are admin-only via the service-role client.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('players', 'players', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif']),
  ('products', 'products', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif']),
  ('giveaways', 'giveaways', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif']),
  ('pages', 'pages', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do nothing;

-- Public read policies for each bucket
create policy "Public read players" on storage.objects
  for select using (bucket_id = 'players');
create policy "Public read products" on storage.objects
  for select using (bucket_id = 'products');
create policy "Public read giveaways" on storage.objects
  for select using (bucket_id = 'giveaways');
create policy "Public read pages" on storage.objects
  for select using (bucket_id = 'pages');

-- Admin write policies
create policy "Admin write players" on storage.objects
  for all using (bucket_id = 'players' and public.is_admin())
  with check (bucket_id = 'players' and public.is_admin());
create policy "Admin write products" on storage.objects
  for all using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());
create policy "Admin write giveaways" on storage.objects
  for all using (bucket_id = 'giveaways' and public.is_admin())
  with check (bucket_id = 'giveaways' and public.is_admin());
create policy "Admin write pages" on storage.objects
  for all using (bucket_id = 'pages' and public.is_admin())
  with check (bucket_id = 'pages' and public.is_admin());
