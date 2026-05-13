-- =============================================================================
-- UC recharge: drop the login requirement.
--
-- Previously required Google sign-in to cut spam; we replaced that
-- protection with phone + IP rate limiting in the server action. Now
-- accept anonymous submissions.
--
-- Changes:
-- 1. uc_recharge_requests.user_id is now nullable (anonymous = NULL).
-- 2. self-read RLS policy is dropped since there's no longer a user
--    identity to scope by. Public status page still works because it
--    goes through the admin client (service-role) by request_number.
-- =============================================================================

begin;

alter table public.uc_recharge_requests
  alter column user_id drop not null;

drop policy if exists uc_requests_self_read on public.uc_recharge_requests;

commit;
