// =============================================================================
// Silent Hell — Tactics board seed
// Run: `npm run seed:tactics`
//
// Seeds three signature drop maps with realistic %-based coordinates. Map
// images are intentionally left null so admins can upload real screenshots
// later — the public component renders a stylized grid placeholder until then.
// Idempotent: skips entries with the same (map_name + title.en).
// =============================================================================

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";
import type { Insert } from "@/types/database";

type BoardSeed = Omit<Insert<"tactic_boards">, "id">;

const ERANGEL_IMG =
  "https://raw.githubusercontent.com/Divyarora0906/pubg-interactive-maps/main/public/Map.jpeg";
const MIRAMAR_IMG =
  "https://raw.githubusercontent.com/Divyarora0906/pubg-interactive-maps/main/public/MiramarMain.jpg";

// Coordinates expressed as 0-100 percentages of the map's width/height.
// Numbers below match commonly-played PUBG Mobile drop spots.
const boards: BoardSeed[] = [
  {
    title: {
      en: "Erangel · Pochinki rush",
      ar: "إيرانجل · هجوم بوتشينكي",
    },
    description: {
      en: "Drop hard on Pochinki, sweep north-east through School to Rozhok before the second circle locks. Loadouts ready by 3:00.",
      ar: "نزول قوي على بوتشينكي، ثم زحف شمال-شرق نحو School إلى Rozhok قبل إغلاق الدائرة الثانية. الجهز كامل قبل الدقيقة 3.",
    },
    map_name: "Erangel",
    map_image_url: ERANGEL_IMG,
    drop_x: 50,
    drop_y: 53,
    rotation_points: [
      { x: 56, y: 47 },
      { x: 58, y: 38 },
      { x: 52, y: 30 },
    ],
    display_order: 1,
    is_published: true,
  },
  {
    title: {
      en: "Miramar · Pecado high-ground",
      ar: "ميرامار · مرتفعات Pecado",
    },
    description: {
      en: "Pecado for early loot, climb the casino roof, then sweep south to Hacienda. Long-range loadout — no exceptions.",
      ar: "نزول على Pecado للتجهيز، صعود سطح الكازينو، ثم زحف جنوباً نحو Hacienda. تجهيز مدى بعيد — لا استثناءات.",
    },
    map_name: "Miramar",
    map_image_url: MIRAMAR_IMG,
    drop_x: 49,
    drop_y: 56,
    rotation_points: [
      { x: 53, y: 64 },
      { x: 51, y: 73 },
      { x: 47, y: 82 },
    ],
    display_order: 2,
    is_published: true,
  },
];

async function main() {
  const supabase = createAdminClient();
  let inserted = 0;
  let skipped = 0;

  for (const b of boards) {
    const titleEn = (b.title as { en: string }).en;
    const { data: existing } = await supabase
      .from("tactic_boards")
      .select("id, title")
      .eq("map_name", b.map_name);

    const dup = (existing ?? []).find(
      (row) =>
        ((row.title as unknown as { en?: string } | null)?.en ?? "") === titleEn,
    );
    if (dup) {
      // Refresh map_image_url + coordinates if they've drifted from the seed.
      const { error } = await supabase
        .from("tactic_boards")
        .update({
          map_image_url: b.map_image_url,
          drop_x: b.drop_x,
          drop_y: b.drop_y,
          rotation_points: b.rotation_points as never,
        } as never)
        .eq("id", (dup as { id: string }).id);
      if (error) throw new Error(`tactic_boards update: ${error.message}`);
      skipped += 1;
      continue;
    }

    const { error } = await supabase.from("tactic_boards").insert(b as never);
    if (error) throw new Error(`tactic_boards insert: ${error.message}`);
    inserted += 1;
  }

  console.log(
    `✓ Inserted ${inserted} tactic boards, refreshed ${skipped} existing.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
