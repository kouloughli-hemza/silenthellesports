-- =============================================================================
-- Silent Hell Esports — hero gallery
-- Admin-managed photos shown in the hero's rotating cinematic frame.
-- =============================================================================

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption jsonb not null default '{"en":"","ar":""}'::jsonb,           -- {en, ar}
  meta jsonb not null default '{"en":"","ar":""}'::jsonb,              -- {en, ar} — sub-line / event tag
  hud_heading text,                                                    -- e.g. "047°"
  hud_zone text,                                                       -- e.g. "ZONE 3"
  hud_signal text,                                                     -- e.g. "98%"
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_gallery_images_active_order
  on public.gallery_images (is_active, display_order);

create trigger trg_gallery_images_touch
  before update on public.gallery_images
  for each row execute function public.touch_updated_at();

alter table public.gallery_images enable row level security;

create policy gallery_images_public_read on public.gallery_images
  for select using (is_active);

create policy gallery_images_admin_all on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Storage bucket
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('gallery', 'gallery', true, 5242880, array['image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "Public read gallery" on storage.objects
  for select using (bucket_id = 'gallery');

create policy "Admin write gallery" on storage.objects
  for all using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());
