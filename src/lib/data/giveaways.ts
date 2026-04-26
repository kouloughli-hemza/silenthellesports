import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Giveaway } from "@/types/domain";

export async function getActiveGiveaway(): Promise<Giveaway | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("status", "active")
    .order("ends_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Giveaway;
}

export async function getCompletedGiveaways(limit = 6): Promise<Giveaway[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("status", "completed")
    .order("ends_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Giveaway[];
}

export async function getGiveawayBySlug(slug: string): Promise<Giveaway | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("giveaways")
    .select("*")
    .eq("slug", slug)
    .in("status", ["active", "drawing", "completed"])
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Giveaway;
}

export async function getGiveawayEntryCount(giveawayId: string): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("giveaway_entries")
    .select("id", { count: "exact", head: true })
    .eq("giveaway_id", giveawayId);
  if (error || count == null) return 0;
  return count;
}
