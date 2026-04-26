// Locale-aware formatting helpers — pure, safe to import anywhere.

import type { Locale } from "@/lib/i18n/routing";

export function formatDateShort(iso: string | Date, locale: Locale): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    month: "short",
    day: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function formatDateLong(iso: string | Date, locale: Locale): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(iso: string | Date, locale: Locale): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function formatWeekday(iso: string | Date, locale: Locale): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
}

// Convert ISO 3166-1 alpha-2 (DZ, FR, etc.) to a flag emoji.
// Range trick: regional indicator letters are at U+1F1E6+.
export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "🏴";
  const code = countryCode.toUpperCase();
  const a = code.charCodeAt(0);
  const b = code.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🏴";
  return String.fromCodePoint(0x1f1e6 + (a - 65), 0x1f1e6 + (b - 65));
}

// Countdown breakdown for the giveaway/store countdown UI.
export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
}

export function countdownTo(target: string | Date, now: Date = new Date()): Countdown {
  const targetMs = (typeof target === "string" ? new Date(target) : target).getTime();
  const totalMs = targetMs - now.getTime();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  }
  const seconds = Math.floor(totalMs / 1000) % 60;
  const minutes = Math.floor(totalMs / (1000 * 60)) % 60;
  const hours = Math.floor(totalMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, expired: false, totalMs };
}

// "in 2D 14H 06M" / "في ٢ يوم و ١٤ ساعة"
export function relativeUntil(target: string | Date, locale: Locale): string {
  const c = countdownTo(target);
  if (c.expired) return locale === "ar" ? "انتهى" : "ENDED";
  const parts: string[] = [];
  if (locale === "ar") {
    if (c.days > 0) parts.push(`${c.days} يوم`);
    if (c.hours > 0) parts.push(`${c.hours} سا`);
    if (c.minutes > 0 && c.days === 0) parts.push(`${c.minutes} د`);
  } else {
    if (c.days > 0) parts.push(`${c.days}D`);
    if (c.hours > 0) parts.push(`${String(c.hours).padStart(2, "0")}H`);
    if (c.minutes > 0 && c.days === 0) parts.push(`${String(c.minutes).padStart(2, "0")}M`);
  }
  if (parts.length === 0) return locale === "ar" ? "أقل من دقيقة" : "<1M";
  return locale === "ar" ? `في ${parts.join(" و ")}` : `IN ${parts.join(" ")}`;
}
