"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_PLAYERS } from "@/lib/data/players";
import { fail, ok, type Result } from "@/types/domain";
import { PLAYER_ROLES } from "@/lib/admin/data/players";

const Translated = z.object({ en: z.string(), ar: z.string() });

const StatsSchema = z
  .object({
    kd: z.number().optional(),
    headshot: z.number().optional(),
    matches: z.number().optional(),
    chicken_dinners: z.number().optional(),
  })
  .partial();

const SocialsSchema = z
  .object({
    twitch: z.string().optional(),
    youtube: z.string().optional(),
    x: z.string().optional(),
    instagram: z.string().optional(),
  })
  .partial();

const Schema = z.object({
  ign: z.string().trim().min(1, "Required").max(40),
  real_name: z.string().trim().max(80).nullable(),
  role: z.enum(PLAYER_ROLES),
  country_code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/u, "ISO 2-letter code")
    .nullable(),
  photo_url: z.string().trim().url().nullable(),
  bio: Translated,
  signature_loadout: z.string().trim().max(120).nullable(),
  highlight_url: z
    .string()
    .trim()
    .max(300)
    .url({ message: "Must be a full URL" })
    .nullable()
    .or(z.literal("").transform(() => null)),
  stats: StatsSchema,
  socials: SocialsSchema,
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
  joined_at: z.string().nullable(),
  left_at: z.string().nullable(),
});

export type PlayerInput = z.infer<typeof Schema>;

export async function createPlayerAction(input: PlayerInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "player.create",
    entityType: "players",
    entityId: data.id,
    after: parsed.data,
  });
  revalidateTag(TAG_PLAYERS);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updatePlayerAction(
  id: string,
  input: PlayerInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("players")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "player.update",
    entityType: "players",
    entityId: id,
    after: parsed.data,
  });
  revalidateTag(TAG_PLAYERS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deletePlayerAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "player.delete",
    entityType: "players",
    entityId: id,
  });
  revalidateTag(TAG_PLAYERS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deletePlayerActionRedirect(id: string, locale: string): Promise<void> {
  const result = await deletePlayerAction(id);
  if (!result.success) throw new Error(result.error);
  redirect(`/${locale}/admin/roster`);
}
