// Server-only order reads. Uses the admin (service-role) client so the
// success page can show the order even when no auth session is present.

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem } from "@/types/domain";

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  if (!/^SH-\d{4}-\d{4,}$/.test(orderNumber)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}
