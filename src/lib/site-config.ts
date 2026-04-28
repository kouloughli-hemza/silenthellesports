// =============================================================================
// site-config: read key-value config rows from the DB with safe defaults.
// Phase 1 ships defaults inline; Phase 4 hooks them up to admin editing.
// =============================================================================

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import type { Translated } from "@/types/database";

const TranslatedSchema = z.object({ en: z.string(), ar: z.string() });

const HeadlineSchema = z.object({
  l1: TranslatedSchema,
  l2: TranslatedSchema,
  l3: TranslatedSchema,
  l4: TranslatedSchema,
});

const ConfigSchemas = {
  "hero.headline": HeadlineSchema,
  "hero.tagline": TranslatedSchema,
  "hero.stats": z.object({
    enemies: z.number().int(),
    tournaments: z.number().int(),
    kd: z.number(),
    headshot: z.number(),
  }),
  "hero.season": TranslatedSchema,
  "socials.discord_url": z.string().url(),
  "socials.discord_member_count": z.string(),
  "socials.twitch_channel": z.string(),
  "socials.youtube_channel": z.string(),
  "socials.x_handle": z.string(),
  "socials.instagram_handle": z.string(),
  "store.current_drop": z.number().int(),
  "store.featured_collection_ends_at": z.string(),
  "giveaway.current_drop": z.number().int(),
  sponsors: z.array(z.string()),
  "shipping.from_wilaya_code": z.number().int().min(1).max(58),
  "tactics.enabled": z.boolean(),
} as const;

type ConfigKey = keyof typeof ConfigSchemas;
type ConfigValue<K extends ConfigKey> = z.infer<(typeof ConfigSchemas)[K]>;

// Defaults used when the row is missing or unparseable. Mirrors supabase/seed.sql.
const DEFAULTS: { [K in ConfigKey]: ConfigValue<K> } = {
  "hero.headline": {
    l1: { en: "We don't", ar: "نحن لا" },
    l2: { en: "make noise.", ar: "نُحدِث ضجيجاً." },
    l3: { en: "We make", ar: "نحن نصنع" },
    l4: { en: "winners.", ar: "الأبطال." },
  },
  "hero.tagline": { en: "The last sound you don't hear.", ar: "آخر صوت لن تسمعه." },
  "hero.stats": { enemies: 1847, tournaments: 3, kd: 4.21, headshot: 64 },
  "hero.season": { en: "SEASON 12 · ACTIVE", ar: "الموسم ١٢ · نشط" },
  "socials.discord_url": "https://discord.gg/silenthell",
  "socials.discord_member_count": "18.4K",
  "socials.twitch_channel": "silenthell",
  "socials.youtube_channel": "@SilentHellEsports",
  "socials.x_handle": "SilentHellGG",
  "socials.instagram_handle": "silenthell.esports",
  "store.current_drop": 3,
  "store.featured_collection_ends_at": new Date(Date.now() + 38 * 3600 * 1000).toISOString(),
  "giveaway.current_drop": 3,
  sponsors: ["Logitech G", "Red Bull Gaming", "HyperX", "Victrix", "Monster Energy"],
  "shipping.from_wilaya_code": 16,
  "tactics.enabled": true,
};

export async function getSiteConfig<K extends ConfigKey>(key: K): Promise<ConfigValue<K>> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", key as string)
      .maybeSingle<{ value: unknown }>();

    if (error || !data) return DEFAULTS[key];

    const schema = ConfigSchemas[key];
    const parsed = schema.safeParse(data.value);
    return parsed.success ? (parsed.data as ConfigValue<K>) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

export type { Translated, ConfigKey };
