import "server-only";
import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Page } from "@/types/domain";

export const TAG_PAGES = "pages";
const REVALIDATE = 300; // CMS pages change rarely — longer revalidate is fine.

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as Page;
    },
    ["pages-by-slug", slug],
    { revalidate: REVALIDATE, tags: [TAG_PAGES, `page:${slug}`] },
  )();
}

export async function getPublishedPageSlugs(): Promise<string[]> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("pages")
        .select("slug")
        .eq("is_published", true);
      if (error || !data) return [];
      return (data as unknown as Array<{ slug: string }>).map((p) => p.slug);
    },
    ["pages-slugs"],
    { revalidate: REVALIDATE, tags: [TAG_PAGES] },
  )();
}
