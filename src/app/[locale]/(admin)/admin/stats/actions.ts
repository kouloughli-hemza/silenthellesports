"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_STATS } from "@/lib/data/team";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const KEY_RE = /^[a-z0-9_]+$/u;

const Schema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(KEY_RE, "lowercase letters, digits, underscores only"),
  label: Translated,
  value: z.number().int().min(0),
  suffix: z.string().trim().max(8).nullable(),
  display_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export type StatInput = z.infer<typeof Schema>;

export async function createStatAction(input: StatInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_stats")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "team_stat.create",
    entityType: "team_stats",
    entityId: data.id,
    after: { key: parsed.data.key },
  });
  revalidateTag(TAG_STATS);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateStatAction(
  id: string,
  input: StatInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("team_stats")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "team_stat.update",
    entityType: "team_stats",
    entityId: id,
    after: { key: parsed.data.key },
  });
  revalidateTag(TAG_STATS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteStatAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("team_stats").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "team_stat.delete",
    entityType: "team_stats",
    entityId: id,
  });
  revalidateTag(TAG_STATS);
  revalidatePath("/", "layout");
  return ok({ id });
}
