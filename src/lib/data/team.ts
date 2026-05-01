import "server-only";

import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteConfig } from "@/lib/site-config";
import type { TacticBoard, TeamMilestone, TeamStat } from "@/types/domain";

// Public team data is hot on every page view but rarely changes — cache it
// at the data layer so SSR doesn't pay a Supabase round-trip per render.
// Admin write actions invalidate via revalidateTag(...) (see admin/actions).
const REVALIDATE_SECONDS = 60;

export const TAG_MILESTONES = "team-milestones";
export const TAG_STATS = "team-stats";
export const TAG_TACTICS = "tactic-boards";

// Newest first — the public timeline starts at "today" and scrolls back.
export async function getPublishedMilestones(limit?: number): Promise<TeamMilestone[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const query = supabase
        .from("team_milestones")
        .select("*")
        .order("occurred_on", { ascending: false });
      const { data, error } = limit ? await query.limit(limit) : await query;
      if (error || !data) return [];
      return data as unknown as TeamMilestone[];
    },
    ["team-milestones", String(limit ?? "all")],
    { revalidate: REVALIDATE_SECONDS, tags: [TAG_MILESTONES] },
  )();
}

export async function getPublishedStats(): Promise<TeamStat[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("team_stats")
        .select("*")
        .order("display_order", { ascending: true });
      if (error || !data) return [];
      return data as unknown as TeamStat[];
    },
    ["team-stats"],
    { revalidate: REVALIDATE_SECONDS, tags: [TAG_STATS] },
  )();
}

export async function getPublishedTacticBoards(): Promise<TacticBoard[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("tactic_boards")
        .select("*")
        .order("display_order", { ascending: true });
      if (error || !data) return [];
      return data as unknown as TacticBoard[];
    },
    ["tactic-boards"],
    { revalidate: REVALIDATE_SECONDS, tags: [TAG_TACTICS] },
  )();
}

export async function isTacticsEnabled(): Promise<boolean> {
  return await getSiteConfig("tactics.enabled");
}
