-- ============================================================================
-- Silent Hell Esports — business-rule triggers
-- These enforce capacity, auto-close, stock and admin-bootstrap at the DB
-- level so the application cannot bypass them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at auto-touch
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_players_touch before update on public.players
  for each row execute function public.touch_updated_at();
create trigger trg_events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create trigger trg_products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger trg_giveaways_touch before update on public.giveaways
  for each row execute function public.touch_updated_at();
create trigger trg_pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Capacity guard — reject signups if event is full
-- ----------------------------------------------------------------------------
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  cap int;
  ev_status text;
  reg_closes timestamptz;
begin
  select capacity, status, registration_closes_at
    into cap, ev_status, reg_closes
    from public.events
    where id = new.event_id
    for update;

  if cap is null then
    raise exception 'Event % does not exist', new.event_id;
  end if;

  if ev_status not in ('open', 'upcoming') then
    raise exception 'Event % is not accepting signups (status=%)', new.event_id, ev_status
      using errcode = 'check_violation';
  end if;

  if reg_closes < now() then
    raise exception 'Registration for event % is closed', new.event_id
      using errcode = 'check_violation';
  end if;

  select count(*) into current_count
    from public.event_signups
    where event_id = new.event_id
      and status not in ('disqualified', 'withdrawn');

  if current_count >= cap then
    raise exception 'Event % is full (% / %)', new.event_id, current_count, cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_event_capacity
  before insert on public.event_signups
  for each row execute function public.enforce_event_capacity();

-- ----------------------------------------------------------------------------
-- Stock non-negative guard for product variants
-- (CHECK constraint already covers it; this trigger gives a friendlier error.)
-- ----------------------------------------------------------------------------
create or replace function public.enforce_stock_non_negative()
returns trigger
language plpgsql
as $$
begin
  if new.stock_quantity < 0 then
    raise exception 'Stock for SKU % cannot go below 0 (attempted %)', new.sku, new.stock_quantity
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_variant_stock
  before update on public.product_variants
  for each row execute function public.enforce_stock_non_negative();

-- ----------------------------------------------------------------------------
-- Auto-close events whose registration window has passed
-- Runs whenever an event is read in a way that would matter; cheap to call.
-- ----------------------------------------------------------------------------
create or replace function public.auto_close_event()
returns trigger
language plpgsql
as $$
begin
  if new.registration_closes_at < now() and new.status = 'open' then
    new.status = 'closed';
  end if;
  return new;
end;
$$;

create trigger trg_event_auto_close
  before update on public.events
  for each row execute function public.auto_close_event();

-- A scheduled job (set up via Supabase cron) should run this periodically.
create or replace function public.close_stale_events()
returns int
language plpgsql
security definer
as $$
declare
  affected int;
begin
  update public.events
    set status = 'closed'
    where status in ('open', 'upcoming')
      and registration_closes_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- ----------------------------------------------------------------------------
-- Profile auto-create on auth signup + admin bootstrap
-- The first user to sign up with ADMIN_BOOTSTRAP_EMAIL is auto-promoted.
-- The bootstrap email is read from app.settings.admin_bootstrap_email
-- (set via `alter database postgres set app.settings.admin_bootstrap_email = '...'`)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text;
  new_role text := 'customer';
begin
  begin
    bootstrap_email := current_setting('app.settings.admin_bootstrap_email', true);
  exception when others then
    bootstrap_email := null;
  end;

  if bootstrap_email is not null
     and lower(bootstrap_email) = lower(new.email)
     and not exists (select 1 from public.profiles where role = 'admin') then
    new_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null), new_role)
    on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
