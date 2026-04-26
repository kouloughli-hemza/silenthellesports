import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Event, EventSignup } from "@/types/domain";

export type EventStatus = Event["status"];
export const EVENT_STATUSES: readonly EventStatus[] = [
  "upcoming",
  "open",
  "closed",
  "live",
  "completed",
  "cancelled",
] as const;

export interface EventListQuery {
  status?: EventStatus;
}

export async function listEventsAdmin(query: EventListQuery): Promise<Event[]> {
  const supabase = createAdminClient();
  let q = supabase.from("events").select("*").order("start_at", { ascending: false });
  if (query.status) q = q.eq("status", query.status);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as Event[];
}

export async function getEventByIdAdmin(id: string): Promise<Event | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Event;
}

export async function listSignupsForEvent(eventId: string): Promise<EventSignup[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_signups")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as EventSignup[];
}

export async function getSignupById(id: string): Promise<EventSignup | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event_signups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as EventSignup;
}
