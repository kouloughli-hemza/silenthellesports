// =============================================================================
// Silent Hell — Chronicle (timeline) + Stats wall seed
// Run: `npm run seed:chronicle`
//
// Source: liquipedia.net/pubgmobile/Silent_Hell_Esports (fetched 2026-04-28)
// Idempotent:
//   - team_stats: upsert on the unique `key` column
//   - team_milestones: skip insert if a row with the same (occurred_on, category,
//     title.en) already exists, so the script can be re-run without duplicates
// =============================================================================

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";
import type { Insert } from "@/types/database";

type StatSeed = Omit<Insert<"team_stats">, "id">;
type MilestoneSeed = Omit<Insert<"team_milestones">, "id">;

// ----- STATS WALL -----
// Numbers locked off Liquipedia at time of seed; admin can update from
// /admin/stats anytime — keys stay stable so re-seeding only refreshes values.
const stats: StatSeed[] = [
  {
    key: "total_earnings",
    label: { en: "Total earnings", ar: "إجمالي الأرباح" },
    value: 28403,
    suffix: " $",
    display_order: 1,
    is_published: true,
  },
  {
    key: "podium_finishes",
    label: { en: "Podium finishes", ar: "وقفات على المنصّة" },
    value: 3,
    suffix: null,
    display_order: 2,
    is_published: true,
  },
  {
    key: "active_players",
    label: { en: "Active roster", ar: "الفريق النشط" },
    value: 6,
    suffix: null,
    display_order: 3,
    is_published: true,
  },
  {
    key: "years_active",
    label: { en: "Years on the drop", ar: "سنوات على القفزة" },
    value: 3,
    suffix: "+",
    display_order: 4,
    is_published: true,
  },
];

// ----- CHRONICLE -----
// Newest sit at the top of the public timeline (component sorts desc by date).
const milestones: MilestoneSeed[] = [
  {
    occurred_on: "2023-11-20",
    category: "founding",
    title: { en: "Silent Hell drops in", ar: "Silent Hell تنزل من السماء" },
    description: {
      en: "The Algerian crew is born — a new MENA contender steps onto the battlefield.",
      ar: "ولادة الفريق الجزائري — منافس جديد من شمال إفريقيا يدخل الساحة.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
  {
    occurred_on: "2024-08-11",
    category: "tournament_win",
    title: {
      en: "Runners-up · PMNC MEA Finals 2024",
      ar: "وصيف · نهائيات PMNC شرق أوسط/إفريقيا 2024",
    },
    description: {
      en: "Silent Hell takes 2nd place at the PUBG Mobile National Championship MEA Finals — $6,000 in prize money and the team's first major podium on the regional stage.",
      ar: "حصد الفريق المركز الثاني في نهائيات PUBG Mobile National Championship MEA — جائزة 6,000 دولار وأول منصة كبيرة على المستوى الإقليمي.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
  {
    occurred_on: "2025-05-23",
    category: "tournament_win",
    title: {
      en: "Runners-up · PMNC MENA Wildcard Spring 2025",
      ar: "وصيف · PMNC MENA Wildcard ربيع 2025",
    },
    description: {
      en: "Silver again — second place at the MENA Wildcard, locking the squad in for Super League Spring.",
      ar: "فضّة مرة أخرى — المركز الثاني في وايلدكارد منا، وحجز مقعد في Super League ربيع.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
  {
    occurred_on: "2025-07-05",
    category: "milestone",
    title: {
      en: "Debut · PMSL MENA Spring 2025",
      ar: "ظهور أول · PMSL MENA ربيع 2025",
    },
    description: {
      en: "First swing at the A-Tier — 13th place at PUBG Mobile Super League MENA Spring 2025 with $5,250 banked.",
      ar: "أول مشاركة في الدرجة الأولى — المركز 13 في PMSL MENA ربيع 2025 وغنيمة 5,250 دولار.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
  {
    occurred_on: "2025-09-05",
    category: "tournament_win",
    title: {
      en: "Champions · PMNC Algeria 2025",
      ar: "أبطال · PMNC الجزائر 2025",
    },
    description: {
      en: "First place on home soil — Silent Hell lifts the PUBG Mobile National Championship Algeria 2025 trophy.",
      ar: "المركز الأول على أرض الوطن — Silent Hell ترفع كأس PUBG Mobile National Championship الجزائر 2025.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
  {
    occurred_on: "2025-10-18",
    category: "milestone",
    title: {
      en: "Biggest paycheck · PMSL MENA Fall 2025",
      ar: "أكبر مكافأة · PMSL MENA خريف 2025",
    },
    description: {
      en: "8th place at PMSL MENA Fall 2025 — $9,700 in prize money, the team's largest single-event payout to date.",
      ar: "المركز الثامن في PMSL MENA خريف 2025 — 9,700 دولار، أكبر جائزة فردية للفريق حتى الآن.",
    },
    image_url: null,
    display_order: 0,
    is_published: true,
  },
];

async function main() {
  const supabase = createAdminClient();

  // --- stats: upsert on key
  {
    const { error } = await supabase
      .from("team_stats")
      .upsert(stats as never, { onConflict: "key" });
    if (error) throw new Error(`team_stats upsert: ${error.message}`);
    console.log(`✓ Seeded ${stats.length} stats.`);
  }

  // --- milestones: skip duplicates
  let inserted = 0;
  let skipped = 0;
  for (const m of milestones) {
    const titleEn = (m.title as { en: string }).en;
    const { data: existing } = await supabase
      .from("team_milestones")
      .select("id, title")
      .eq("occurred_on", m.occurred_on)
      .eq("category", m.category);

    const dup = (existing ?? []).find(
      (row) =>
        ((row.title as unknown as { en?: string } | null)?.en ?? "") === titleEn,
    );
    if (dup) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from("team_milestones").insert(m as never);
    if (error) throw new Error(`team_milestones insert: ${error.message}`);
    inserted += 1;
  }
  console.log(`✓ Inserted ${inserted} milestones, skipped ${skipped} existing.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
