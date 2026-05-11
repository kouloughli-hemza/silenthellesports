import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type UcRequest = Row<"uc_recharge_requests">;
export type UcRequestStatus = UcRequest["status"];

export const UC_REQUEST_STATUSES: readonly UcRequestStatus[] = [
  "pending",
  "payment_received",
  "delivered",
  "rejected",
  "cancelled",
] as const;

export interface UcRequestListQuery {
  page: number;
  pageSize: number;
  status?: UcRequestStatus;
  q?: string;
}

export interface UcRequestListResult {
  rows: UcRequest[];
  total: number;
}

export async function listUcRequests(
  query: UcRequestListQuery,
): Promise<UcRequestListResult> {
  const supabase = createAdminClient();
  let q = supabase.from("uc_recharge_requests").select("*", { count: "exact" });

  if (query.status) q = q.eq("status", query.status);
  if (query.q && query.q.trim().length > 0) {
    const term = query.q.trim().replace(/[%_]/g, "");
    q = q.or(
      `request_number.ilike.%${term}%,pubg_id.ilike.%${term}%,whatsapp_phone.ilike.%${term}%,transfer_code.ilike.%${term}%`,
    );
  }

  q = q.order("created_at", { ascending: false });
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error || !data) return { rows: [], total: count ?? 0 };
  return { rows: data as unknown as UcRequest[], total: count ?? 0 };
}

export async function getUcRequestByNumber(
  requestNumber: string,
): Promise<UcRequest | null> {
  if (!/^UC-\d{4}-\d{3,}$/.test(requestNumber)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_recharge_requests")
    .select("*")
    .eq("request_number", requestNumber)
    .maybeSingle<UcRequest>();
  if (error) return null;
  return data;
}

// For admin to view the customer's payment proof (private bucket).
// 1-hour signed URL is enough for in-page viewing without leaking.
export async function getProofSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("uc-proofs")
    .createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}
