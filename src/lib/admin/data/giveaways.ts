import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Giveaway, GiveawayEntry } from "@/types/domain";

export { GIVEAWAY_STATUSES, type GiveawayStatus } from "@/lib/admin/data/giveaways-enums";

export async function listGiveawaysAdmin(): Promise<Giveaway[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .order("ends_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as Giveaway[];
}

export async function getGiveawayByIdAdmin(id: string): Promise<Giveaway | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Giveaway;
}

export async function listEntriesForGiveaway(giveawayId: string): Promise<GiveawayEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("giveaway_entries")
    .select("*")
    .eq("giveaway_id", giveawayId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as GiveawayEntry[];
}
