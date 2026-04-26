"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";
import { PRODUCT_CATEGORIES } from "@/lib/admin/data/products";

const Translated = z.object({ en: z.string(), ar: z.string() });
const TranslatedRequired = z.object({ en: z.string().min(1), ar: z.string().min(1) });

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const Schema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG, "lowercase, dashes only"),
  name: TranslatedRequired,
  description: Translated,
  category: z.enum(PRODUCT_CATEGORIES),
  base_price: z.number().int().min(0).max(10_000_000),
  worn_by_player_id: z.string().uuid().nullable(),
  images: z.array(z.string().trim().url()).max(10),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  weight_grams: z.number().int().min(1).max(50_000),
  display_order: z.number().int().min(0).max(9999),
});

export type ProductInput = z.infer<typeof Schema>;

export async function createProductAction(input: ProductInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "product.create",
    entityType: "products",
    entityId: data.id,
    after: { slug: parsed.data.slug },
  });
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "product.update",
    entityType: "products",
    entityId: id,
    after: { slug: parsed.data.slug, is_active: parsed.data.is_active },
  });
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteProductAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "product.delete",
    entityType: "products",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return ok({ id });
}
