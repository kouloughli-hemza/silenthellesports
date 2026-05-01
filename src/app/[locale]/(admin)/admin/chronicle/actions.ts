"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_MILESTONES } from "@/lib/data/team";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const TranslatedOptional = z.object({ en: z.string(), ar: z.string() });

const Schema = z.object({
  occurred_on: z.string().min(8),
  category: z.enum([
    "founding",
    "tournament_win",
    "roster",
    "milestone",
    "release",
    "partnership",
    "other",
  ]),
  title: Translated,
  description: TranslatedOptional,
  image_url: z.string().trim().url().nullable(),
  display_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export type MilestoneInput = z.infer<typeof Schema>;

export async function createMilestoneAction(
  input: MilestoneInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_milestones")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "milestone.create",
    entityType: "team_milestones",
    entityId: data.id,
    after: { category: parsed.data.category },
  });
  revalidateTag(TAG_MILESTONES);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateMilestoneAction(
  id: string,
  input: MilestoneInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("team_milestones")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "milestone.update",
    entityType: "team_milestones",
    entityId: id,
    after: { category: parsed.data.category },
  });
  revalidateTag(TAG_MILESTONES);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteMilestoneAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("team_milestones").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "milestone.delete",
    entityType: "team_milestones",
    entityId: id,
  });
  revalidateTag(TAG_MILESTONES);
  revalidatePath("/", "layout");
  return ok({ id });
}
