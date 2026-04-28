import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { getSiteConfig } from "@/lib/site-config";
import type { TacticBoard, TeamMilestone, TeamStat } from "@/types/domain";

// Newest first — the public timeline starts at "today" and scrolls back.
export async function getPublishedMilestones(limit?: number): Promise<TeamMilestone[]> {
  const supabase = createPublicClient();
  const query = supabase
    .from("team_milestones")
    .select("*")
    .order("occurred_on", { ascending: false });
  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error || !data) return [];
  return data as unknown as TeamMilestone[];
}

export async function getPublishedStats(): Promise<TeamStat[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("team_stats")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data as unknown as TeamStat[];
}

export async function getPublishedTacticBoards(): Promise<TacticBoard[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tactic_boards")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data as unknown as TacticBoard[];
}

export async function isTacticsEnabled(): Promise<boolean> {
  return await getSiteConfig("tactics.enabled");
}
