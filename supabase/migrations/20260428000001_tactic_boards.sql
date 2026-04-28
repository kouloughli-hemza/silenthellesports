-- Tactical drop maps: an uploaded map image with a drop point and an early
-- rotation polyline overlaid on top. Admin-managed; can be toggled off
-- globally via site_config (`tactics.enabled`).

create table public.tactic_boards (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,                                          -- {en, ar}
  description jsonb not null default '{"en":"","ar":""}'::jsonb,
  map_name text not null,                                        -- "Erangel" / "Miramar" / etc.
  map_image_url text not null,
  drop_x numeric not null check (drop_x >= 0 and drop_x <= 100), -- percentage 0-100
  drop_y numeric not null check (drop_y >= 0 and drop_y <= 100),
  rotation_points jsonb not null default '[]'::jsonb,            -- [{x:0-100, y:0-100}, ...]
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tactic_boards_order on public.tactic_boards (display_order asc);
create index idx_tactic_boards_published on public.tactic_boards (is_published);

create trigger trg_tactic_boards_touch
  before update on public.tactic_boards
  for each row execute function public.touch_updated_at();

alter table public.tactic_boards enable row level security;

create policy tactic_boards_public_read on public.tactic_boards
  for select using (is_published);

create policy tactic_boards_admin_all on public.tactic_boards
  for all using (public.is_admin()) with check (public.is_admin());

-- Default site_config entry for the section toggle (true = visible).
insert into public.site_config (key, value)
values ('tactics.enabled', 'true'::jsonb)
on conflict (key) do nothing;
