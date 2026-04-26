import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Trophy } from "@/types/domain";

export async function getRecentTrophies(limit = 6): Promise<Trophy[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("trophies")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as Trophy[];
}

export async function getAllTrophies(): Promise<Trophy[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("trophies")
    .select("*")
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data as unknown as Trophy[];
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
