import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Page } from "@/types/domain";

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Page;
}

export async function getPublishedPageSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug")
    .eq("is_published", true);
  if (error || !data) return [];
  return (data as unknown as Array<{ slug: string }>).map((p) => p.slug);
}
