import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product, ProductVariant } from "@/types/domain";
import type { Row } from "@/types/database";

type Category = Row<"products">["category"];

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export async function getActiveProducts(filters?: {
  category?: Category;
  wornByPlayerId?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
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
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ProductWithVariants;
}

export async function countActiveProducts(): Promise<number> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (error || count == null) return 0;
  return count;
}
