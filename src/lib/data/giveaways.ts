import "server-only";
import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Giveaway } from "@/types/domain";

export const TAG_GIVEAWAYS = "giveaways";
const REVALIDATE = 60;

export async function getActiveGiveaway(): Promise<Giveaway | null> {
  return cache(
    async () => {
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
    },
    ["giveaways-active"],
    { revalidate: REVALIDATE, tags: [TAG_GIVEAWAYS] },
  )();
}

export async function getCompletedGiveaways(limit = 6): Promise<Giveaway[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("status", "completed")
        .order("ends_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data as unknown as Giveaway[];
    },
    ["giveaways-completed", String(limit)],
    { revalidate: REVALIDATE, tags: [TAG_GIVEAWAYS] },
  )();
}

export async function getGiveawayBySlug(slug: string): Promise<Giveaway | null> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("slug", slug)
        .in("status", ["active", "drawing", "completed"])
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as Giveaway;
    },
    ["giveaways-by-slug", slug],
    { revalidate: REVALIDATE, tags: [TAG_GIVEAWAYS, `giveaway:${slug}`] },
  )();
}

// Entry counts move quickly when a giveaway is live; keep them on a short
// cache window so the displayed total stays fresh without thundering Supabase.
export async function getGiveawayEntryCount(giveawayId: string): Promise<number> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { count, error } = await supabase
        .from("giveaway_entries")
        .select("id", { count: "exact", head: true })
        .eq("giveaway_id", giveawayId);
      if (error || count == null) return 0;
      return count;
    },
    ["giveaways-entries-count", giveawayId],
    { revalidate: 30, tags: [TAG_GIVEAWAYS, `giveaway-entries:${giveawayId}`] },
  )();
}
