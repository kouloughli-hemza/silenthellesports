-- =============================================================================
-- Silent Hell Esports — PUBG Mobile UC recharge
--
-- Customer picks a UC package, sends payment via BaridiMob/CCP, uploads proof,
-- gets a request number + status page. Admin reviews proof, marks payment
-- received, delivers UC in-game, and notifies the customer via WhatsApp
-- click-to-message.
--
-- ROLLBACK: see supabase/rollbacks/20260510000001_uc_recharge_rollback.sql
-- =============================================================================

-- ----------------------------------------------------------------------------
-- uc_packages — admin-managed price tiers
-- ----------------------------------------------------------------------------
create table public.uc_packages (
  id uuid primary key default gen_random_uuid(),
  uc_amount int not null check (uc_amount > 0),
  bonus_uc int not null default 0 check (bonus_uc >= 0),
  price_dzd numeric not null check (price_dzd > 0),
  label text,                                            -- optional badge text e.g. "BEST VALUE"
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_uc_packages_active_order
  on public.uc_packages (is_active, display_order);

create trigger trg_uc_packages_touch
  before update on public.uc_packages
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- uc_recharge_requests — one row per customer submission
-- ----------------------------------------------------------------------------
create sequence if not exists uc_request_number_seq;

create table public.uc_recharge_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null default
    'UC-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('uc_request_number_seq')::text, 4, '0'),
  user_id uuid not null references public.profiles,
  package_id uuid not null references public.uc_packages,

  -- snapshot package details so price/UC shown to customer is locked-in
  uc_amount_snapshot int not null,
  bonus_uc_snapshot int not null default 0,
  price_dzd_snapshot numeric not null,

  -- in-game target
  pubg_id text not null,
  ign text not null,

  -- payment
  payment_method text not null check (payment_method in ('baridimob','ccp')),
  transfer_code text,                  -- BaridiMob ref / CCP slip number; nullable
  proof_url text not null,             -- storage path inside uc-proofs bucket

  -- contact
  whatsapp_phone text not null,
  email text,

  -- workflow
  status text not null default 'pending'
    check (status in ('pending','payment_received','delivered','rejected','cancelled')),
  admin_notes text,
  delivery_screenshot_url text,        -- proof of UC delivered, set when status=delivered
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_uc_requests_status on public.uc_recharge_requests(status);
create index idx_uc_requests_user on public.uc_recharge_requests(user_id);
create index idx_uc_requests_transfer_code
  on public.uc_recharge_requests(transfer_code)
  where transfer_code is not null;

create trigger trg_uc_requests_touch
  before update on public.uc_recharge_requests
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.uc_packages enable row level security;
alter table public.uc_recharge_requests enable row level security;

create policy uc_packages_public_read on public.uc_packages
  for select using (is_active);
create policy uc_packages_admin_read_all on public.uc_packages
  for select using (public.is_admin());
create policy uc_packages_admin_all on public.uc_packages
  for all using (public.is_admin()) with check (public.is_admin());

create policy uc_requests_self_read on public.uc_recharge_requests
  for select using (auth.uid() = user_id);
create policy uc_requests_admin_read on public.uc_recharge_requests
  for select using (public.is_admin());
create policy uc_requests_admin_all on public.uc_recharge_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- INSERTs go through the service-role client in the server action so we can
-- normalize phone, generate the request number, and validate the proof upload.
-- No anon/authenticated insert policy on purpose.

-- ----------------------------------------------------------------------------
-- Storage bucket — uc-proofs (PRIVATE, signed URLs only)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uc-proofs', 'uc-proofs', false, 8388608,
   array['image/png','image/jpeg','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do nothing;

-- Authenticated user can upload only into their own folder: {user_id}/...
create policy "Authenticated upload uc-proofs own folder" on storage.objects
  for insert
  with check (
    bucket_id = 'uc-proofs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read own proofs (rare — admin reads via service role)
create policy "Owner read uc-proofs" on storage.objects
  for select using (
    bucket_id = 'uc-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin reads/writes all
create policy "Admin all uc-proofs" on storage.objects
  for all using (bucket_id = 'uc-proofs' and public.is_admin())
  with check (bucket_id = 'uc-proofs' and public.is_admin());
