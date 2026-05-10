-- =============================================================================
-- Auto-decrement product_variants.stock_quantity on order_items insert
-- (and increment back if a line is deleted, e.g. order cancellation cleanup).
--
-- Before this migration, checkout only validated stock at the app layer and
-- never wrote it back, so /store appeared to never sell out. The CHECK
-- constraint + existing trg_variant_stock guard catch over-selling at the
-- db level if two orders race for the last unit.
-- =============================================================================

create or replace function public.apply_order_item_stock_delta()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    if new.variant_id is not null and new.quantity > 0 then
      update public.product_variants
        set stock_quantity = stock_quantity - new.quantity
        where id = new.variant_id;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.variant_id is not null and old.quantity > 0 then
      update public.product_variants
        set stock_quantity = stock_quantity + old.quantity
        where id = old.variant_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_order_item_stock on public.order_items;
create trigger trg_order_item_stock
  after insert or delete on public.order_items
  for each row execute function public.apply_order_item_stock_delta();
