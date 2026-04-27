"use client";

import { useMemo, useState, useTransition } from "react";
import { z } from "zod";

import { SkullIcon } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { ALGERIAN_PHONE_RE } from "@/types/domain";
import type { Locale } from "@/lib/i18n/routing";

import { submitSignupAction } from "./actions";

type Mode = "Solo" | "Duo" | "Squad";

interface SignupFormProps {
  locale: Locale;
  slug: string;
  mode: Mode;
  isPaid: boolean;
  defaultEmail?: string;
  copy: {
    steps: [string, string, string];
    stepProgress: [string, string, string];
    ign: string;
    ignPlaceholder: string;
    uid: string;
    uidPlaceholder: string;
    uidHint: string;
    discord: string;
    discordPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    phoneHint: string;
    emailOptional: string;
    squad: string;
    squadMember: [string, string, string];
    squadMemberUid: [string, string, string];
    player: [string, string, string, string];
    playerUid: [string, string, string, string];
    substitute: string;
    substituteUid: string;
    substituteHint: string;
    abort: string;
    back: string;
    cont: string;
    confirm: string;
    submit: string;
    submitting: string;
    payment: string;
    paymentNote: string;
    freeTitle: string;
    freeSub: string;
    slotted: string;
    seeYou: string;
    operator: string;
    conf: string;
    viewEvent: string;
    eventTitle: string;
    errors: {
      required: string;
      ign: string;
      uid: string;
      discord: string;
      phone: string;
      email: string;
      squad: string;
      generic: string;
      capacity: string;
      registrationClosed: string;
      duplicateUid: string;
      signupClosed: string;
    };
  };
}

interface FormState {
  ign: string;
  pubg_uid: string;
  discord_tag: string;
  contact_phone: string;
  email: string;
  squad: { ign: string; pubg_uid: string }[];
}

const baseClientSchema = z.object({
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
});

const squadMemberSchema = z.object({
  ign: z.string().trim().min(2).max(32),
  pubg_uid: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/),
});

// Number of mandatory player rows (manager is *not* a player anymore).
// Solo = 1 player, Duo = 2, Squad = 4. Every mode gets one extra optional
// substitute slot on top.
function mandatoryPlayerCountFor(mode: Mode): number {
  if (mode === "Squad") return 4;
  if (mode === "Duo") return 2;
  return 1;
}
function maxPlayerCountFor(mode: Mode): number {
  return mandatoryPlayerCountFor(mode) + 1;
}

function emptyForm(mode: Mode, defaultEmail: string): FormState {
  return {
    ign: "",
    pubg_uid: "",
    discord_tag: "",
    contact_phone: "",
    email: defaultEmail,
    // One slot per mandatory player + one optional substitute (always present so
    // the manager can opt to fill it in).
    squad: Array.from({ length: maxPlayerCountFor(mode) }, () => ({
      ign: "",
      pubg_uid: "",
    })),
  };
}

