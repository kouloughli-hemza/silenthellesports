import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/domain";

export interface UserListQuery {
  page: number;
  pageSize: number;
  q?: string;
}

export interface UserListResult {
  rows: Profile[];
  total: number;
}

export async function listProfiles(query: UserListQuery): Promise<UserListResult> {
  const supabase = createAdminClient();
  let q = supabase.from("profiles").select("*", { count: "exact" });
  if (query.q && query.q.trim().length > 0) {
    const term = query.q.trim().replace(/[%_]/g, "");
    q = q.ilike("email", `%${term}%`);
  }
  q = q.order("created_at", { ascending: false });
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  q = q.range(from, to);

  const { data, count, error } = await q;
  if (error || !data) return { rows: [], total: count ?? 0 };
  return { rows: data as unknown as Profile[], total: count ?? 0 };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Profile;
}
