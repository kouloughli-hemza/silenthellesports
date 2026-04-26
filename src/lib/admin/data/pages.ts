import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type CmsPage = Row<"pages">;

export async function listPages(): Promise<CmsPage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("slug", { ascending: true });
  if (error) throw new Error(`listPages: ${error.message}`);
  return (data ?? []) as CmsPage[];
}

export async function getPage(id: string): Promise<CmsPage | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle<CmsPage>();
  if (error) throw new Error(`getPage: ${error.message}`);
  return data;
}
