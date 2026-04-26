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

const RuleSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
});

const Schema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG, "lowercase, dashes only"),
  title: TranslatedRequired,
  description: Translated,
  mode: z.enum(["Solo", "Duo", "Squad"]),
  map: z.string().trim().max(60).nullable(),
  prize_pool: z.number().int().min(0),
  prize_currency: z.string().trim().toUpperCase().length(3),
  entry_fee: z.number().int().min(0),
  capacity: z.number().int().min(1).max(10000),
  start_at: z.string().min(1),
  registration_closes_at: z.string().min(1),
  status: z.enum(["upcoming", "open", "closed", "live", "completed", "cancelled"]),
  cover_image_url: z.string().trim().url().nullable(),
  rules: z.array(RuleSchema).max(50),
  tag: z.string().trim().max(40).nullable(),
});

export type EventInput = z.infer<typeof Schema>;

export async function createEventAction(input: EventInput): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>();
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event.create",
    entityType: "events",
    entityId: data.id,
    after: { slug: parsed.data.slug },
  });
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateEventAction(
  id: string,
  input: EventInput,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event.update",
    entityType: "events",
    entityId: id,
    after: { slug: parsed.data.slug, status: parsed.data.status },
  });
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteEventAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event.delete",
    entityType: "events",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return ok({ id });
}
