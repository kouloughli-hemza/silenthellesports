-- Silent Hell Esports — team chronicle (timeline) and stats wall.
-- Two new admin-managed surfaces:
--   * team_milestones: dated entries forming the team's history
--   * team_stats: short flex stats (counters) shown on the home page

-- =============================================================================
-- team_milestones
-- =============================================================================
create table public.team_milestones (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  category text not null
    check (
      category in (
        'founding',
        'tournament_win',
        'roster',
        'milestone',
        'release',
        'partnership',
        'other'
      )
    ),
  title jsonb not null,                            -- {en, ar}
  description jsonb not null default '{"en":"","ar":""}'::jsonb,
  image_url text,
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_team_milestones_date on public.team_milestones (occurred_on desc);
create index idx_team_milestones_published on public.team_milestones (is_published);

create trigger trg_team_milestones_touch
  before update on public.team_milestones
  for each row execute function public.touch_updated_at();

alter table public.team_milestones enable row level security;

create policy team_milestones_public_read on public.team_milestones
  for select using (is_published);

create policy team_milestones_admin_all on public.team_milestones
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- team_stats
-- =============================================================================
create table public.team_stats (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                        -- slug, e.g. 'total_kills'
  label jsonb not null,                            -- {en, ar}
  value bigint not null default 0,
  suffix text,                                     -- e.g. '+', 'M', 'h'
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_team_stats_order on public.team_stats (display_order asc);

create trigger trg_team_stats_touch
  before update on public.team_stats
  for each row execute function public.touch_updated_at();

alter table public.team_stats enable row level security;

create policy team_stats_public_read on public.team_stats
  for select using (is_published);

create policy team_stats_admin_all on public.team_stats
  for all using (public.is_admin()) with check (public.is_admin());
