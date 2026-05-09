-- =============================================================================
-- Jersey-style custom name on products + order line snapshot.
--   * products.customization_enabled — admin per-product toggle. Default false
--     so every existing product behaves exactly as today.
--   * order_items.custom_name — text the buyer typed at add-to-cart, snapshotted
--     at checkout so old orders / line history survive product edits.
-- =============================================================================

alter table public.products
  add column if not exists customization_enabled boolean not null default false;

alter table public.order_items
  add column if not exists custom_name text;

-- Pull active+customizable products fast for the public detail page.
create index if not exists idx_products_customizable
  on public.products(customization_enabled)
  where customization_enabled;
