import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type Player = Row<"players">;

export { PLAYER_ROLES, type PlayerRole } from "@/lib/admin/data/players-enums";

export async function listPlayers(): Promise<Player[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("display_order", { ascending: true })
    .order("ign", { ascending: true });
  if (error) throw new Error(`listPlayers: ${error.message}`);
  return (data ?? []) as Player[];
}

export async function getPlayer(id: string): Promise<Player | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle<Player>();
  if (error) throw new Error(`getPlayer: ${error.message}`);
  return data;
}
