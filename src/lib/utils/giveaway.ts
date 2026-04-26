import { z } from "zod";
import type { Json } from "@/types/database";
import type { GiveawayEntryMethod } from "@/types/domain";

const TranslatedSchema = z.object({
  en: z.string(),
  ar: z.string(),
});

const EntryMethodSchema = z.object({
  type: z.enum(["follow_x", "join_discord", "subscribe_youtube", "share"]),
  label: TranslatedSchema,
  url: z.string().url(),
  weight: z.number().int().nonnegative(),
});

const ENTRY_ICONS: Record<GiveawayEntryMethod["type"], string> = {
  follow_x: "𝕏",
  join_discord: "DC",
  subscribe_youtube: "YT",
  share: "↗",
};

export function entryIcon(type: GiveawayEntryMethod["type"]): string {
  return ENTRY_ICONS[type];
}

/**
 * Narrow the jsonb `entry_methods` column to a typed list.
 * Malformed entries are skipped with a server-side warning.
 */
export function parseEntryMethods(value: Json | null | undefined): GiveawayEntryMethod[] {
  if (!Array.isArray(value)) return [];
  const out: GiveawayEntryMethod[] = [];
  for (const item of value) {
    const parsed = EntryMethodSchema.safeParse(item);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      // Server-side log only — admin should fix the malformed row.
      console.warn("[giveaway] Skipping malformed entry method", parsed.error.flatten());
    }
  }
  return out;
}
