"use client";

// GiveawayEntryForm — interactive replacement for the static "lock entries"
// stub. Each method button toggles a local "completed" state, opens the URL
// in a new tab, and the user can lock in the entry once at least one method
// is complete and an email is set. State is persisted to localStorage so
// refreshes don't reset progress.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";

import { claimEntryAction } from "@/lib/giveaway/actions";
import {
  pickTranslation,
  type GiveawayEntryMethod,
  type GiveawayEntryMethodType,
  type Locale,
} from "@/types/domain";

interface GiveawayEntryFormProps {
  giveawayId: string;
  methods: GiveawayEntryMethod[];
  locale: Locale;
  initialPool: number;
  // Pre-fill from authenticated session.
  defaultEmail?: string | null;
  defaultDiscordTag?: string | null;
  // Pre-fill from server-side existing-entry lookup (signed-in users only).
  initialCompleted?: GiveawayEntryMethodType[];
  initialEntryCount?: number;
  // Localized strings — keeps the component server-component-mountable from
  // pages without dragging useTranslations into a client tree.
  i18n: GiveawayEntryFormI18n;
  // Visual variant: "panel" (full sidebar layout, used on the giveaways routes
  // and home preview) — currently the only variant; expose for future tweaks.
  variant?: "panel";
}

export interface GiveawayEntryFormI18n {
  live: string;
  yours: string;
  pool: string;
  lockEntry: string;
  lockSubmitting: string;
  lockedSuccess: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailRequired: string;
  discordOptional: string;
  discordPlaceholder: string;
  alreadyEntered: string;
  error: string;
  openLink: string;
  markComplete: string;
  markedComplete: string;
  noEntryMethods: string;
  h1: string;
  h2: string;
  h3: string;
  entry: string;
  entries: string;
}

const METHOD_ICONS: Record<GiveawayEntryMethodType, string> = {
  follow_x: "𝕏",
  join_discord: "DC",
  subscribe_youtube: "YT",
  share: "↗",
};

const StorageSchema = z.object({
  email: z.string().email().optional(),
  discordTag: z.string().optional(),
  completed: z.array(
    z.enum(["follow_x", "join_discord", "subscribe_youtube", "share"]),
  ),
  entryCount: z.number().int().nonnegative().optional(),
});

const ClientEmail = z.string().email().max(254);
const ClientDiscord = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .optional()
  .or(z.literal("").transform(() => undefined));

function storageKey(giveawayId: string): string {
  return `sh:giveaway:${giveawayId}`;
}

