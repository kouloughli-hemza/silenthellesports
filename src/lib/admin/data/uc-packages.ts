import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type UcPackage = Row<"uc_packages">;

export async function listUcPackagesAdmin(): Promise<UcPackage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_packages")
    .select("*")
    .order("display_order", { ascending: true })
    .order("uc_amount", { ascending: true });
  if (error) throw new Error(`listUcPackagesAdmin: ${error.message}`);
  return (data ?? []) as UcPackage[];
}

export async function listActiveUcPackages(): Promise<UcPackage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_packages")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("uc_amount", { ascending: true });
  if (error) throw new Error(`listActiveUcPackages: ${error.message}`);
  return (data ?? []) as UcPackage[];
}

export async function getUcPackage(id: string): Promise<UcPackage | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("uc_packages")
    .select("*")
    .eq("id", id)
    .maybeSingle<UcPackage>();
  if (error) throw new Error(`getUcPackage: ${error.message}`);
  return data;
}
