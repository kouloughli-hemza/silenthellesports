// =============================================================================
// Silent Hell — one-shot Liquipedia seeder
// Run: `npm run seed:liquipedia`
//
// Pulls roster, trophies, and infobox metadata from
// https://liquipedia.net/pubgmobile/Silent_Hell_Esports and upserts into
// Supabase via the service-role admin client (bypasses RLS).
//
// Idempotent: re-running will not duplicate. Players are keyed on lower(ign);
// trophies on (tournament_name, date).
// =============================================================================

import { config as loadEnv } from "dotenv";
// .env.local takes precedence over .env (matches Next.js convention)
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTeamWikitext } from "@/services/liquipedia/fetch";
import {
  parseAchievements,
  parseInfobox,
  parseRoster,
  type RosterEntry,
  type TrophyEntry,
} from "@/services/liquipedia/parser";
import type { Database, Insert } from "@/types/database";

const TEAM_PAGE = "Silent_Hell_Esports";

interface SeedSummary {
  players: { inserted: number; updated: number; skipped: number };
  trophies: { inserted: number; updated: number; skipped: number };
  siteConfig: { upserted: number };
  warnings: string[];
}

function emptySummary(): SeedSummary {
  return {
    players: { inserted: 0, updated: 0, skipped: 0 },
    trophies: { inserted: 0, updated: 0, skipped: 0 },
    siteConfig: { upserted: 0 },
    warnings: [],
  };
}

function requireEnv(): { url: string; serviceKey: string } {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || url.trim().length === 0) {
    console.error(
      "[seed] NEXT_PUBLIC_SUPABASE_URL is not set. Add it to your .env file before running the seeder.",
    );
    process.exit(1);
  }
  if (!serviceKey || serviceKey.trim().length === 0) {
    console.error(
      "[seed] SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env file before running the seeder.",
    );
    process.exit(1);
  }
  return { url, serviceKey };
}

// ----- Supabase typing bridge ------------------------------------------------
//
// The locked Database type in `src/types/database.ts` does not include the
// `Relationships` field that supabase-js v2.104+ requires on its GenericTable
// shape, which collapses the inferred row types to `never` at the call site.
// We bridge that here with a tightly-scoped `unknown` cast: the input rows
// remain strongly typed via `Insert<...>`, and we only loosen the type when
// handing them to the query builder. No `any` is introduced.

