import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Row } from "@/types/database";

export type Product = Row<"products">;

export { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/admin/data/products-enums";

export async function listProducts(): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listProducts: ${error.message}`);
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Product>();
  if (error) throw new Error(`getProduct: ${error.message}`);
  return data;
}
