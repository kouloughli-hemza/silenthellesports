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

// Each row of entry methods has an enabled flag + URL the user is sent to.
// Admin only fills enabled + URL; labels are baked-in defaults so the form
// stays minimal. URL must be a real URL when enabled (refine below).
const EntryMethodSlot = z
  .object({
    enabled: z.boolean(),
    url: z.string().trim().default(""),
  })
  .refine((v) => !v.enabled || /^https?:\/\/.+/i.test(v.url), {
    message: "URL is required when this method is enabled",
    path: ["url"],
  });

const EntryMethodsForm = z.object({
  follow_tiktok: EntryMethodSlot,
  join_discord: EntryMethodSlot,
  subscribe_youtube: EntryMethodSlot,
  share: EntryMethodSlot,
});

const ENTRY_METHOD_DEFAULT_LABELS = {
  follow_tiktok: { en: "Follow on TikTok", ar: "تابعنا على تيك توك" },
  join_discord: { en: "Join Discord", ar: "انضم إلى ديسكورد" },
  subscribe_youtube: { en: "Subscribe on YouTube", ar: "اشترك في يوتيوب" },
  share: { en: "Share with squad", ar: "شارك مع الفريق" },
} as const;

type EntryMethodSlotKey = keyof typeof ENTRY_METHOD_DEFAULT_LABELS;
const SLOT_ORDER: readonly EntryMethodSlotKey[] = [
  "follow_tiktok",
  "join_discord",
  "subscribe_youtube",
  "share",
];

function buildEntryMethodsArray(
  form: z.infer<typeof EntryMethodsForm>,
): Array<{ type: EntryMethodSlotKey; label: { en: string; ar: string }; url: string; weight: number }> {
  const out: ReturnType<typeof buildEntryMethodsArray> = [];
  for (const type of SLOT_ORDER) {
    const slot = form[type];
    if (!slot.enabled) continue;
    out.push({ type, label: ENTRY_METHOD_DEFAULT_LABELS[type], url: slot.url.trim(), weight: 1 });
  }
  return out;
}

const Schema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG, "lowercase, dashes only"),
  title: TranslatedRequired,
  description: Translated,
  prize_description: TranslatedRequired,
  prize_image_url: z.string().trim().url().nullable(),
  estimated_value: z.string().trim().nullable(),
  entry_methods: EntryMethodsForm,
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
  const dbRow = {
    ...parsed.data,
    entry_methods: buildEntryMethodsArray(parsed.data.entry_methods),
  };
  const { data, error } = await supabase
    .from("giveaways")
    .insert(dbRow as never)
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
  const dbRow = {
    ...parsed.data,
    entry_methods: buildEntryMethodsArray(parsed.data.entry_methods),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("giveaways")
    .update(dbRow as never)
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
