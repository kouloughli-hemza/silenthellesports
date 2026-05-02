// =============================================================================
// Silent Hell — domain types and shared envelopes
// Pure TypeScript: no runtime imports, safe to import anywhere.
// =============================================================================

import type { Json, Row, Translated } from "@/types/database";
import type { Locale } from "@/lib/i18n/routing";

export type { Translated, Locale };

// ----- result envelope (every server action returns one of these) -----
export type Result<T> = { success: true; data: T } | { success: false; error: string };

export const ok = <T>(data: T): Result<T> => ({ success: true, data });
export const fail = (error: string): Result<never> => ({ success: false, error });

// ----- locale-aware translations -----
// Accepts a Json (jsonb column) and narrows to a Translated. Falls back to the
// other locale or an empty string if shape mismatches.
export function pickTranslation(value: Json | Translated | null | undefined, locale: Locale): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const obj = value as { en?: unknown; ar?: unknown };
  const candidate = obj[locale];
  if (typeof candidate === "string" && candidate.trim().length > 0) return candidate;
  if (typeof obj.en === "string" && obj.en.length > 0) return obj.en;
  if (typeof obj.ar === "string" && obj.ar.length > 0) return obj.ar;
  return "";
}

export function asTranslated(value: Json | null | undefined): Translated {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { en: "", ar: "" };
  }
  const obj = value as { en?: unknown; ar?: unknown };
  return {
    en: typeof obj.en === "string" ? obj.en : "",
    ar: typeof obj.ar === "string" ? obj.ar : "",
  };
}

// ----- player stats shape (stored in players.stats jsonb) -----
export interface PlayerStats {
  kd?: number;
  headshot_pct?: number;
  matches?: number;
  wins?: number;
}

// ----- player socials shape (stored in players.socials jsonb) -----
// Existing rows may carry legacy keys (twitch / youtube / x); we read and
// write only these three. Orphaned keys are left in the DB until the row is
// next saved, then discarded.
export interface PlayerSocials {
  tiktok?: string;
  liquipedia?: string;
  instagram?: string;
}

// ----- giveaway entry method shape -----
export type GiveawayEntryMethodType =
  | "follow_x"
  | "join_discord"
  | "subscribe_youtube"
  | "share";

export interface GiveawayEntryMethod {
  type: GiveawayEntryMethodType;
  label: Translated;
  url: string;
  weight: number;
}

// ----- order squad member (events) -----
export interface SquadMember {
  ign: string;
  pubg_uid: string;
}

// ----- domain views (components consume these, not raw rows) -----
export type Player = Row<"players">;
export type Trophy = Row<"trophies">;
export type Event = Row<"events">;
export type EventSignup = Row<"event_signups">;
export type Product = Row<"products">;
export type ProductVariant = Row<"product_variants">;
export type Order = Row<"orders">;
export type OrderItem = Row<"order_items">;
export type Giveaway = Row<"giveaways">;
export type GiveawayEntry = Row<"giveaway_entries">;
export type Page = Row<"pages">;
export type Profile = Row<"profiles">;
export type TeamMilestone = Row<"team_milestones">;
export type TeamStat = Row<"team_stats">;
export type TacticBoard = Row<"tactic_boards">;
export const MILESTONE_CATEGORIES = [
  "founding",
  "tournament_win",
  "roster",
  "milestone",
  "release",
  "partnership",
  "other",
] as const;
export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

// Returns the event's map list (new `maps jsonb` array) with a fallback to the
// legacy single-map column for older rows that haven't been backfilled.
export function getEventMaps(event: Event): string[] {
  const raw = (event as { maps?: unknown }).maps;
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((m) => (typeof m === "string" ? m.trim() : ""))
      .filter((s) => s.length > 0);
  }
  const single = (event.map ?? "").trim();
  return single.length > 0 ? [single] : [];
}

// ----- Algerian phone validation -----
export const ALGERIAN_PHONE_RE = /^0[567]\d{8}$/;
export const isAlgerianPhone = (s: string): boolean => ALGERIAN_PHONE_RE.test(s);

// ----- price formatting (DZD by default) -----
export function formatPrice(amount: number, locale: Locale, currency = "DZD"): string {
  if (currency === "DZD") {
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
      maximumFractionDigits: 0,
    }).format(amount);
    return locale === "ar" ? `${formatted} د.ج` : `${formatted} DZD`;
  }
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