type LooseQueryBuilder = {
  insert: (values: unknown) => Promise<{ error: { message: string } | null }>;
  upsert: (
    values: unknown,
    options?: { onConflict?: string },
  ) => Promise<{ error: { message: string } | null }>;
  update: (values: unknown) => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      limit: (n: number) => Promise<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }>;
    };
    ilike: (column: string, value: string) => {
      limit: (n: number) => Promise<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function table(client: SupabaseClient<Database>, name: string): LooseQueryBuilder {
  // Single boundary cast: supabase-js's runtime accepts a string; the schema
  // shape mismatch is a pure typing artefact.
  const builder = (client as unknown as { from: (n: string) => unknown }).from(name);
  return builder as LooseQueryBuilder;
}

interface IdRow {
  id: string;
}

function isIdRow(value: unknown): value is IdRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

// ----- Operations ------------------------------------------------------------

async function upsertSiteConfig(
  client: SupabaseClient<Database>,
  key: string,
  value: unknown,
  summary: SeedSummary,
): Promise<void> {
  const row: Insert<"site_config"> = { key, value: value as Insert<"site_config">["value"] };
  const { error } = await table(client, "site_config").upsert(row, { onConflict: "key" });
  if (error) {
    summary.warnings.push(`site_config[${key}] upsert failed: ${error.message}`);
    return;
  }
  summary.siteConfig.upserted++;
}

async function seedPlayers(
  client: SupabaseClient<Database>,
  roster: ReadonlyArray<RosterEntry>,
  summary: SeedSummary,
): Promise<void> {
  // Sort by joined date ascending for stable display_order
  const ordered = [...roster].sort((a, b) => {
    const ad = a.joinedAt ?? "9999-12-31";
    const bd = b.joinedAt ?? "9999-12-31";
    return ad.localeCompare(bd);
  });

  for (let i = 0; i < ordered.length; i++) {
    const entry = ordered[i];
    if (!entry) continue;
    const ignKey = entry.ign.trim();
    if (ignKey.length === 0) {
      summary.players.skipped++;
      continue;
    }

    const { data: existing, error: lookupErr } = await table(client, "players")
      .select("id, ign")
      .ilike("ign", ignKey)
      .limit(1);

    if (lookupErr) {
      summary.warnings.push(`players lookup [${ignKey}] failed: ${lookupErr.message}`);
      summary.players.skipped++;
      continue;
    }

    const playerInsert: Insert<"players"> = {
      ign: entry.ign,
      real_name: entry.realName ?? null,
      role: entry.role,
      country_code: entry.countryCode ?? null,
      photo_url: null,
      bio: { en: "", ar: "" },
      signature_loadout: null,
      stats: {},
      socials: {},
      display_order: i,
      is_active: entry.isActive,
      joined_at: entry.joinedAt ?? null,
      left_at: null,
    };

    const existingRow = existing && existing.length > 0 ? existing[0] : undefined;
    if (existingRow && isIdRow(existingRow)) {
      const { error: updateErr } = await table(client, "players")
        .update(playerInsert)
        .eq("id", existingRow.id);
      if (updateErr) {
        summary.warnings.push(`players update [${ignKey}] failed: ${updateErr.message}`);
        summary.players.skipped++;
        continue;
      }
      summary.players.updated++;
    } else {
      const { error: insertErr } = await table(client, "players").insert(playerInsert);
      if (insertErr) {
        summary.warnings.push(`players insert [${ignKey}] failed: ${insertErr.message}`);
        summary.players.skipped++;
        continue;
      }
      summary.players.inserted++;
    }
  }
}

async function seedTrophies(
  client: SupabaseClient<Database>,
  achievements: ReadonlyArray<TrophyEntry>,
  summary: SeedSummary,
): Promise<void> {
  // Sort newest first; assign display_order accordingly.
  const ordered = [...achievements].sort((a, b) => b.date.localeCompare(a.date));

  for (let i = 0; i < ordered.length; i++) {
    const entry = ordered[i];
    if (!entry) continue;

    // We need a composite key match — chain two .eq() calls. Our LooseQueryBuilder
    // models a single .eq(); for trophies we use a select on tournament_name then
    // filter by date locally to keep the wrapper simple.
    const { data: existing, error: lookupErr } = await table(client, "trophies")
      .select("id, date")
      .eq("tournament_name", entry.tournamentName)
      .limit(50);

    if (lookupErr) {
      summary.warnings.push(
        `trophies lookup [${entry.tournamentName} @ ${entry.date}] failed: ${lookupErr.message}`,
      );
      summary.trophies.skipped++;
      continue;
    }

    let dupRow: IdRow | undefined;
    for (const row of existing ?? []) {
      if (!isIdRow(row)) continue;
      const rowDate = (row as Record<string, unknown>)["date"];
      if (typeof rowDate === "string" && rowDate === entry.date) {
        dupRow = row;
        break;
      }
    }

    const trophyInsert: Insert<"trophies"> = {
      title: { en: entry.tournamentName, ar: entry.tournamentName },
      tournament_name: entry.tournamentName,
      placement: entry.placement,
      prize_amount: entry.prizeAmount ?? null,
      prize_currency: "USD",
      date: entry.date,
      logo_url: null,
      display_order: i,
    };

    if (dupRow) {
      const { error: updateErr } = await table(client, "trophies")
        .update(trophyInsert)
        .eq("id", dupRow.id);
      if (updateErr) {
        summary.warnings.push(
          `trophies update [${entry.tournamentName}] failed: ${updateErr.message}`,
        );
        summary.trophies.skipped++;
        continue;
      }
      summary.trophies.updated++;
    } else {
      const { error: insertErr } = await table(client, "trophies").insert(trophyInsert);
      if (insertErr) {
        summary.warnings.push(
          `trophies insert [${entry.tournamentName}] failed: ${insertErr.message}`,
        );
        summary.trophies.skipped++;
        continue;
      }
      summary.trophies.inserted++;
    }
  }
}

async function main(): Promise<void> {
  requireEnv();
  const summary = emptySummary();

  console.log(`[seed] Fetching wikitext for ${TEAM_PAGE}…`);
  const fetched = await fetchTeamWikitext(TEAM_PAGE);
  if (!fetched.success) {
    console.warn(`[seed] Could not fetch Liquipedia page: ${fetched.error}`);
    console.warn("[seed] Nothing to seed. Admin can fill the dashboard manually. Exiting 0.");
    return;
  }

  const wikitext = fetched.data;
  const infobox = parseInfobox(wikitext);
  const roster = parseRoster(wikitext);
  const achievements = parseAchievements(wikitext);

  console.log(
    `[seed] Parsed: ${roster.length} roster entries, ${achievements.length} achievements`,
  );

  if (roster.length === 0) {
    summary.warnings.push("Liquipedia roster was empty after parsing");
  }
  if (achievements.length === 0) {
    summary.warnings.push("Liquipedia achievements list was empty after parsing");
  }

  const client = createAdminClient();

  // 1) Site config from infobox
  if (infobox.foundedDate) {
    await upsertSiteConfig(client, "team_founded_date", infobox.foundedDate, summary);
  }
  if (infobox.region) {
    await upsertSiteConfig(client, "team_region", infobox.region, summary);
  }
  if (infobox.location) {
    await upsertSiteConfig(client, "team_location", infobox.location, summary);
  }
  if (Object.keys(infobox.socials).length > 0) {
    await upsertSiteConfig(client, "team_socials", infobox.socials, summary);
  }

  // 2) Roster
  await seedPlayers(client, roster, summary);

  // 3) Trophies
  await seedTrophies(client, achievements, summary);

  // 4) Summary
  console.log("\n=== Seeder summary ===");
  console.log(
    `players:    inserted=${summary.players.inserted} updated=${summary.players.updated} skipped=${summary.players.skipped}`,
  );
  console.log(
    `trophies:   inserted=${summary.trophies.inserted} updated=${summary.trophies.updated} skipped=${summary.trophies.skipped}`,
  );
  console.log(`site_config upserted: ${summary.siteConfig.upserted}`);
  if (summary.warnings.length > 0) {
    console.log(`\nWarnings (${summary.warnings.length}):`);
    for (const w of summary.warnings) console.log(`  - ${w}`);
  }
}

main().catch((err: unknown) => {
  console.error("[seed] Fatal error:");
  if (err instanceof Error) {
    console.error(err.stack ?? err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
