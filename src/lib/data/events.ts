import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Event } from "@/types/domain";

export async function getUpcomingEvents(limit?: number): Promise<Event[]> {
  const supabase = createPublicClient();
  const query = supabase
    .from("events")
    .select("*")
    .in("status", ["upcoming", "open", "live"])
    .order("start_at", { ascending: true });
  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error || !data) return [];
  return data as unknown as Event[];
}

export async function getPastEvents(limit?: number): Promise<Event[]> {
  const supabase = createPublicClient();
  const query = supabase
    .from("events")
    .select("*")
    .in("status", ["completed", "closed"])
    .order("start_at", { ascending: false });
  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error || !data) return [];
  return data as unknown as Event[];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .neq("status", "cancelled")
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Event;
}

export async function getEventSignupCount(eventId: string): Promise<number> {
  // Admin client bypasses RLS — only an aggregate count is returned, no row data leaks.
  // event_signups is locked down to self-read + admin-read, so the anon client always sees 0.
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("event_signups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .not("status", "in", "(disqualified,withdrawn)");
  if (error || count == null) return 0;
  return count;
}

export async function countUpcomingEvents(): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["upcoming", "open", "live"]);
  if (error || count == null) return 0;
  return count;
}

export async function getNextEvent(): Promise<Event | null> {
  const events = await getUpcomingEvents(1);
  return events[0] ?? null;
}

// Returns the subset of `eventIds` the user has an active signup for
// (registered/checked_in only — withdrawn/disqualified entries free the slot
// and shouldn't show as "already in" on listings).
export async function getUserActiveSignupEventIds(
  userId: string,
  eventIds: string[],
): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_signups")
    .select("event_id")
    .eq("user_id", userId)
    .in("event_id", eventIds)
    .not("status", "in", "(disqualified,withdrawn)");
  if (error || !data) return new Set();
  return new Set(data.map((r: { event_id: string }) => r.event_id));
}

export async function getUserSignupForEvent(
  userId: string,
  eventId: string,
): Promise<{ confirmation_code: string } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_signups")
    .select("confirmation_code")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .not("status", "in", "(disqualified,withdrawn)")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
