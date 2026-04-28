"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const TranslatedOptional = z.object({ en: z.string(), ar: z.string() });

const PointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const Schema = z.object({
  title: Translated,
  description: TranslatedOptional,
  map_name: z.string().trim().min(1).max(40),
  map_image_url: z.string().trim().url().nullable(),
  drop_x: z.number().min(0).max(100),
  drop_y: z.number().min(0).max(100),
  rotation_points: z.array(PointSchema).max(20),
  display_order: z.number().int().min(0).max(9999),
  is_published: z.boolean(),
});

export type TacticBoardInput = z.infer<typeof Schema>;

export async function createTacticBoardAction(
  input: TacticBoardInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tactic_boards")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "tactic_board.create",
    entityType: "tactic_boards",
    entityId: data.id,
    after: { map_name: parsed.data.map_name },
  });
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateTacticBoardAction(
  id: string,
  input: TacticBoardInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tactic_boards")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "tactic_board.update",
    entityType: "tactic_boards",
    entityId: id,
    after: { map_name: parsed.data.map_name },
  });
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteTacticBoardAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("tactic_boards").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "tactic_board.delete",
    entityType: "tactic_boards",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return ok({ id });
}

// ----- Section visibility toggle (writes to site_config) ------------------

export async function setTacticsEnabledAction(
  enabled: boolean,
): Promise<Result<{ enabled: boolean }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_config").upsert(
    {
      key: "tactics.enabled",
      value: enabled as never,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "key" },
  );
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "site_config.update",
    entityType: "site_config",
    entityId: "tactics.enabled",
    after: { enabled },
  });
  revalidatePath("/", "layout");
  return ok({ enabled });
}
