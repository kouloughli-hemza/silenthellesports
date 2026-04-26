import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Player } from "@/types/domain";

export async function getActivePlayers(): Promise<Player[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as Player[]).filter((p) => p.role !== "Manager" && p.role !== "Coach");
}

export async function getStaff(): Promise<Player[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .in("role", ["Manager", "Coach", "Analyst"])
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data as unknown as Player[];
}

export async function getPlayerByIgn(ign: string): Promise<Player | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .ilike("ign", ign)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Player;
}

export async function countActivePlayers(): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("role", "in", "(Manager,Coach)");
  if (error || count == null) return 0;
  return count;
}
