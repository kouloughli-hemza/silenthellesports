-- =============================================================================
-- Store submitter IP + indexes for the per-phone / per-IP rate limit on
-- anonymous UC submissions.
-- =============================================================================

alter table public.uc_recharge_requests
  add column if not exists submitter_ip text;

create index if not exists idx_uc_requests_ip_created
  on public.uc_recharge_requests(submitter_ip, created_at desc)
  where submitter_ip is not null;

create index if not exists idx_uc_requests_phone_created
  on public.uc_recharge_requests(whatsapp_phone, created_at desc);
