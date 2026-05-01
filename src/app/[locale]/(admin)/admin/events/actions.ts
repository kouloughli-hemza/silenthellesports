"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAG_EVENTS } from "@/lib/data/events";
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
  // Legacy single-map column kept for back-compat reads; the form writes the array.
  map: z.string().trim().max(60).nullable(),
  maps: z
    .array(z.string().trim().min(1).max(60))
    .max(5, "Up to 5 maps."),
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

  // Keep the legacy `map` column in sync with `maps[0]` so older readers don't break.
  const payload = { ...parsed.data, map: parsed.data.maps[0] ?? null };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .insert(payload as never)
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
  revalidateTag(TAG_EVENTS);
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

  const payload = {
    ...parsed.data,
    map: parsed.data.maps[0] ?? null,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("events")
    .update(payload as never)
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event.update",
    entityType: "events",
    entityId: id,
    after: { slug: parsed.data.slug, status: parsed.data.status },
  });
  revalidateTag(TAG_EVENTS);
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
  revalidateTag(TAG_EVENTS);
  revalidatePath("/", "layout");
  return ok({ id });
}

// ----- Signup management ------------------------------------------------------

const PaymentStatusSchema = z.enum(["pending", "paid", "waived", "refunded"]);
const SignupStatusSchema = z.enum([
  "registered",
  "checked_in",
  "disqualified",
  "withdrawn",
]);

export async function updateSignupPaymentAction(
  id: string,
  payment_status: z.infer<typeof PaymentStatusSchema>,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = PaymentStatusSchema.safeParse(payment_status);
  if (!parsed.success) return fail("Invalid payment status.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_signups")
    .update({ payment_status: parsed.data })
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event_signup.payment_update",
    entityType: "event_signups",
    entityId: id,
    after: { payment_status: parsed.data },
  });
  revalidateTag(TAG_EVENTS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function updateSignupStatusAction(
  id: string,
  status: z.infer<typeof SignupStatusSchema>,
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = SignupStatusSchema.safeParse(status);
  if (!parsed.success) return fail("Invalid status.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_signups")
    .update({ status: parsed.data })
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event_signup.status_update",
    entityType: "event_signups",
    entityId: id,
    after: { status: parsed.data },
  });
  revalidateTag(TAG_EVENTS);
  revalidatePath("/", "layout");
  return ok({ id });
}

export async function deleteSignupAction(id: string): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("event_signups").delete().eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event_signup.delete",
    entityType: "event_signups",
    entityId: id,
  });
  revalidateTag(TAG_EVENTS);
  revalidatePath("/", "layout");
  return ok({ id });
}

const RosterMemberSchema = z.object({
  ign: z.string().trim().min(2).max(32),
  pubg_uid: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/),
});

const RosterSchema = z.array(RosterMemberSchema).max(5);

export async function updateSignupSquadAction(
  id: string,
  squad_members: { ign: string; pubg_uid: string }[],
): Promise<Result<{ id: string }>> {
  const profile = await requireAdmin();
  const parsed = RosterSchema.safeParse(squad_members);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid roster.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_signups")
    .update({ squad_members: parsed.data as never })
    .eq("id", id);
  if (error) return fail(error.message);

  await recordAudit({
    actorId: profile.id,
    action: "event_signup.squad_update",
    entityType: "event_signups",
    entityId: id,
    after: { count: parsed.data.length },
  });
  revalidateTag(TAG_EVENTS);
  revalidatePath("/", "layout");
  return ok({ id });
}
