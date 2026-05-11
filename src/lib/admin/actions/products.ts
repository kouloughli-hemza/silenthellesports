"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slugify";
import { identifyImage } from "@/lib/utils/image-bytes";
import { fail, ok, type Result } from "@/types/domain";
import type { Insert, Update, Row } from "@/types/database";

const PRODUCT_CATEGORIES = [
  "tee",
  "hoodie",
  "jersey",
  "mousepad",
  "cap",
  "sticker",
  "lanyard",
  "other",
] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const TranslatedSchema = z.object({
  en: z.string().trim().min(1, "English value required.").max(200),
  ar: z.string().trim().max(200).default(""),
});

const TranslatedDescSchema = z.object({
  en: z.string().trim().max(4000).default(""),
  ar: z.string().trim().max(4000).default(""),
});

const ProductBaseSchema = z.object({
  name: TranslatedSchema,
  description: TranslatedDescSchema,
  category: z.enum(PRODUCT_CATEGORIES),
  base_price: z.coerce.number().nonnegative().max(10_000_000),
  worn_by_player_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  is_active: z.coerce.boolean().optional().default(true),
  is_featured: z.coerce.boolean().optional().default(false),
  weight_grams: z.coerce.number().int().nonnegative().max(100_000).default(500),
  display_order: z.coerce.number().int().min(0).max(10_000).default(0),
});

const VariantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().trim().min(2).max(64),
  size: z
    .string()
    .trim()
    .max(16)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  color: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  price_override: z
    .union([z.coerce.number().nonnegative().max(10_000_000), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  stock_quantity: z.coerce.number().int().min(0).max(100_000).default(0),
  is_active: z.coerce.boolean().optional().default(true),
});

interface FormShape {
  get(name: string): FormDataEntryValue | null;
}

function readBoolean(formData: FormShape, key: string): boolean {
  const v = formData.get(key);
  if (v === null) return false;
  if (typeof v === "string") return v === "on" || v === "true" || v === "1";
  return false;
}

function readTranslated(formData: FormShape, base: string): { en: string; ar: string } {
  return {
    en: String(formData.get(`${base}.en`) ?? ""),
    ar: String(formData.get(`${base}.ar`) ?? ""),
  };
}

function parseImagesArray(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string");
    }
    return [];
  } catch {
    return [];
  }
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const supabase = createAdminClient();
  const root = base || `product-${Date.now()}`;
  let candidate = root;
  let n = 1;
  // Cap at 50 attempts to avoid pathological loops.
  for (let i = 0; i < 50; i += 1) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>();
    if (!data || (ignoreId && data.id === ignoreId)) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

