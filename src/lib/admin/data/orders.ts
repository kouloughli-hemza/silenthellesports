import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderItem } from "@/types/domain";

export type OrderStatus = Order["status"];

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderSortField = "created_at" | "total" | "order_number" | "status" | "customer_name";
export const ORDER_SORT_FIELDS: readonly OrderSortField[] = [
  "created_at",
  "total",
  "order_number",
  "status",
  "customer_name",
] as const;

export interface OrderListQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  q?: string;
  sort: OrderSortField;
  dir: "asc" | "desc";
}

export interface OrderListResult {
  rows: Order[];
  total: number;
}

export async function listOrders(query: OrderListQuery): Promise<OrderListResult> {
  const supabase = createAdminClient();
  let q = supabase.from("orders").select("*", { count: "exact" });

  if (query.status) q = q.eq("status", query.status);
  if (query.q && query.q.trim().length > 0) {
    const term = query.q.trim().replace(/[%_]/g, "");
    // ILIKE on order_number or customer_phone via .or()
    q = q.or(`order_number.ilike.%${term}%,customer_phone.ilike.%${term}%`);
  }

  q = q.order(query.sort, { ascending: query.dir === "asc" });

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error || !data) return { rows: [], total: count ?? 0 };
  return { rows: data as unknown as Order[], total: count ?? 0 };
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export async function getOrderByNumberAdmin(
  orderNumber: string,
): Promise<OrderWithItems | null> {
  if (!/^SH-\d{4}-\d{3,}$/.test(orderNumber)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}
