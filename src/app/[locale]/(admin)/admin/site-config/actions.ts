"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { tagForSiteConfigKey, TAG_SITE_CONFIG_ALL } from "@/lib/site-config";
import { fail, ok, type Result } from "@/types/domain";

const Translated = z.object({ en: z.string(), ar: z.string() });
const HeroStats = z.object({
  enemies: z.number().int(),
  tournaments: z.number().int(),
  kd: z.number(),
  headshot: z.number(),
});
const Headline = z.object({
  l1: Translated,
  l2: Translated,
  l3: Translated,
  l4: Translated,
});

const Schema = z.object({
  headline: Headline,
  tagline: Translated,
  stats: HeroStats,
  season: Translated,
  discordUrl: z.string().url(),
  discordCount: z.string(),
  youtube: z.string(),
  instagram: z.string(),
  tiktok: z.string(),
  drop: z.number().int(),
  giveDrop: z.number().int(),
  sponsors: z.array(z.string()),
  fromWilaya: z.number().int().min(1).max(58),
  featuredEnds: z.string(),
});

export type SaveInput = z.infer<typeof Schema>;

export async function saveSiteConfigAction(
  input: SaveInput,
): Promise<Result<{ saved: number }>> {
  const profile = await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const data = parsed.data;
  const rows: Array<{ key: string; value: unknown }> = [
    { key: "hero.headline", value: data.headline },
    { key: "hero.tagline", value: data.tagline },
    { key: "hero.stats", value: data.stats },
    { key: "hero.season", value: data.season },
    { key: "socials.discord_url", value: data.discordUrl },
    { key: "socials.discord_member_count", value: data.discordCount },
    { key: "socials.youtube_channel", value: data.youtube },
    { key: "socials.instagram_handle", value: data.instagram },
    { key: "socials.tiktok_handle", value: data.tiktok },
    { key: "store.current_drop", value: data.drop },
    { key: "giveaway.current_drop", value: data.giveDrop },
    { key: "sponsors", value: data.sponsors },
    { key: "shipping.from_wilaya_code", value: data.fromWilaya },
    { key: "store.featured_collection_ends_at", value: data.featuredEnds },
  ];

  const supabase = createAdminClient();
  for (const row of rows) {
    const { error } = await supabase
      .from("site_config")
      .upsert(
        {
          key: row.key,
          value: row.value as never,
          updated_at: new Date().toISOString(),
          updated_by: profile.id,
        },
        { onConflict: "key" },
      );
    if (error) return fail(`Failed at ${row.key}: ${error.message}`);
  }

  await recordAudit({
    actorId: profile.id,
    action: "site_config.save_all",
    entityType: "site_config",
    after: { keys: rows.map((r) => r.key) },
  });

  // Per-key cache tags evict only the affected entries; the catch-all tag is
  // a safety net for components that snapshot multiple keys together.
  for (const row of rows) revalidateTag(tagForSiteConfigKey(row.key));
  revalidateTag(TAG_SITE_CONFIG_ALL);
  revalidatePath("/", "layout");
  return ok({ saved: rows.length });
}
