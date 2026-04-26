"use server";

import { z } from "zod";

import { getEventBySlug } from "@/lib/data/events";
import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, brandedTemplate } from "@/services/email";
import { ALGERIAN_PHONE_RE, fail, ok, pickTranslation, type Result } from "@/types/domain";
import type { Insert, Json } from "@/types/database";
import type { Locale } from "@/lib/i18n/routing";

// ---------- shared schema ----------

const SquadMemberSchema = z.object({
  ign: z.string().trim().min(2).max(32),
  pubg_uid: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/),
});

const SignupSchemaBase = z.object({
  ign: z.string().trim().min(2).max(32),
  pubg_uid: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/),
  discord_tag: z.string().trim().min(2).max(40),
  contact_phone: z
    .string()
    .trim()
    .regex(ALGERIAN_PHONE_RE),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  squad_members: z.array(SquadMemberSchema).max(3).default([]),
});

export type SignupInput = z.infer<typeof SignupSchemaBase>;

interface ActionInput extends SignupInput {
  locale: Locale;
  slug: string;
}

interface ActionResult {
  confirmationCode: string;
}

function readFormPayload(formData: FormData): SignupInput {
  const squadIgns = formData.getAll("squad_ign").map((v) => String(v ?? "").trim());
  const squadUids = formData.getAll("squad_uid").map((v) => String(v ?? "").trim());
  const max = Math.max(squadIgns.length, squadUids.length);
  const squad: { ign: string; pubg_uid: string }[] = [];
  for (let i = 0; i < max; i += 1) {
    const ign = squadIgns[i] ?? "";
    const pubg_uid = squadUids[i] ?? "";
    if (ign.length > 0 || pubg_uid.length > 0) {
      squad.push({ ign, pubg_uid });
    }
  }

  return {
    ign: String(formData.get("ign") ?? "").trim(),
    pubg_uid: String(formData.get("pubg_uid") ?? "").trim(),
    discord_tag: String(formData.get("discord_tag") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    squad_members: squad,
  };
}

function classifyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("is full")) return "errorCapacity";
  if (lower.includes("registration") && lower.includes("closed")) return "errorRegistrationClosed";
  if (lower.includes("not accepting signups")) return "errorRegistrationClosed";
  if (lower.includes("duplicate") || lower.includes("unique") || lower.includes("23505")) {
    return "errorDuplicateUid";
  }
  return "error";
}

export async function submitSignupAction(
  formData: FormData,
  input: { locale: Locale; slug: string },
): Promise<Result<ActionResult>> {
  // ---- 1. Load event (server-authoritative — never trust an event id from client) ----
  const event = await getEventBySlug(input.slug);
  if (!event) return fail("error");

  if (event.status !== "open" && event.status !== "upcoming") {
    return fail("signupClosed");
  }
  if (new Date(event.registration_closes_at).getTime() < Date.now()) {
    return fail("signupClosed");
  }

  // ---- 2. Validate payload ----
  const payload = readFormPayload(formData);

  const expectedSquadCount =
    event.mode === "Squad" ? 3 : event.mode === "Duo" ? 1 : 0;

  const parsed = SignupSchemaBase.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path[0];
    if (path === "ign") return fail("errorIgn");
    if (path === "pubg_uid") return fail("errorUid");
    if (path === "discord_tag") return fail("errorDiscord");
    if (path === "contact_phone") return fail("errorPhone");
    if (path === "email") return fail("errorEmail");
    if (path === "squad_members") return fail("errorSquad");
    return fail("error");
  }

  if (parsed.data.squad_members.length !== expectedSquadCount) {
    return fail("errorSquad");
  }

  // ---- 3. Insert (DB trigger enforces capacity / closure) ----
  const sessionUser = await getSessionUser();
  const admin = createAdminClient();

  const insertRow: Insert<"event_signups"> = {
    event_id: event.id,
    user_id: sessionUser?.id ?? null,
    ign: parsed.data.ign,
    pubg_uid: parsed.data.pubg_uid,
    discord_tag: parsed.data.discord_tag,
    contact_phone: parsed.data.contact_phone,
    squad_members: parsed.data.squad_members as unknown as Json,
  };

  const { data: inserted, error: insertError } = await admin
    .from("event_signups")
    .insert(insertRow)
    .select("confirmation_code")
    .single();

  if (insertError || !inserted) {
    const key = insertError ? classifyDbError(insertError.message) : "error";
    return fail(key);
  }

  const confirmationCode = inserted.confirmation_code;

  // ---- 4. Best-effort email ----
  const recipient = parsed.data.email && parsed.data.email.length > 0
    ? parsed.data.email
    : sessionUser?.email ?? "";

  if (recipient.length > 0) {
    const title = pickTranslation(event.title, input.locale);
    const subject =
      input.locale === "ar"
        ? `تم تثبيت مقعدك · ${title}`
        : `You're slotted · ${title}`;
    const heading =
      input.locale === "ar" ? "تم الحجز." : "Slotted.";
    const greeting =
      input.locale === "ar"
        ? `أهلاً ${parsed.data.ign}،`
        : `Hey ${parsed.data.ign},`;
    const intro =
      input.locale === "ar"
        ? `تم تأكيد مقعدك في <strong>${title}</strong>.`
        : `Your slot for <strong>${title}</strong> is locked in.`;
    const codeLine =
      input.locale === "ar"
        ? `رمز التأكيد: <strong style="color:#E60013">SH-${confirmationCode}</strong>`
        : `Confirmation code: <strong style="color:#E60013">SH-${confirmationCode}</strong>`;
    const paymentLine =
      event.entry_fee > 0
        ? input.locale === "ar"
          ? "البطولة مدفوعة. سيتواصل المسؤول معك لتنسيق الدفع. مقعدك محجوز."
          : "This is a paid event. An admin will reach out to arrange entry payment. Your slot is held."
        : input.locale === "ar"
        ? "حدث مجاني. لا توجد رسوم."
        : "Free entry — no payment required.";

    const bodyHtml = `
      <p>${greeting}</p>
      <p>${intro}</p>
      <p>${paymentLine}</p>
      <p style="margin-top:24px">${codeLine}</p>
    `;

    const html = brandedTemplate({
      preheader: subject,
      heading,
      bodyHtml,
    });
    const text = `${greeting}\n${intro.replace(/<[^>]+>/g, "")}\n${paymentLine}\nSH-${confirmationCode}`;

    const emailResult = await sendEmail({
      to: recipient,
      subject,
      html,
      text,
    });
    if (!emailResult.success) {
      // Swallow — signup itself succeeded.
      console.warn("[signup] email send failed:", emailResult.error);
    }
  }

  return ok({ confirmationCode });
}

export type { ActionInput };
