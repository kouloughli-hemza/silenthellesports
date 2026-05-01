"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_TROPHIES } from "@/lib/data/trophies";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string().min(1), ar: z.string().min(1) });

const Schema = z.object({
  title: Translated,
  tournament_name: z.string().trim().min(1).max(120),
  placement: z.string().trim().min(1).max(40),
  prize_amount: z.number().int().nullable(),
  prize_currency: z.string().trim().toUpperCase().length(3),
  date: z.string().min(10),
  logo_url: z.string().trim().url().nullable(),
  display_order: z.number().int().min(0).max(9999),
});

export type TrophyInput = z.infer<typeof Schema>;

export async function createTrophyAction(input: TrophyInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trophies")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "trophy.create",
    entityType: "trophies",
    entityId: data.id,
    after: parsed.data,
  });
  revalidateTag(TAG_TROPHIES);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateTrophyAction(
  id: string,
  input: TrophyInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("trophies").update(parsed.data as never).eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "trophy.update",
    entityType: "trophies",
    entityId: id,
    after: parsed.data,
  });
  revalidateTag(TAG_TROPHIES);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteTrophyAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("trophies").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "trophy.delete",
    entityType: "trophies",
    entityId: id,
  });
  revalidateTag(TAG_TROPHIES);
  revalidatePath("/", "layout");
  return ok({ id });
}
