-- ============================================================================
-- Silent Hell Esports — Row Level Security
-- Default-deny on every table; explicit policies for what's allowed.
-- ============================================================================

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);
create policy profiles_admin_read on public.profiles
  for select using (public.is_admin());
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()))
  with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- site_config — public read, admin write
-- ----------------------------------------------------------------------------
alter table public.site_config enable row level security;

create policy site_config_public_read on public.site_config for select using (true);
create policy site_config_admin_all on public.site_config
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- players
-- ----------------------------------------------------------------------------
alter table public.players enable row level security;

create policy players_public_read on public.players for select using (is_active);
create policy players_admin_read_all on public.players for select using (public.is_admin());
create policy players_admin_all on public.players
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- trophies
-- ----------------------------------------------------------------------------
alter table public.trophies enable row level security;

create policy trophies_public_read on public.trophies for select using (true);
create policy trophies_admin_all on public.trophies
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
alter table public.events enable row level security;

create policy events_public_read on public.events for select using (status <> 'cancelled');
create policy events_admin_read_all on public.events for select using (public.is_admin());
create policy events_admin_all on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- event_signups
-- ----------------------------------------------------------------------------
alter table public.event_signups enable row level security;

create policy event_signups_self_read on public.event_signups
  for select using (auth.uid() = user_id);
create policy event_signups_admin_read on public.event_signups
  for select using (public.is_admin());

-- Anyone (including anon) can insert if the event is open;
-- the capacity trigger is the final guard.
create policy event_signups_anon_insert on public.event_signups
  for insert with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status in ('open','upcoming')
        and e.registration_closes_at > now()
    )
  );

create policy event_signups_admin_all on public.event_signups
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- products + variants
-- ----------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

create policy products_public_read on public.products for select using (is_active);
create policy products_admin_read_all on public.products for select using (public.is_admin());
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy variants_public_read on public.product_variants for select using (
  is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
create policy variants_admin_all on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- orders + items
-- ----------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy orders_self_read on public.orders for select using (auth.uid() = user_id);
create policy orders_admin_read on public.orders for select using (public.is_admin());
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

create policy order_items_self_read on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy order_items_admin_all on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- NOTE: Order INSERTs go through the service-role client in server actions,
-- which bypass RLS. We do not allow direct anon/authenticated inserts.

-- ----------------------------------------------------------------------------
-- giveaways + entries
-- ----------------------------------------------------------------------------
alter table public.giveaways enable row level security;
alter table public.giveaway_entries enable row level security;

create policy giveaways_public_read on public.giveaways
  for select using (status in ('active','drawing','completed'));
create policy giveaways_admin_read_all on public.giveaways for select using (public.is_admin());
create policy giveaways_admin_all on public.giveaways
  for all using (public.is_admin()) with check (public.is_admin());

create policy giveaway_entries_self_read on public.giveaway_entries
  for select using (auth.uid() = user_id);
create policy giveaway_entries_admin_read on public.giveaway_entries
  for select using (public.is_admin());
create policy giveaway_entries_anon_insert on public.giveaway_entries
  for insert with check (
    exists (
      select 1 from public.giveaways g
      where g.id = giveaway_id
        and g.status = 'active'
        and g.starts_at <= now()
        and g.ends_at > now()
    )
  );
create policy giveaway_entries_admin_all on public.giveaway_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- pages
-- ----------------------------------------------------------------------------
alter table public.pages enable row level security;

create policy pages_public_read on public.pages for select using (is_published);
create policy pages_admin_read_all on public.pages for select using (public.is_admin());
create policy pages_admin_all on public.pages
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- admin_audit_log — admin read only, inserts via service role
-- ----------------------------------------------------------------------------
alter table public.admin_audit_log enable row level security;

create policy audit_admin_read on public.admin_audit_log for select using (public.is_admin());
-- Inserts happen via service-role client only.

-- ----------------------------------------------------------------------------
-- yalidine_cache — server-only, no public access
-- ----------------------------------------------------------------------------
alter table public.yalidine_cache enable row level security;

create policy yalidine_cache_admin_read on public.yalidine_cache for select using (public.is_admin());
-- Writes happen via service-role client only (cron + on-demand fetches).
