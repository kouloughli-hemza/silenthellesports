-- ============================================================================
-- Silent Hell Esports — initial schema
-- Tables, RLS, triggers, indexes for the production site.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email citext unique not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role) where role = 'admin';

-- ============================================================================
-- site_config (key-value store)
-- ============================================================================
create table public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- ============================================================================
-- players (roster)
-- ============================================================================
create table public.players (
  id uuid primary key default gen_random_uuid(),
  ign text not null,
  real_name text,
  role text not null check (role in ('IGL','Sniper','Fragger','Support','Coach','Manager','Sub','Analyst','Assault','Scout')),
  country_code text,
  photo_url text,
  bio jsonb not null default '{"en":"","ar":""}'::jsonb,
  signature_loadout text,
  stats jsonb not null default '{}'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  display_order int not null default 0,
  is_active boolean not null default true,
  joined_at date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_players_ign_active on public.players(lower(ign)) where is_active;
create index idx_players_active_order on public.players(is_active, display_order);

-- ============================================================================
-- trophies
-- ============================================================================
create table public.trophies (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,
  tournament_name text not null,
  placement text not null,
  prize_amount numeric,
  prize_currency text not null default 'USD',
  date date not null,
  logo_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_trophies_date_desc on public.trophies(date desc);

-- ============================================================================
-- events
-- ============================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  description jsonb not null default '{"en":"","ar":""}'::jsonb,
  mode text not null check (mode in ('Solo','Duo','Squad')),
  map text,
  prize_pool numeric not null default 0,
  prize_currency text not null default 'DZD',
  entry_fee numeric not null default 0,
  capacity int not null check (capacity > 0),
  start_at timestamptz not null,
  registration_closes_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','open','closed','live','completed','cancelled')),
  cover_image_url text,
  rules jsonb not null default '{"en":"","ar":""}'::jsonb,
  tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_status_start on public.events(status, start_at);

-- ============================================================================
-- event_signups
-- ============================================================================
create table public.event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  user_id uuid references public.profiles,
  ign text not null,
  pubg_uid text not null,
  discord_tag text not null,
  contact_phone text not null,
  squad_members jsonb not null default '[]'::jsonb,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','waived','refunded')),
  status text not null default 'registered' check (status in ('registered','checked_in','disqualified','withdrawn')),
  notes text,
  confirmation_code text not null default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now(),
  unique(event_id, pubg_uid)
);

create index idx_event_signups_event on public.event_signups(event_id);
create index idx_event_signups_user on public.event_signups(user_id);

-- ============================================================================
-- products + variants
-- ============================================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null,
  description jsonb not null default '{"en":"","ar":""}'::jsonb,
  category text not null check (category in ('tee','hoodie','jersey','mousepad','cap','sticker','lanyard','other')),
  base_price numeric not null check (base_price >= 0),
  worn_by_player_id uuid references public.players,
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  weight_grams int not null default 500 check (weight_grams > 0),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_active on public.products(is_active, display_order);
create index idx_products_category on public.products(category) where is_active;
create index idx_products_worn_by on public.products(worn_by_player_id) where worn_by_player_id is not null;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  sku text unique not null,
  size text,
  color text,
  price_override numeric,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_variants_product on public.product_variants(product_id);

-- ============================================================================
-- orders + items
-- ============================================================================
create sequence if not exists order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default 'SH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0'),
  user_id uuid references public.profiles,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_wilaya_code int not null check (shipping_wilaya_code between 1 and 58),
  shipping_commune_name text not null,
  shipping_address text not null,
  is_stopdesk boolean not null default false,
  stopdesk_id int,
  subtotal numeric not null check (subtotal >= 0),
  shipping_fee numeric not null check (shipping_fee >= 0),
  total numeric not null check (total >= 0),
  currency text not null default 'DZD',
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled','returned')),
  yalidine_tracking text,
  yalidine_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_tracking on public.orders(yalidine_tracking) where yalidine_tracking is not null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid not null references public.products,
  variant_id uuid references public.product_variants,
  product_name_snapshot text not null,
  variant_label_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  line_total numeric not null check (line_total >= 0)
);

create index idx_order_items_order on public.order_items(order_id);

-- ============================================================================
-- giveaways + entries
-- ============================================================================
create table public.giveaways (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  description jsonb not null default '{"en":"","ar":""}'::jsonb,
  prize_description jsonb not null,
  prize_image_url text,
  estimated_value text,
  entry_methods jsonb not null default '[]'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','active','drawing','completed')),
  winner_user_id uuid references public.profiles,
  winner_announcement jsonb not null default '{"en":"","ar":""}'::jsonb,
  drop_number int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_giveaways_status on public.giveaways(status, ends_at);

create table public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.giveaways on delete cascade,
  user_id uuid references public.profiles,
  email citext not null,
  discord_tag text,
  completed_methods jsonb not null default '[]'::jsonb,
  entry_count int not null default 1 check (entry_count > 0),
  created_at timestamptz not null default now(),
  unique(giveaway_id, email)
);

create index idx_giveaway_entries_giveaway on public.giveaway_entries(giveaway_id);
create index idx_giveaway_entries_user on public.giveaway_entries(user_id) where user_id is not null;

-- ============================================================================
-- pages (CMS)
-- ============================================================================
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  body jsonb not null,
  is_published boolean not null default false,
  meta_description jsonb not null default '{"en":"","ar":""}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles
);

create index idx_pages_published on public.pages(slug) where is_published;

-- ============================================================================
-- admin_audit_log (referenced by SPEC §8)
-- ============================================================================
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_actor on public.admin_audit_log(actor_id, created_at desc);
create index idx_audit_entity on public.admin_audit_log(entity_type, entity_id, created_at desc);

-- ============================================================================
-- yalidine_cache (referenced by SPEC §9 — wilayas/communes/stopdesks K/V)
-- ============================================================================
create table public.yalidine_cache (
  key text primary key,
  value jsonb not null,
  refreshed_at timestamptz not null default now()
);
