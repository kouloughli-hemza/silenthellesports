import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TacticBoard, TeamMilestone, TeamStat } from "@/types/domain";

export async function listMilestonesAdmin(): Promise<TeamMilestone[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_milestones")
    .select("*")
    .order("occurred_on", { ascending: false });
  if (error) throw new Error(`listMilestonesAdmin: ${error.message}`);
  return (data ?? []) as TeamMilestone[];
}

export async function getMilestone(id: string): Promise<TeamMilestone | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_milestones")
    .select("*")
    .eq("id", id)
    .maybeSingle<TeamMilestone>();
  if (error) throw new Error(`getMilestone: ${error.message}`);
  return data;
}

export async function listStatsAdmin(): Promise<TeamStat[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_stats")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`listStatsAdmin: ${error.message}`);
  return (data ?? []) as TeamStat[];
}

export async function getStat(id: string): Promise<TeamStat | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_stats")
    .select("*")
    .eq("id", id)
    .maybeSingle<TeamStat>();
  if (error) throw new Error(`getStat: ${error.message}`);
  return data;
}

export async function listTacticBoardsAdmin(): Promise<TacticBoard[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tactic_boards")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`listTacticBoardsAdmin: ${error.message}`);
  return (data ?? []) as TacticBoard[];
}

export async function getTacticBoard(id: string): Promise<TacticBoard | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tactic_boards")
    .select("*")
    .eq("id", id)
    .maybeSingle<TacticBoard>();
  if (error) throw new Error(`getTacticBoard: ${error.message}`);
  return data;
}

export async function getTacticsEnabled(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "tactics.enabled")
    .maybeSingle<{ value: unknown }>();
  if (data?.value === false) return false;
  return true;
}
