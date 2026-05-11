import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type UcPackagePublic = Pick<
  Row<"uc_packages">,
  "id" | "uc_amount" | "bonus_uc" | "price_dzd" | "label" | "display_order"
>;

export type UcRequestPublic = Pick<
  Row<"uc_recharge_requests">,
  | "id"
  | "request_number"
  | "uc_amount_snapshot"
  | "bonus_uc_snapshot"
  | "price_dzd_snapshot"
  | "pubg_id"
  | "ign"
  | "payment_method"
  | "transfer_code"
  | "whatsapp_phone"
  | "status"
  | "rejection_reason"
  | "created_at"
  | "updated_at"
>;

// Active packages ordered for the public picker grid.
export async function getActiveUcPackages(): Promise<UcPackagePublic[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_packages")
    .select("id, uc_amount, bonus_uc, price_dzd, label, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("uc_amount", { ascending: true });
  if (error || !data) return [];
  return data as UcPackagePublic[];
}

// Status page lookup. Reachable by URL — no login needed because the request
// number is unguessable and customer needs to share/bookmark it.
export async function getUcRequestPublic(
  requestNumber: string,
): Promise<UcRequestPublic | null> {
  // Accepts both legacy sequential (UC-2026-0001) and new random (UC-2026-A1B2C3D4) formats.
  if (!/^UC-\d{4}-[A-Z0-9]{3,16}$/.test(requestNumber)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_recharge_requests")
    .select(
      "id, request_number, uc_amount_snapshot, bonus_uc_snapshot, price_dzd_snapshot, pubg_id, ign, payment_method, transfer_code, whatsapp_phone, status, rejection_reason, created_at, updated_at",
    )
    .eq("request_number", requestNumber)
    .maybeSingle<UcRequestPublic>();
  if (error) return null;
  return data;
}
