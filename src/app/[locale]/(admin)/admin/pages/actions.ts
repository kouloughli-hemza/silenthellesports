"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string(), ar: z.string() });
const TranslatedRequired = z.object({ en: z.string().min(1), ar: z.string().min(1) });

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const Schema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG, "lowercase, dashes only"),
  title: TranslatedRequired,
  body: Translated,
  meta_description: Translated,
  is_published: z.boolean(),
});

export type PageInput = z.infer<typeof Schema>;

export async function createPageAction(input: PageInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pages")
    .insert({ ...parsed.data, updated_by: profile.id } as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "page.create",
    entityType: "pages",
    entityId: data.id,
    after: { slug: parsed.data.slug },
  });
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updatePageAction(
  id: string,
  input: PageInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pages")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    } as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "page.update",
    entityType: "pages",
    entityId: id,
    after: { slug: parsed.data.slug, is_published: parsed.data.is_published },
  });
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deletePageAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "page.delete",
    entityType: "pages",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return ok({ id });
}
