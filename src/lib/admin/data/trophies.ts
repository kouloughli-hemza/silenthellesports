import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type Trophy = Row<"trophies">;

export async function listTrophies(): Promise<Trophy[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trophies")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(`listTrophies: ${error.message}`);
  return (data ?? []) as Trophy[];
}

export async function getTrophy(id: string): Promise<Trophy | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trophies")
    .select("*")
    .eq("id", id)
    .maybeSingle<Trophy>();
  if (error) throw new Error(`getTrophy: ${error.message}`);
  return data;
}
