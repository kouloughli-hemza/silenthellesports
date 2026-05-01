import "server-only";
import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Trophy } from "@/types/domain";

export const TAG_TROPHIES = "trophies";
const REVALIDATE = 60;

export async function getRecentTrophies(limit = 6): Promise<Trophy[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("trophies")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return data as unknown as Trophy[];
    },
    ["trophies-recent", String(limit)],
    { revalidate: REVALIDATE, tags: [TAG_TROPHIES] },
  )();
}

export async function getAllTrophies(): Promise<Trophy[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("trophies")
        .select("*")
        .order("date", { ascending: false });
      if (error || !data) return [];
      return data as unknown as Trophy[];
    },
    ["trophies-all"],
    { revalidate: REVALIDATE, tags: [TAG_TROPHIES] },
  )();
}

export interface TrophyStats {
  totalCount: number;
  totalPrizeUsd: number;
  firstPlaceCount: number;
}

export async function getTrophyStats(): Promise<TrophyStats> {
  const trophies = await getAllTrophies();
  const totalPrizeUsd = trophies.reduce(
    (acc, t) => acc + (t.prize_currency === "USD" ? Number(t.prize_amount ?? 0) : 0),
    0,
  );
  const firstPlaceCount = trophies.filter((t) => /^1(st)?$/i.test(t.placement)).length;
  return {
    totalCount: trophies.length,
    totalPrizeUsd,
    firstPlaceCount,
  };
}
