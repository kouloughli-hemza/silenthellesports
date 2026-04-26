// =============================================================================
// Silent Hell — hand-curated team seed
// Run: `npm run seed:team`
//
// Source of truth: the team's Liquipedia page + user-confirmed roster.
// Liquipedia's wikitext API only returns template references (`{{ActiveSquadAuto}}`),
// not the actual roster rows, so a hand-curated seed is the reliable path.
// Idempotent: re-running upserts.
// =============================================================================

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";
import type { Insert } from "@/types/database";

type PlayerSeed = Omit<Insert<"players">, "id"> & { ign: string };
type TrophySeed = Omit<Insert<"trophies">, "id">;
type SiteConfigSeed = Insert<"site_config">;

// ----- ROSTER (active) -----
const players: PlayerSeed[] = [
  {
    ign: "FaRoK",
    real_name: "Berima Farouk",
    role: "Analyst",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2024-12-28",
    is_active: true,
    display_order: 1,
  },
  {
    ign: "ALA",
    real_name: "Meharzi Ala Eddine",
    role: "Fragger",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-02-28",
    is_active: true,
    display_order: 2,
  },
  {
    ign: "Phoenix",
    real_name: null,
    role: "Support",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-02-28",
    is_active: true,
    display_order: 3,
  },
  {
    ign: "Ramzey1hp",
    real_name: "Emtir Ramzi Mohamed",
    role: "IGL",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-02-28",
    is_active: true,
    display_order: 4,
  },
  {
    ign: "GBRUTE",
    real_name: "Gleb Volodin",
    role: "Sniper",
    country_code: "RU",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-05-20",
    is_active: true,
    display_order: 5,
  },
  {
    ign: "HEMO",
    real_name: "Ayham Ali",
    role: "Assault",
    country_code: "IQ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-05-20",
    is_active: true,
    display_order: 6,
  },
  {
    ign: "BAZ",
    real_name: null,
    role: "Scout",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-09-03",
    is_active: true,
    display_order: 7,
  },
  {
    ign: "GADAFi",
    real_name: "Mohammed Moussa Mansour",
    role: "Sub",
    country_code: "LY",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2025-09-03",
    is_active: true,
    display_order: 8,
  },
  // Manager
  {
    ign: "Nisso Younes",
    real_name: "Nisso Younes",
    role: "Manager",
    country_code: "DZ",
    bio: { en: "", ar: "" },
    socials: {},
    stats: {},
    joined_at: "2023-11-20",
    is_active: true,
    display_order: 9,
  },
];

// ----- TROPHIES (achievements per Liquipedia) -----
const trophies: TrophySeed[] = [
  {
    title: {
      en: "PUBG Mobile Super League — MENA Fall 2025",
      ar: "PUBG Mobile Super League — MENA Fall 2025",
    },
    tournament_name: "PUBG Mobile Super League MENA Fall 2025",
    placement: "8th",
    prize_amount: 9700,
    prize_currency: "USD",
    date: "2025-10-18",
    display_order: 1,
  },
  {
    title: {
      en: "PUBG Mobile National Championship MENA Wildcard Fall 2025",
      ar: "PUBG Mobile National Championship MENA Wildcard Fall 2025",
    },
    tournament_name: "PUBG Mobile National Championship MENA Wildcard Fall 2025",
    placement: "4th",
    prize_amount: 1000,
    prize_currency: "USD",
    date: "2025-09-16",
    display_order: 2,
  },
  {
    title: {
      en: "PUBG Mobile National Championship Algeria 2025",
      ar: "PUBG Mobile National Championship Algeria 2025",
    },
    tournament_name: "PUBG Mobile National Championship Algeria 2025",
    placement: "1st",
    prize_amount: 2000,
    prize_currency: "USD",
    date: "2025-09-05",
    display_order: 3,
  },
  {
    title: {
      en: "PUBG Mobile Super League — MENA Spring 2025",
      ar: "PUBG Mobile Super League — MENA Spring 2025",
    },
    tournament_name: "PUBG Mobile Super League MENA Spring 2025",
    placement: "13th",
    prize_amount: 5250,
    prize_currency: "USD",
    date: "2025-07-05",
    display_order: 4,
  },
  {
    title: {
      en: "PUBG Mobile Super League — MENA Spring 2025: Play-in",
      ar: "PUBG Mobile Super League — MENA Spring 2025: Play-in",
    },
    tournament_name: "PUBG Mobile Super League MENA Spring 2025 Play-in",
    placement: "5th",
    prize_amount: 700,
    prize_currency: "USD",
    date: "2025-06-01",
    display_order: 5,
  },
  {
    title: {
      en: "PUBG Mobile National Championship MENA Wildcard Spring 2025",
      ar: "PUBG Mobile National Championship MENA Wildcard Spring 2025",
    },
    tournament_name: "PUBG Mobile National Championship MENA Wildcard Spring 2025",
    placement: "2nd",
    prize_amount: 2000,
    prize_currency: "USD",
    date: "2025-05-23",
    display_order: 6,
  },
  {
    title: {
      en: "PUBG Mobile National Championship MEA Finals 2024",
      ar: "PUBG Mobile National Championship MEA Finals 2024",
    },
    tournament_name: "PUBG Mobile National Championship MEA Finals 2024",
    placement: "2nd",
    prize_amount: 6000,
    prize_currency: "USD",
    date: "2024-08-11",
    display_order: 7,
  },
  {
    title: {
      en: "PUBG Mobile Africa Clash 2024",
      ar: "PUBG Mobile Africa Clash 2024",
    },
    tournament_name: "PUBG Mobile Africa Clash 2024",
    placement: "7th",
    prize_amount: null,
    prize_currency: "USD",
    date: "2024-07-14",
    display_order: 8,
  },
  {
    title: {
      en: "PUBG Mobile National Championship MEA Wildcard 2024",
      ar: "PUBG Mobile National Championship MEA Wildcard 2024",
    },
    tournament_name: "PUBG Mobile National Championship MEA Wildcard 2024",
    placement: "4th",
    prize_amount: 1000,
    prize_currency: "USD",
    date: "2024-04-14",
    display_order: 9,
  },
];