export async function createProductAction(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();

  const parsed = ProductBaseSchema.safeParse({
    name: readTranslated(formData, "name"),
    description: readTranslated(formData, "description"),
    category: formData.get("category"),
    base_price: formData.get("base_price"),
    worn_by_player_id: formData.get("worn_by_player_id"),
    is_active: readBoolean(formData, "is_active"),
    is_featured: readBoolean(formData, "is_featured"),
    weight_grams: formData.get("weight_grams") ?? 500,
    display_order: formData.get("display_order") ?? 0,
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid product data.");
  }

  const slug = await ensureUniqueSlug(slugify(parsed.data.name.en));

  const supabase = createAdminClient();
  const insert: Insert<"products"> = {
    slug,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    base_price: parsed.data.base_price,
    worn_by_player_id: parsed.data.worn_by_player_id,
    images: [],
    is_active: parsed.data.is_active,
    is_featured: parsed.data.is_featured,
    weight_grams: parsed.data.weight_grams,
    display_order: parsed.data.display_order,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(insert as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) return fail(error?.message ?? "Couldn't create product.");

  await recordAudit({
    actorId: profile.id,
    action: "product.create",
    entityType: "product",
    entityId: data.id,
    after: { ...insert },
  });

  revalidatePath("/admin/products");
  revalidatePath("/en/store");
  revalidatePath("/ar/store");
  return ok({ id: data.id });
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid product id.");

  const parsed = ProductBaseSchema.safeParse({
    name: readTranslated(formData, "name"),
    description: readTranslated(formData, "description"),
    category: formData.get("category"),
    base_price: formData.get("base_price"),
    worn_by_player_id: formData.get("worn_by_player_id"),
    is_active: readBoolean(formData, "is_active"),
    is_featured: readBoolean(formData, "is_featured"),
    weight_grams: formData.get("weight_grams") ?? 500,
    display_order: formData.get("display_order") ?? 0,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid product data.");
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Row<"products">>();
  if (!existing) return fail("Product not found.");

  // Slug only auto-regenerates if english name changed.
  let slug = existing.slug;
  const newEn =
    typeof existing.name === "object" && existing.name !== null && "en" in existing.name
      ? String((existing.name as { en?: unknown }).en ?? "")
      : "";
  if (parsed.data.name.en !== newEn) {
    slug = await ensureUniqueSlug(slugify(parsed.data.name.en), id);
  }

  const images = parseImagesArray(formData.get("images_json"));

  const patch: Update<"products"> = {
    slug,
    name: parsed.data.name,
    description: parsed.data.description,
    category: parsed.data.category,
    base_price: parsed.data.base_price,
    worn_by_player_id: parsed.data.worn_by_player_id,
    is_active: parsed.data.is_active,
    is_featured: parsed.data.is_featured,
    weight_grams: parsed.data.weight_grams,
    display_order: parsed.data.display_order,
    images,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("products")
    .update(patch as never)
    .eq("id", id);

  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "product.update",
    entityType: "product",
    entityId: id,
    before: existing,
    after: { ...existing, ...patch },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/en/store");
  revalidatePath("/ar/store");
  revalidatePath(`/en/store/${slug}`);
  revalidatePath(`/ar/store/${slug}`);
  return ok({ id });
}

export async function deleteProductAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid product id.");

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle<Row<"products">>();
  if (!existing) return fail("Product not found.");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "product.delete",
    entityType: "product",
    entityId: id,
    before: existing,
  });

  revalidatePath("/admin/products");
  revalidatePath("/en/store");
  revalidatePath("/ar/store");
  return ok({ id });
}

export async function addVariantAction(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();

  const parsed = VariantSchema.safeParse({
    product_id: formData.get("product_id"),
    sku: formData.get("sku"),
    size: formData.get("size") ?? undefined,
    color: formData.get("color") ?? undefined,
    price_override: formData.get("price_override") ?? "",
    stock_quantity: formData.get("stock_quantity") ?? 0,
    is_active: readBoolean(formData, "is_active"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid variant data.");
  }

  const supabase = createAdminClient();
  const insert: Insert<"product_variants"> = {
    product_id: parsed.data.product_id,
    sku: parsed.data.sku,
    size: parsed.data.size,
    color: parsed.data.color,
    price_override: parsed.data.price_override,
    stock_quantity: parsed.data.stock_quantity,
    is_active: parsed.data.is_active,
  };

  const { data, error } = await supabase
    .from("product_variants")
    .insert(insert as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return fail(error?.message ?? "Couldn't create variant.");

  await recordAudit({
    actorId: profile.id,
    action: "variant.create",
    entityType: "product_variant",
    entityId: data.id,
    after: { ...insert },
  });

  revalidatePath(`/admin/products/${parsed.data.product_id}/edit`);
  return ok({ id: data.id });
}

export async function updateVariantAction(
  id: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid variant id.");

  const parsed = VariantSchema.safeParse({
    product_id: formData.get("product_id"),
    sku: formData.get("sku"),
    size: formData.get("size") ?? undefined,
    color: formData.get("color") ?? undefined,
    price_override: formData.get("price_override") ?? "",
    stock_quantity: formData.get("stock_quantity") ?? 0,
    is_active: readBoolean(formData, "is_active"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid variant data.");
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", id)
    .maybeSingle<Row<"product_variants">>();
  if (!existing) return fail("Variant not found.");

  const patch: Update<"product_variants"> = {
    sku: parsed.data.sku,
    size: parsed.data.size,
    color: parsed.data.color,
    price_override: parsed.data.price_override,
    stock_quantity: parsed.data.stock_quantity,
    is_active: parsed.data.is_active,
  };

  const { error } = await supabase
    .from("product_variants")
    .update(patch as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "variant.update",
    entityType: "product_variant",
    entityId: id,
    before: existing,
    after: { ...existing, ...patch },
  });

  revalidatePath(`/admin/products/${parsed.data.product_id}/edit`);
  return ok({ id });
}

export async function deleteVariantAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid variant id.");

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", id)
    .maybeSingle<Row<"product_variants">>();
  if (!existing) return fail("Variant not found.");

  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "variant.delete",
    entityType: "product_variant",
    entityId: id,
    before: existing,
  });

  revalidatePath(`/admin/products/${existing.product_id}/edit`);
  return ok({ id });
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<Result<{ url: string; path: string }>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("No file provided.");
  if (file.size <= 0) return fail("Empty file.");
  if (file.size > MAX_IMAGE_BYTES) return fail("File exceeds 5MB.");

  // Sniff magic bytes — don't trust the browser Content-Type.
  const buffer = Buffer.from(await file.arrayBuffer());
  const identified = identifyImage(buffer, { allow: ["png", "jpeg", "webp", "avif"] });
  if (!identified) return fail("Only PNG, JPEG, WebP, or AVIF images are allowed.");

  const productId = String(formData.get("product_id") ?? "misc");
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${identified.ext}`;

  const supabase = createAdminClient();
  const { error: upErr } = await supabase.storage
    .from("products")
    .upload(path, buffer, {
      cacheControl: "3600",
      contentType: identified.mime,
      upsert: false,
    });
  if (upErr) return fail(upErr.message);

  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  return ok({ url: pub.publicUrl, path });
}
