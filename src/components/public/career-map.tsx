import { getTranslations } from "next-intl/server";
import { getPublishedMilestones } from "@/lib/data/team";
import { Link } from "@/lib/i18n/routing";
import { pickTranslation, type Locale, type TeamMilestone } from "@/types/domain";
import { CareerMapClient } from "./career-map-client";

interface CareerMapProps {
  locale: Locale;
  variant?: "home" | "page";
  limit?: number;
}

const ERANGEL_IMG =
  "https://raw.githubusercontent.com/Divyarora0906/pubg-interactive-maps/main/public/Map.jpeg";

// Named Erangel landmarks ordered as a deliberate clockwise traversal —
// starts on Sosnovka Military, crosses the east bridge to mainland, sweeps
// up the coast and back down the west side, then crosses the west bridge
// home. Each step is reachable from the previous by foot or boat, so the
// drawn polyline reads like a real squad rotation rather than a starfield.
const ROUTE: Array<{ x: number; y: number; landmark: string }> = [
  { x: 49, y: 82, landmark: "Military Base" },
  { x: 63, y: 76, landmark: "East Bridge" },
  { x: 78, y: 65, landmark: "Mylta" },
  { x: 84, y: 30, landmark: "Lipovka" },
  { x: 66, y: 30, landmark: "Yasnaya Polyana" },
  { x: 50, y: 14, landmark: "Severny" },
  { x: 52, y: 38, landmark: "Rozhok" },
  { x: 53, y: 47, landmark: "School" },
  { x: 50, y: 53, landmark: "Pochinki" },
  { x: 28, y: 25, landmark: "Georgopol" },
  { x: 12, y: 60, landmark: "Primorsk" },
  { x: 30, y: 76, landmark: "West Bridge" },
];

export async function CareerMap({ locale, variant = "page", limit }: CareerMapProps) {
  const milestones = await getPublishedMilestones();
  if (milestones.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "careerMap" });
  const tChron = await getTranslations({ locale, namespace: "chronicle" });
  const isAr = locale === "ar";

  // Project milestones onto the named route in chronological order. Older
  // entries first; route cycles for very long histories. On home, optionally
  // trim to the most recent `limit` so the map stays readable.
  const sorted = [...milestones].sort((a, b) =>
    a.occurred_on.localeCompare(b.occurred_on),
  );
  const chronological =
    typeof limit === "number" && sorted.length > limit
      ? sorted.slice(sorted.length - limit)
      : sorted;

  const points = chronological.map((m, i) => {
    const slot = ROUTE[i % ROUTE.length]!;
    return {
      id: m.id,
      title: pickTranslation(
        (m.title ?? {}) as { en: string; ar: string },
        locale,
      ),
      description: pickTranslation(
        (m.description ?? {}) as { en: string; ar: string },
        locale,
      ),
      occurredOn: m.occurred_on,
      category: m.category as TeamMilestone["category"],
      categoryLabel: tChron(`category.${m.category}` as never),
      x: slot.x,
      y: slot.y,
      landmark: slot.landmark,
    };
  });

  return (
    <section
      className="grain relative overflow-hidden py-14 md:py-28"
      style={{ background: "var(--ash-3)" }}
      aria-labelledby="career-map-heading"
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 md:px-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 px-3 sm:mb-10 sm:px-0 md:mb-12 md:flex-row md:items-end">
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase md:text-[11px]"
              style={{ color: "var(--hell-red)" }}
            >
              {t("eyebrow")}
            </div>
            <h2
              id="career-map-heading"
              className="font-display mt-2 text-4xl leading-[0.95] font-black tracking-tight uppercase italic md:text-6xl"
              style={{ color: "var(--bone)" }}
            >
              {t("t1")}{" "}
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </h2>
            <p
              className="mt-3 max-w-md font-mono text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {t("sub")}
            </p>
          </div>
          {variant === "home" ? (
            <Link
              href="/history"
              className="btn-ghost"
              aria-label={tChron("ctaFull")}
            >
              {tChron("ctaFull")}
              <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
            </Link>
          ) : null}
        </div>

        <CareerMapClient
          points={points}
          mapImageUrl={ERANGEL_IMG}
          locale={locale}
          hereLabel={t("here")}
          landmarkLabel={t("landmark")}
          tapHint={t("tapHint")}
        />
      </div>
    </section>
  );
}
