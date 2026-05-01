import "server-only";
import { unstable_cache as cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product, ProductVariant } from "@/types/domain";
import type { Row } from "@/types/database";

type Category = Row<"products">["category"];

export const TAG_PRODUCTS = "products";
const REVALIDATE = 60;

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export async function getActiveProducts(filters?: {
  category?: Category;
  wornByPlayerId?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  // Stable cache key from filter object so different filter combos get
  // different cache entries.
  const keyParts = [
    "products-active",
    filters?.category ?? "any",
    filters?.wornByPlayerId ?? "any",
    filters?.featured ? "featured" : "any",
    String(filters?.limit ?? "all"),
  ];
  return cache(
    async () => {
      const supabase = createPublicClient();
      let q = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (filters?.category) q = q.eq("category", filters.category);
      if (filters?.wornByPlayerId) q = q.eq("worn_by_player_id", filters.wornByPlayerId);
      if (filters?.featured) q = q.eq("is_featured", true);
      if (filters?.limit) q = q.limit(filters.limit);
      const { data, error } = await q;
      if (error || !data) return [];
      return data as unknown as Product[];
    },
    keyParts,
    { revalidate: REVALIDATE, tags: [TAG_PRODUCTS] },
  )();
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) return null;
      return data as unknown as ProductWithVariants;
    },
    ["products-by-slug", slug],
    { revalidate: REVALIDATE, tags: [TAG_PRODUCTS, `product:${slug}`] },
  )();
}

export async function countActiveProducts(): Promise<number> {
  return cache(
    async () => {
      const supabase = createPublicClient();
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error || count == null) return 0;
      return count;
    },
    ["products-count"],
    { revalidate: REVALIDATE, tags: [TAG_PRODUCTS] },
  )();
}