export function SignupForm({
  locale,
  slug,
  mode,
  isPaid,
  defaultEmail,
  copy,
}: SignupFormProps) {
  const isAr = locale === "ar";
  const mandatoryCount = useMemo(() => mandatoryPlayerCountFor(mode), [mode]);
  const maxCount = useMemo(() => maxPlayerCountFor(mode), [mode]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(() => emptyForm(mode, defaultEmail ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateSquad = (index: number, key: "ign" | "pubg_uid", value: string) => {
    setForm((prev) => ({
      ...prev,
      squad: prev.squad.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    }));
  };

  const validateStep1 = (): string | null => {
    const base = baseClientSchema.safeParse({
      ign: form.ign,
      pubg_uid: form.pubg_uid,
      discord_tag: form.discord_tag,
      contact_phone: form.contact_phone,
      email: form.email,
    });
    if (!base.success) {
      const path = base.error.issues[0]?.path[0];
      if (path === "ign") return copy.errors.ign;
      if (path === "pubg_uid") return copy.errors.uid;
      if (path === "discord_tag") return copy.errors.discord;
      if (path === "contact_phone") return copy.errors.phone;
      if (path === "email") return copy.errors.email;
      return copy.errors.generic;
    }
    // First N rows are mandatory. The last row (substitute) is only validated
    // if the manager filled in either field.
    for (let i = 0; i < mandatoryCount; i += 1) {
      const m = form.squad[i];
      if (!m) return copy.errors.squad;
      const check = squadMemberSchema.safeParse(m);
      if (!check.success) return copy.errors.squad;
    }
    const sub = form.squad[mandatoryCount];
    if (sub && (sub.ign.trim().length > 0 || sub.pubg_uid.trim().length > 0)) {
      const check = squadMemberSchema.safeParse(sub);
      if (!check.success) return copy.errors.squad;
    }
    return null;
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ign", form.ign);
      fd.set("pubg_uid", form.pubg_uid);
      fd.set("discord_tag", form.discord_tag);
      fd.set("contact_phone", form.contact_phone);
      fd.set("email", form.email);
      // Skip the substitute row if the manager left it empty.
      form.squad.forEach((m, idx) => {
        const isMandatory = idx < mandatoryCount;
        const filled = m.ign.trim().length > 0 || m.pubg_uid.trim().length > 0;
        if (!isMandatory && !filled) return;
        fd.append("squad_ign", m.ign);
        fd.append("squad_uid", m.pubg_uid);
      });

      const result = await submitSignupAction(fd, { locale, slug });
      if (!result.success) {
        const key = result.error;
        const map: Record<string, string> = {
          errorCapacity: copy.errors.capacity,
          errorRegistrationClosed: copy.errors.registrationClosed,
          errorDuplicateUid: copy.errors.duplicateUid,
          signupClosed: copy.errors.signupClosed,
          errorIgn: copy.errors.ign,
          errorUid: copy.errors.uid,
          errorDiscord: copy.errors.discord,
          errorPhone: copy.errors.phone,
          errorEmail: copy.errors.email,
          errorSquad: copy.errors.squad,
        };
        setError(map[key] ?? copy.errors.generic);
        return;
      }
      setConfirmationCode(result.data.confirmationCode);
      setStep(3);
    });
  };

  return (
    <div className="notch grain w-full" style={{ background: "var(--ash-1)" }}>
      {/* Step indicator */}
      <div
        className="flex gap-3 px-5 pt-5 md:px-7"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={copy.stepProgress[step - 1]}
      >
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1">
            <div
              className="h-1"
              style={{
                background: step >= s ? "var(--hell-red)" : "var(--ash-3)",
              }}
              aria-hidden
            />
            <div
              className="mt-2 font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{
                color: step >= s ? "var(--bone)" : "rgba(245,240,232,0.4)",
              }}
            >
              0{s} · {copy.steps[s - 1]}
            </div>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4 p-5 md:p-7" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="ign" className="field-label">
                {copy.ign}
              </label>
              <input
                id="ign"
                name="ign"
                type="text"
                className="field"
                placeholder={copy.ignPlaceholder}
                value={form.ign}
                onChange={(e) => setForm({ ...form, ign: e.target.value })}
                minLength={2}
                maxLength={32}
                required
                autoComplete="off"
                inputMode="text"
              />
            </div>
            <div>
              <label htmlFor="pubg_uid" className="field-label">
                {copy.uid}
              </label>
              <input
                id="pubg_uid"
                name="pubg_uid"
                type="text"
                className="field"
                placeholder={copy.uidPlaceholder}
                value={form.pubg_uid}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pubg_uid: e.target.value.replace(/\D+/g, ""),
                  })
                }
                inputMode="numeric"
                pattern="\d{6,20}"
                required
                autoComplete="off"
              />
              <div
                className="mt-1 font-mono text-[9px] tracking-[0.15em] uppercase"
                style={{ color: "rgba(245,240,232,0.45)" }}
              >
                {copy.uidHint}
              </div>
            </div>
            <div>
              <label htmlFor="discord_tag" className="field-label">
                {copy.discord}
              </label>
              <input
                id="discord_tag"
                name="discord_tag"
                type="text"
                className="field"
                placeholder={copy.discordPlaceholder}
                value={form.discord_tag}
                onChange={(e) =>
                  setForm({ ...form, discord_tag: e.target.value })
                }
                minLength={2}
                maxLength={40}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="contact_phone" className="field-label">
                {copy.phone}
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                className="field"
                placeholder={copy.phonePlaceholder}
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact_phone: e.target.value.replace(/\D+/g, "").slice(0, 10),
                  })
                }
                inputMode="numeric"
                pattern="0[567][0-9]{8}"
                required
                autoComplete="tel"
              />
              <div
                className="mt-1 font-mono text-[9px] tracking-[0.15em] uppercase"
                style={{ color: "rgba(245,240,232,0.45)" }}
              >
                {copy.phoneHint}
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="field-label">
                {copy.emailOptional}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="field"
                placeholder="ghost@silent.hell"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={254}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="field-label">{copy.squad}</div>
            <div className="space-y-2">
              {Array.from({ length: maxCount }).map((_, i) => {
                const m = form.squad[i] ?? { ign: "", pubg_uid: "" };
                const isSub = i >= mandatoryCount;
                const ignLabel = isSub ? copy.substitute : copy.player[i];
                const uidLabel = isSub ? copy.substituteUid : copy.playerUid[i];
                return (
                  <div key={i} className="space-y-1">
                    {isSub ? (
                      <div
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "rgba(245,240,232,0.55)" }}
                      >
                        {copy.substituteHint}
                      </div>
                    ) : null}
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="field"
                        placeholder={ignLabel}
                        value={m.ign}
                        onChange={(e) => updateSquad(i, "ign", e.target.value)}
                        minLength={isSub ? 0 : 2}
                        maxLength={32}
                        required={!isSub}
                        autoComplete="off"
                        aria-label={ignLabel}
                      />
                      <input
                        className="field"
                        placeholder={uidLabel}
                        value={m.pubg_uid}
                        onChange={(e) =>
                          updateSquad(
                            i,
                            "pubg_uid",
                            e.target.value.replace(/\D+/g, ""),
                          )
                        }
                        inputMode="numeric"
                        pattern={isSub ? undefined : "\\d{6,20}"}
                        required={!isSub}
                        autoComplete="off"
                        aria-label={uidLabel}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="field-error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <Link
              href={`/events/${slug}`}
              className="btn-ghost flex-1 justify-center"
            >
              {copy.abort}
            </Link>
            <button type="submit" className="btn-hell flex-1 justify-center">
              {copy.cont} <span aria-hidden>{isAr ? "←" : "→"}</span>
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="p-5 md:p-7">
          <div
            className="mb-4 font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {copy.payment}
          </div>
          {!isPaid ? (
            <div className="p-6 text-center" style={{ background: "var(--ash-3)" }}>
              <div
                className="font-display text-2xl font-black uppercase italic"
                style={{ color: "var(--hell-red)" }}
              >
                {copy.freeTitle}
              </div>
              <div
                className="mt-2 font-mono text-xs tracking-wider"
                style={{ color: "rgba(245,240,232,0.7)" }}
              >
                {copy.freeSub}
              </div>
            </div>
          ) : (
            <div
              className="p-6"
              style={{
                background: "var(--ash-3)",
                border: "1px solid rgba(230,0,19,0.3)",
              }}
            >
              <p
                className="font-mono text-xs leading-relaxed tracking-wider"
                style={{ color: "rgba(245,240,232,0.85)" }}
              >
                {copy.paymentNote}
              </p>
            </div>
          )}

          {error ? (
            <div className="field-error mt-4" role="alert">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="btn-ghost flex-1 justify-center"
              disabled={pending}
            >
              <span aria-hidden>{isAr ? "→" : "←"}</span> {copy.back}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-hell flex-1 justify-center"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? copy.submitting : copy.submit}
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && confirmationCode ? (
        <div className="p-8 text-center md:p-10">
          <div className="mb-4 flex justify-center">
            <SkullIcon size={48} />
          </div>
          <div
            className="font-display text-3xl font-black uppercase italic"
            style={{ color: "var(--hell-red)" }}
          >
            {copy.slotted}
          </div>
          <div
            className="mt-3 font-mono text-xs tracking-[0.2em] uppercase"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            {copy.seeYou} {copy.eventTitle}, {form.ign || copy.operator}.
          </div>
          <div
            className="mt-6 inline-block px-4 py-2 font-mono text-xs tracking-wider"
            style={{ background: "var(--ash-3)", color: "var(--ember)" }}
          >
            {copy.conf} SH-{confirmationCode}
          </div>
          <div className="mt-8">
            <Link href={`/events/${slug}`} className="btn-hell">
              {copy.viewEvent}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