export function GiveawayEntryForm({
  giveawayId,
  methods,
  locale,
  initialPool,
  defaultEmail,
  defaultDiscordTag,
  initialCompleted,
  initialEntryCount,
  i18n,
}: GiveawayEntryFormProps) {
  const totalMethods = methods.length;
  const formattedPool = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US"),
    [locale],
  );

  // Map allowed types for fast lookup.
  const allowedTypes = useMemo(
    () => new Set(methods.map((m) => m.type)),
    [methods],
  );

  const [completed, setCompleted] = useState<Set<GiveawayEntryMethodType>>(() => {
    const init = new Set<GiveawayEntryMethodType>();
    if (initialCompleted) {
      for (const t of initialCompleted) {
        if (allowedTypes.has(t)) init.add(t);
      }
    }
    return init;
  });
  const [email, setEmail] = useState<string>(defaultEmail ?? "");
  const [discordTag, setDiscordTag] = useState<string>(defaultDiscordTag ?? "");
  const [pool, setPool] = useState<number>(initialPool);
  const [committedEntryCount, setCommittedEntryCount] = useState<number>(
    initialEntryCount ?? 0,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount. Server-rendered state from
  // initialCompleted/initialEntryCount wins over guest-only localStorage when
  // both are present (i.e. authed user).
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey(giveawayId));
      if (!raw) return;
      const parsed = StorageSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return;
      // Only adopt local state if the server didn't already give us a baseline.
      if (!initialCompleted || initialCompleted.length === 0) {
        const next = new Set<GiveawayEntryMethodType>();
        for (const t of parsed.data.completed) {
          if (allowedTypes.has(t)) next.add(t);
        }
        if (next.size > 0) setCompleted(next);
      }
      if (!defaultEmail && parsed.data.email) {
        setEmail(parsed.data.email);
      }
      if (!defaultDiscordTag && parsed.data.discordTag) {
        setDiscordTag(parsed.data.discordTag);
      }
      if (
        (initialEntryCount === undefined || initialEntryCount === 0) &&
        typeof parsed.data.entryCount === "number"
      ) {
        setCommittedEntryCount(parsed.data.entryCount);
      }
    } catch {
      // localStorage parse error — ignore, start fresh.
    }
  }, [
    allowedTypes,
    defaultDiscordTag,
    defaultEmail,
    giveawayId,
    initialCompleted,
    initialEntryCount,
  ]);

  // Persist on every meaningful change.
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKey(giveawayId),
        JSON.stringify({
          email: email || undefined,
          discordTag: discordTag || undefined,
          completed: Array.from(completed),
          entryCount: committedEntryCount,
        }),
      );
    } catch {
      // Quota / Safari private mode — silently ignore.
    }
  }, [committedEntryCount, completed, discordTag, email, giveawayId]);

  const completedCount = completed.size;
  const emailValid = ClientEmail.safeParse(email).success;
  const discordValid = ClientDiscord.safeParse(discordTag).success;
  const canSubmit =
    completedCount > 0 && emailValid && discordValid && !pending && totalMethods > 0;

  function toggleMethod(type: GiveawayEntryMethodType, url: string): void {
    setError(null);
    setSuccess(null);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
        // Open URL in a new tab on mark-complete only.
        if (typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!emailValid) {
      setError(i18n.emailRequired);
      return;
    }
    if (!discordValid) {
      setError(i18n.error);
      return;
    }
    if (completedCount === 0) {
      setError(i18n.error);
      return;
    }
    const payload = {
      giveawayId,
      email,
      discordTag: discordTag.trim() || undefined,
      completedMethods: Array.from(completed),
    };
    startTransition(async () => {
      const result = await claimEntryAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCommittedEntryCount(result.data.entryCount);
      setPool(result.data.totalPool);
      setSuccess(i18n.lockedSuccess);
    });
  }

  const lockButtonLabel = (() => {
    if (pending) return i18n.lockSubmitting;
    if (committedEntryCount > 0 && completedCount === committedEntryCount) {
      return `${i18n.alreadyEntered} · ${committedEntryCount} ${
        committedEntryCount === 1 ? i18n.entry : i18n.entries
      }`;
    }
    const word = completedCount === 1 ? i18n.entry : i18n.entries;
    return `${i18n.lockEntry} ${completedCount} ${word} →`;
  })();

  const formattedPoolText = formattedPool.format(pool);

  return (
    <form onSubmit={onSubmit} className="flex flex-col" noValidate>
      <div className="mb-5 flex items-center gap-2">
        <span className="live-dot" />
        <span
          className="font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {i18n.live}
        </span>
      </div>
      <div className="font-display text-2xl leading-tight font-black uppercase italic md:text-3xl">
        {i18n.h1} <span style={{ color: "var(--ember)" }}>{i18n.h2}</span>
        <br />
        {i18n.h3}
      </div>

      <div className="mt-6 space-y-2">
        {totalMethods === 0 ? (
          <div
            className="p-4 font-mono text-xs"
            style={{
              background: "var(--ash-3)",
              color: "rgba(245,240,232,0.6)",
            }}
          >
            {i18n.noEntryMethods}
          </div>
        ) : (
          methods.map((method, i) => {
            const isDone = completed.has(method.type);
            const labelText =
              pickTranslation(method.label, locale) || method.type;
            return (
              <button
                key={`${method.type}-${i}`}
                type="button"
                onClick={() => toggleMethod(method.type, method.url)}
                aria-pressed={isDone}
                className="interactive flex w-full items-center gap-3 p-4 text-start transition-all sm:gap-4"
                style={{
                  background: isDone ? "rgba(230,0,19,0.12)" : "var(--ash-3)",
                  border:
                    "1px solid " +
                    (isDone ? "var(--hell-red)" : "rgba(245,240,232,0.06)"),
                }}
              >
                <span
                  className="font-mono text-[10px] tracking-[0.25em]"
                  style={{ color: "rgba(245,240,232,0.4)" }}
                >
                  {`0${i + 1}`}
                </span>
                <div
                  aria-hidden
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
                  style={{
                    background: isDone ? "var(--hell-red)" : "var(--ash-1)",
                    border:
                      "1px solid " +
                      (isDone ? "var(--hell-red)" : "rgba(245,240,232,0.2)"),
                  }}
                >
                  {isDone ? (
                    <span style={{ color: "var(--bone)", fontSize: 14 }}>✓</span>
                  ) : (
                    <span className="font-mono text-xs opacity-60">
                      {METHOD_ICONS[method.type]}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-sm font-medium">{labelText}</span>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] whitespace-nowrap"
                  style={{
                    color: isDone ? "var(--ember)" : "rgba(245,240,232,0.4)",
                  }}
                >
                  {isDone ? i18n.markedComplete : i18n.openLink}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`gw-email-${giveawayId}`} className="field-label">
            {i18n.emailLabel}
          </label>
          <input
            id={`gw-email-${giveawayId}`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={i18n.emailPlaceholder}
            className="field"
            aria-invalid={email.length > 0 && !emailValid}
          />
        </div>
        <div>
          <label htmlFor={`gw-discord-${giveawayId}`} className="field-label">
            {i18n.discordOptional}
          </label>
          <input
            id={`gw-discord-${giveawayId}`}
            name="discord_tag"
            type="text"
            autoComplete="off"
            value={discordTag}
            onChange={(e) => setDiscordTag(e.target.value)}
            placeholder={i18n.discordPlaceholder}
            className="field"
            aria-invalid={discordTag.length > 0 && !discordValid}
          />
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-2 gap-px"
        style={{ background: "rgba(230,0,19,0.25)" }}
      >
        <div className="p-4" style={{ background: "var(--ash-1)" }}>
          <div
            className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {i18n.yours}
          </div>
          <div
            className="font-display mt-1 text-2xl font-black italic md:text-3xl"
            style={{ color: "var(--hell-red)" }}
          >
            {Math.max(committedEntryCount, completedCount)}{" "}
            <span style={{ color: "rgba(245,240,232,0.3)" }}>
              / {totalMethods || 4}
            </span>
          </div>
        </div>
        <div className="p-4" style={{ background: "var(--ash-1)" }}>
          <div
            className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {i18n.pool}
          </div>
          <div className="font-display mt-1 text-2xl font-black italic md:text-3xl">
            <span className="stat-number">{formattedPoolText}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-3" role="alert">
          <div className="field-error">{error}</div>
        </div>
      ) : null}
      {success ? (
        <div
          className="mt-3 font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: "var(--ember)" }}
          role="status"
        >
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-hell mt-3 w-full justify-center"
        style={{
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {lockButtonLabel}
      </button>
    </form>
  );
}
