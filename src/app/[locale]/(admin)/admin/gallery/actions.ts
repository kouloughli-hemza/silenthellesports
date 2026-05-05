"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_GALLERY } from "@/lib/data/gallery";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string(), ar: z.string() });

const Schema = z.object({
  image_url: z.string().trim().url("Image is required."),
  caption: Translated,
  meta: Translated,
  hud_heading: z.string().trim().max(16).nullable(),
  hud_zone: z.string().trim().max(24).nullable(),
  hud_signal: z.string().trim().max(16).nullable(),
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type GalleryImageInput = z.infer<typeof Schema>;

function bumpPaths() {
  for (const locale of ["en", "ar"]) {
    revalidatePath(`/${locale}`, "page");
  }
}

export async function createGalleryImageAction(
  input: GalleryImageInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "gallery.create",
    entityType: "gallery_images",
    entityId: data.id,
  });
  revalidateTag(TAG_GALLERY);
  bumpPaths();
  return ok({ id: data.id });
}

export async function updateGalleryImageAction(
  id: string,
  input: GalleryImageInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("gallery_images")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "gallery.update",
    entityType: "gallery_images",
    entityId: id,
  });
  revalidateTag(TAG_GALLERY);
  bumpPaths();
  return ok({ id });
}

export async function deleteGalleryImageAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "gallery.delete",
    entityType: "gallery_images",
    entityId: id,
  });
  revalidateTag(TAG_GALLERY);
  bumpPaths();
  return ok({ id });
}
