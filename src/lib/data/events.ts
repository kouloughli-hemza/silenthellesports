import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
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
  const supabase = createPublicClient();
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
