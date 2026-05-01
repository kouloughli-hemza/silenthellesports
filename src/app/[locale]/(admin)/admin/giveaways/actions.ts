"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_GIVEAWAYS } from "@/lib/data/giveaways";
import { fail, ok, type Result } from "@/types/domain";
const Translated = z.object({ en: z.string(), ar: z.string() });
const TranslatedRequired = z.object({ en: z.string().min(1), ar: z.string().min(1) });

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const EntryMethods = z.object({
  follow_required: z.boolean(),
  discord_required: z.boolean(),
  share_bonus: z.boolean(),
});

const Schema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG, "lowercase, dashes only"),
  title: TranslatedRequired,
  description: Translated,
  prize_description: TranslatedRequired,
  prize_image_url: z.string().trim().url().nullable(),
  estimated_value: z.string().trim().nullable(),
  entry_methods: EntryMethods,
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  status: z.enum(["upcoming", "active", "drawing", "completed"]),
  drop_number: z.number().int().min(1).max(9999).nullable(),
});

export type GiveawayInput = z.infer<typeof Schema>;

export async function createGiveawayAction(input: GiveawayInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("giveaways")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "giveaway.create",
    entityType: "giveaways",
    entityId: data.id,
    after: { slug: parsed.data.slug },
  });
  revalidateTag(TAG_GIVEAWAYS);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateGiveawayAction(
  id: string,
  input: GiveawayInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("giveaways")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "giveaway.update",
    entityType: "giveaways",
    entityId: id,
    after: { slug: parsed.data.slug, status: parsed.data.status },
  });
  revalidateTag(TAG_GIVEAWAYS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteGiveawayAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("giveaways").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "giveaway.delete",
    entityType: "giveaways",
    entityId: id,
  });
  revalidateTag(TAG_GIVEAWAYS);
  revalidatePath("/", "layout");
  return ok({ id });
}

// Pick a random eligible entry as the winner. Marks giveaway "completed".
export async function drawWinnerAction(
  id: string,
): Promise<Result<{ winnerEmail: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();

  const { data: entries, error: entriesErr } = await supabase
    .from("giveaway_entries")
    .select("id, email, user_id")
    .eq("giveaway_id", id);
  if (entriesErr) return fail(entriesErr.message);
  if (!entries || entries.length === 0) return fail("No entries to draw from.");

  const winner = entries[Math.floor(Math.random() * entries.length)] as {
    id: string;
    email: string;
    user_id: string | null;
  };

  const { error: updateErr } = await supabase
    .from("giveaways")
    .update({
      status: "completed",
      winner_user_id: winner.user_id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (updateErr) return fail(updateErr.message);

  await recordAudit({
    actorId: profile.id,
    action: "giveaway.draw_winner",
    entityType: "giveaways",
    entityId: id,
    after: { winner_email: winner.email, entry_id: winner.id },
  });
  revalidateTag(TAG_GIVEAWAYS);
  revalidatePath("/", "layout");
  return ok({ winnerEmail: winner.email });
}
