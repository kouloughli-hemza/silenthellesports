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

export interface OrderListRow extends Order {
  // product_ids this customer (matched by user_id, else customer_phone) has
  // bought across more than one distinct order. Used to flag possible abuse
  // of free-for-24h product promos in the admin list.
  duplicateProductIds: string[];
}

export interface OrderListResult {
  rows: OrderListRow[];
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
  const baseRows = data as unknown as Order[];
  const rows = await flagDuplicateProducts(supabase, baseRows);
  return { rows, total: count ?? 0 };
}

function customerKeyOf(o: { user_id: string | null; customer_phone: string | null }): string | null {
  if (o.user_id) return `u:${o.user_id}`;
  if (o.customer_phone) return `p:${o.customer_phone}`;
  return null;
}

async function flagDuplicateProducts(
  supabase: ReturnType<typeof createAdminClient>,
  baseRows: Order[],
): Promise<OrderListRow[]> {
  if (baseRows.length === 0) return [];

  const userIds = Array.from(
    new Set(baseRows.map((r) => r.user_id).filter((v): v is string => !!v)),
  );
  const phones = Array.from(
    new Set(
      baseRows
        .filter((r) => !r.user_id && r.customer_phone)
        .map((r) => r.customer_phone),
    ),
  );

  type SiblingRow = {
    id: string;
    user_id: string | null;
    customer_phone: string | null;
    order_items: { product_id: string }[];
  };

  const siblingQueries: PromiseLike<{ data: SiblingRow[] | null }>[] = [];
  if (userIds.length > 0) {
    siblingQueries.push(
      supabase
        .from("orders")
        .select("id, user_id, customer_phone, order_items(product_id)")
        .in("user_id", userIds)
        .then(({ data }) => ({ data: (data ?? null) as SiblingRow[] | null })),
    );
  }
  if (phones.length > 0) {
    siblingQueries.push(
      supabase
        .from("orders")
        .select("id, user_id, customer_phone, order_items(product_id)")
        .in("customer_phone", phones)
        .then(({ data }) => ({ data: (data ?? null) as SiblingRow[] | null })),
    );
  }

  // customerKey -> product_id -> Set<order_id>
  const purchases = new Map<string, Map<string, Set<string>>>();
  if (siblingQueries.length > 0) {
    const results = await Promise.all(siblingQueries);
    for (const res of results) {
      for (const sib of res.data ?? []) {
        const key = customerKeyOf(sib);
        if (!key) continue;
        let perProduct = purchases.get(key);
        if (!perProduct) {
          perProduct = new Map();
          purchases.set(key, perProduct);
        }
        for (const item of sib.order_items ?? []) {
          let orderSet = perProduct.get(item.product_id);
          if (!orderSet) {
            orderSet = new Set();
            perProduct.set(item.product_id, orderSet);
          }
          orderSet.add(sib.id);
        }
      }
    }
  }

  // Map each page row to its product_ids on this order so we can intersect
  // with the customer's full purchase history.
  const pageOrderIds = baseRows.map((r) => r.id);
  const { data: pageItems } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", pageOrderIds);
  const productsByOrder = new Map<string, string[]>();
  for (const it of (pageItems ?? []) as { order_id: string; product_id: string }[]) {
    const arr = productsByOrder.get(it.order_id) ?? [];
    arr.push(it.product_id);
    productsByOrder.set(it.order_id, arr);
  }

  return baseRows.map((row) => {
    const key = customerKeyOf(row);
    const perProduct = key ? purchases.get(key) : undefined;
    const myProducts = productsByOrder.get(row.id) ?? [];
    const dupes: string[] = [];
    if (perProduct) {
      for (const pid of myProducts) {
        const orderSet = perProduct.get(pid);
        if (orderSet && orderSet.size > 1) dupes.push(pid);
      }
    }
    return { ...row, duplicateProductIds: Array.from(new Set(dupes)) };
  });
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface DuplicateOrderInfo {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: string | number;
  currency: string;
  created_at: string;
  sharedProductNames: string[];
}

// For an admin order detail view: find OTHER orders by the same customer
// (matched by user_id, falling back to phone) that contain at least one of
// the same products as this order. Returned sorted oldest-first so the admin
// can see which order came first and decide which to cancel.
export async function findDuplicateOrdersForOrder(
  orderId: string,
): Promise<DuplicateOrderInfo[]> {
  const supabase = createAdminClient();

  const { data: thisOrder } = await supabase
    .from("orders")
    .select("id, user_id, customer_phone, order_items(product_id, product_name_snapshot)")
    .eq("id", orderId)
    .maybeSingle<{
      id: string;
      user_id: string | null;
      customer_phone: string | null;
      order_items: { product_id: string; product_name_snapshot: string }[];
    }>();
  if (!thisOrder) return [];

  const myProductIds = Array.from(
    new Set((thisOrder.order_items ?? []).map((i) => i.product_id)),
  );
  if (myProductIds.length === 0) return [];

  const productNameById = new Map<string, string>();
  for (const it of thisOrder.order_items ?? []) {
    if (!productNameById.has(it.product_id)) {
      productNameById.set(it.product_id, it.product_name_snapshot);
    }
  }

  type SiblingOrder = {
    id: string;
    order_number: string;
    status: OrderStatus;
    total: string | number;
    currency: string;
    created_at: string;
    user_id: string | null;
    customer_phone: string | null;
    order_items: { product_id: string }[];
  };

  const queries: PromiseLike<{ data: SiblingOrder[] | null }>[] = [];
  if (thisOrder.user_id) {
    queries.push(
      supabase
        .from("orders")
        .select(
          "id, order_number, status, total, currency, created_at, user_id, customer_phone, order_items(product_id)",
        )
        .eq("user_id", thisOrder.user_id)
        .neq("id", orderId)
        .then(({ data }) => ({ data: (data ?? null) as SiblingOrder[] | null })),
    );
  } else if (thisOrder.customer_phone) {
    queries.push(
      supabase
        .from("orders")
        .select(
          "id, order_number, status, total, currency, created_at, user_id, customer_phone, order_items(product_id)",
        )
        .eq("customer_phone", thisOrder.customer_phone)
        .neq("id", orderId)
        .then(({ data }) => ({ data: (data ?? null) as SiblingOrder[] | null })),
    );
  }
  if (queries.length === 0) return [];

  const seen = new Map<string, DuplicateOrderInfo>();
  const results = await Promise.all(queries);
  for (const res of results) {
    for (const sib of res.data ?? []) {
      const sharedIds = (sib.order_items ?? [])
        .map((i) => i.product_id)
        .filter((pid) => myProductIds.includes(pid));
      if (sharedIds.length === 0) continue;
      if (seen.has(sib.id)) continue;
      const sharedProductNames = Array.from(
        new Set(
          sharedIds
            .map((pid) => productNameById.get(pid) ?? null)
            .filter((v): v is string => !!v),
        ),
      );
      seen.set(sib.id, {
        id: sib.id,
        order_number: sib.order_number,
        status: sib.status,
        total: sib.total,
        currency: sib.currency,
        created_at: sib.created_at,
        sharedProductNames,
      });
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
  );
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
