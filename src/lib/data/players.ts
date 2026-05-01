import "server-only";
import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Player } from "@/types/domain";

export const TAG_PLAYERS = "players";
const REVALIDATE = 60;

export async function getActivePlayers(): Promise<Player[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error || !data) return [];
      return (data as unknown as Player[]).filter(
        (p) => p.role !== "Manager" && p.role !== "Coach",
      );
    },
    ["players-active"],
    { revalidate: REVALIDATE, tags: [TAG_PLAYERS] },
  )();
}

export async function getStaff(): Promise<Player[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("is_active", true)
        .in("role", ["Manager", "Coach", "Analyst"])
        .order("display_order", { ascending: true });
      if (error || !data) return [];
      return data as unknown as Player[];
    },
    ["players-staff"],
    { revalidate: REVALIDATE, tags: [TAG_PLAYERS] },
  )();
}

export async function getPlayerByIgn(ign: string): Promise<Player | null> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .ilike("ign", ign)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as Player;
    },
    ["players-by-ign", ign.toLowerCase()],
    { revalidate: REVALIDATE, tags: [TAG_PLAYERS] },
  )();
}

export async function countActivePlayers(): Promise<number> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { count, error } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .not("role", "in", "(Manager,Coach)");
      if (error || count == null) return 0;
      return count;
    },
    ["players-count"],
    { revalidate: REVALIDATE, tags: [TAG_PLAYERS] },
  )();
}
