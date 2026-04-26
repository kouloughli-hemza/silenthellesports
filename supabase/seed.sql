-- ============================================================================
-- Silent Hell Esports — local dev seed
-- Minimal site_config defaults. Roster, trophies, products, events, giveaways
-- are seeded via `npm run seed:liquipedia` (real data) or via the admin UI.
-- ============================================================================

insert into public.site_config (key, value) values
  ('hero.headline', '{"l1":{"en":"We don''t","ar":"نحن لا"},"l2":{"en":"make noise.","ar":"نُحدِث ضجيجاً."},"l3":{"en":"We make","ar":"نحن نصنع"},"l4":{"en":"winners.","ar":"الأبطال."}}'::jsonb),
  ('hero.tagline', '{"en":"The last sound you don''t hear.","ar":"آخر صوت لن تسمعه."}'::jsonb),
  ('hero.stats', '{"enemies":1847,"tournaments":3,"kd":4.21,"headshot":64}'::jsonb),
  ('hero.season', '{"en":"SEASON 12 · ACTIVE","ar":"الموسم ١٢ · نشط"}'::jsonb),
  ('socials.discord_url', '"https://discord.gg/silenthell"'::jsonb),
  ('socials.discord_member_count', '"18.4K"'::jsonb),
  ('socials.twitch_channel', '"silenthell"'::jsonb),
  ('socials.youtube_channel', '"@SilentHellEsports"'::jsonb),
  ('socials.x_handle', '"SilentHellGG"'::jsonb),
  ('socials.instagram_handle', '"silenthell.esports"'::jsonb),
  ('store.current_drop', '3'::jsonb),
  ('store.featured_collection_ends_at', '"2026-05-30T20:00:00Z"'::jsonb),
  ('giveaway.current_drop', '3'::jsonb),
  ('sponsors', '["Logitech G","Red Bull Gaming","HyperX","Victrix","Monster Energy"]'::jsonb),
  ('shipping.from_wilaya_code', '16'::jsonb)
on conflict (key) do nothing;