// ----- SITE CONFIG -----
const siteConfig: SiteConfigSeed[] = [
  {
    key: "hero.tagline",
    value: { en: "The last sound you don't hear.", ar: "آخر صوت لن تسمعه." },
  },
  {
    key: "hero.stats",
    value: { enemies: 1847, tournaments: 3, kd: 4.21, headshot: 64 },
  },
  {
    key: "hero.season",
    value: { en: "SEASON 12 · ACTIVE", ar: "الموسم ١٢ · نشط" },
  },
  { key: "hero.founded", value: { en: "EST. 2023 · SHN-001", ar: "تأسس ٢٠٢٣ · SHN-001" } },
  { key: "socials.discord_url", value: "https://discord.gg/silenthell" },
  { key: "socials.discord_member_count", value: "—" },
  { key: "socials.twitch_channel", value: "silenthell" },
  { key: "socials.youtube_channel", value: "@SilentHellEsports" },
  { key: "socials.x_handle", value: "SilentHellGG" },
  { key: "socials.instagram_handle", value: "silenthell.esports" },
  { key: "store.current_drop", value: 1 },
  { key: "giveaway.current_drop", value: 1 },
  {
    key: "sponsors",
    value: [],
  },
  { key: "shipping.from_wilaya_code", value: 16 },
];

async function main(): Promise<void> {
  const client = createAdminClient();

  console.log("[seed-team] upserting site_config…");
  for (const row of siteConfig) {
    const { error } = await client.from("site_config").upsert(row, { onConflict: "key" });
    if (error) {
      console.error(`[seed-team] site_config(${row.key}) failed:`, error.message);
      throw error;
    }
  }
  console.log(`[seed-team] site_config: ${siteConfig.length} rows`);

  console.log("[seed-team] upserting players…");
  let playersOk = 0;
  for (const p of players) {
    // We don't have a stable external ID, so look up by lower(ign) and update,
    // otherwise insert. Mirrors the seeder's approach.
    const { data: existing } = await client
      .from("players")
      .select("id")
      .ilike("ign", p.ign)
      .maybeSingle();

    if (existing && "id" in existing && typeof existing.id === "string") {
      const { error } = await client.from("players").update(p).eq("id", existing.id);
      if (error) {
        console.error(`[seed-team] update player(${p.ign}) failed:`, error.message);
        throw error;
      }
    } else {
      const { error } = await client.from("players").insert(p);
      if (error) {
        console.error(`[seed-team] insert player(${p.ign}) failed:`, error.message);
        throw error;
      }
    }
    playersOk++;
  }
  console.log(`[seed-team] players: ${playersOk} rows`);

  console.log("[seed-team] upserting trophies…");
  let trophiesOk = 0;
  for (const t of trophies) {
    const { data: existing } = await client
      .from("trophies")
      .select("id")
      .eq("tournament_name", t.tournament_name)
      .eq("date", t.date)
      .maybeSingle();

    if (existing && "id" in existing && typeof existing.id === "string") {
      const { error } = await client.from("trophies").update(t).eq("id", existing.id);
      if (error) {
        console.error(`[seed-team] update trophy(${t.tournament_name}) failed:`, error.message);
        throw error;
      }
    } else {
      const { error } = await client.from("trophies").insert(t);
      if (error) {
        console.error(`[seed-team] insert trophy(${t.tournament_name}) failed:`, error.message);
        throw error;
      }
    }
    trophiesOk++;
  }
  console.log(`[seed-team] trophies: ${trophiesOk} rows`);

  console.log("[seed-team] done.");
}

main().catch((err: unknown) => {
  console.error("[seed-team] fatal:", err);
  process.exit(1);
});
