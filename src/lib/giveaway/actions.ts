"use server";

// Server actions for giveaway entry submission. Anonymous + authed flows both
// supported. Each call upserts a single row in `giveaway_entries` keyed on
// (giveaway_id, email). The action re-validates the giveaway window and the
// methods list against the row in the DB — clients are not trusted.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEntryMethods } from "@/lib/utils/giveaway";
import { brandedTemplate, sendEmail } from "@/services/email";
import type { Insert, Json } from "@/types/database";
import { fail, ok, pickTranslation, type Result } from "@/types/domain";

const ENTRY_METHOD_TYPES = [
  "follow_tiktok",
  "join_discord",
  "subscribe_youtube",
  "share",
] as const;

const ClaimEntrySchema = z.object({
  giveawayId: z.string().uuid(),
  email: z.string().email().max(254),
  discordTag: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  completedMethods: z.array(z.enum(ENTRY_METHOD_TYPES)).max(16),
});

export interface ClaimEntryInput {
  giveawayId: string;
  email: string;
  discordTag?: string;
  completedMethods: Array<(typeof ENTRY_METHOD_TYPES)[number]>;
}

export interface ClaimEntryResult {
  entryCount: number;
  totalPool: number;
}

export async function claimEntryAction(
  input: ClaimEntryInput,
): Promise<Result<ClaimEntryResult>> {
  // Sign-in gate — entries require an authenticated user. Server-side check
  // so we can't be bypassed by a client that hides the prompt.
  const sessionUser = await getSessionUser();
  if (!sessionUser) return fail("Sign in to enter this giveaway.");

  const parsed = ClaimEntrySchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check your details and try again.");
  }
  const data = parsed.data;

  try {
    const admin = createAdminClient();

    // 1. Re-fetch the giveaway server-side. Source of truth for status, window,
    // and allowed methods. Anything the client claimed beyond what's in the DB
    // is dropped.
    const { data: giveaway, error: gErr } = await admin
      .from("giveaways")
      .select(
        "id, status, starts_at, ends_at, entry_methods, title, prize_description, slug",
      )
      .eq("id", data.giveawayId)
      .maybeSingle();

    if (gErr || !giveaway) {
      return fail("Giveaway not found.");
    }

    if (giveaway.status !== "active") {
      return fail("This giveaway isn't accepting entries right now.");
    }

    const now = Date.now();
    const startsAt = new Date(giveaway.starts_at).getTime();
    const endsAt = new Date(giveaway.ends_at).getTime();
    if (Number.isFinite(startsAt) && now < startsAt) {
      return fail("Entries haven't opened yet. Check back soon.");
    }
    if (Number.isFinite(endsAt) && now > endsAt) {
      return fail("Entries are closed for this drop.");
    }

    const methods = parseEntryMethods(giveaway.entry_methods);
    if (methods.length === 0) {
      return fail("No entry methods are configured for this giveaway.");
    }
    const allowedTypes = new Set(methods.map((m) => m.type));

    // Filter the client-supplied list to methods that actually exist on the
    // giveaway, then dedupe.
    const acceptedSet = new Set<(typeof ENTRY_METHOD_TYPES)[number]>();
    for (const t of data.completedMethods) {
      if (allowedTypes.has(t)) acceptedSet.add(t);
    }
    if (acceptedSet.size === 0) {
      return fail("Complete at least one entry method first.");
    }
    const accepted = Array.from(acceptedSet);
    const requestedCount = Math.min(accepted.length, methods.length);

    // 2. Look up existing entry to enforce non-decreasing entry_count.
    const { data: existing } = await admin
      .from("giveaway_entries")
      .select("id, entry_count, completed_methods")
      .eq("giveaway_id", data.giveawayId)
      .eq("email", data.email)
      .maybeSingle();

    // Merge previously-completed methods so a re-submit never decreases.
    const previousMethods: string[] = Array.isArray(existing?.completed_methods)
      ? (existing.completed_methods as Json[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];
    const mergedMethodSet = new Set<string>(previousMethods);
    for (const m of accepted) mergedMethodSet.add(m);
    // Drop any previously-stored types that aren't valid for this giveaway.
    const mergedMethods = Array.from(mergedMethodSet).filter(
      (m): m is (typeof ENTRY_METHOD_TYPES)[number] =>
        (allowedTypes as Set<string>).has(m),
    );
    const nextEntryCount = Math.min(
      Math.max(existing?.entry_count ?? 0, requestedCount, mergedMethods.length),
      methods.length,
    );

    // Reuse the session fetched at the top of the action — we already
     // proved the user is signed in there. user_id is always non-null now.
    const userId = sessionUser.id;

    const completedMethodsJson: Json = mergedMethods as unknown as Json;

    const insertRow: Insert<"giveaway_entries"> = {
      giveaway_id: data.giveawayId,
      email: data.email,
      discord_tag: data.discordTag ?? null,
      completed_methods: completedMethodsJson,
      entry_count: nextEntryCount,
      user_id: userId,
    };

    const { error: upsertErr } = await admin
      .from("giveaway_entries")
      .upsert(insertRow, { onConflict: "giveaway_id,email" });

    if (upsertErr) {
      return fail("Couldn't save your entry. Try again in a moment.");
    }

    // 3. Best-effort confirmation email.
    const wasNew = !existing;
    const isUpgrade = !wasNew && nextEntryCount > (existing?.entry_count ?? 0);
    if (wasNew || isUpgrade) {
      const titleEn = pickTranslation(giveaway.title, "en") || "Silent Hell drop";
      const prizeEn =
        pickTranslation(giveaway.prize_description, "en") || "the active drop";
      const html = brandedTemplate({
        preheader: `Your entry for ${titleEn} is locked.`,
        heading: wasNew ? "Slot locked. Good luck." : "Entries updated.",
        bodyHtml: `
          <p>You're in for <strong>${escapeHtml(titleEn)}</strong>.</p>
          <p style="color:rgba(245,240,232,0.7)">Prize: ${escapeHtml(prizeEn)}</p>
          <p style="color:rgba(245,240,232,0.7)">Entries on this email: <strong>${nextEntryCount}</strong> / ${methods.length}</p>
          <p style="color:rgba(245,240,232,0.7);font-size:12px">Drop pulled live on stream when the timer hits zero. Winners are DM'd within 24h.</p>
        `,
        ctaUrl: `${getSiteOrigin()}/en/giveaways/${giveaway.slug}`,
        ctaLabel: "VIEW DROP",
      });
      const text = `You're entered in ${titleEn}. Entries on this email: ${nextEntryCount}/${methods.length}.`;
      // Fire and forget — we don't fail the user-facing flow on email errors.
      void sendEmail({
        to: data.email,
        subject: `[SILENT HELL] You're entered — ${titleEn}`,
        html,
        text,
      }).catch(() => {
        // swallowed: email is best-effort
      });
    }

    // 4. Refresh server-rendered pages so the pool count updates.
    revalidatePath("/[locale]/giveaways", "page");
    revalidatePath(`/[locale]/giveaways/${giveaway.slug}`, "page");
    revalidatePath("/[locale]", "page");

    const { count: poolCount } = await admin
      .from("giveaway_entries")
      .select("id", { count: "exact", head: true })
      .eq("giveaway_id", data.giveawayId);

    return ok({
      entryCount: nextEntryCount,
      totalPool: poolCount ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("[giveaway:claim] failed", message);
    return fail("Something went sideways. Try again.");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
