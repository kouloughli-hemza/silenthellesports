import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import type { Json } from "@/types/database";

export interface ExistingEntrySnapshot {
  email: string;
  discordTag: string | null;
  completedMethods: string[];
  entryCount: number;
}

/**
 * Look up the signed-in user's existing entry for a giveaway, by email.
 * Returns null when no user, no email, or no entry exists.
 *
 * Anonymous (guest) lookups are handled client-side via localStorage —
 * we never expose other users' entries to anonymous visitors.
 */
export async function getExistingEntryForCurrentUser(
  giveawayId: string,
): Promise<ExistingEntrySnapshot | null> {
  const session = await getSessionUser();
  if (!session?.email) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("giveaway_entries")
    .select("email, discord_tag, completed_methods, entry_count")
    .eq("giveaway_id", giveawayId)
    .eq("email", session.email)
    .maybeSingle();

  if (error || !data) return null;

  const completed = Array.isArray(data.completed_methods)
    ? (data.completed_methods as Json[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];

  return {
    email: data.email,
    discordTag: data.discord_tag,
    completedMethods: completed,
    entryCount: data.entry_count,
  };
}
