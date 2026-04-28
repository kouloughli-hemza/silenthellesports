import { getTranslations } from "next-intl/server";
import {
  getPublishedTacticBoards,
  isTacticsEnabled,
} from "@/lib/data/team";
import { pickTranslation, type Locale } from "@/types/domain";
import { TacticsBoardClient } from "./tactics-board-client";

interface TacticsBoardProps {
  locale: Locale;
}

// Server entry: respects the global `tactics.enabled` site_config flag and
// hides the section entirely if there's nothing published. Hands a serialised
// payload to the client component which handles tab switching + animation.
export async function TacticsBoard({ locale }: TacticsBoardProps) {
  const enabled = await isTacticsEnabled();
  if (!enabled) return null;

  const boards = await getPublishedTacticBoards();
  if (boards.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "tactics" });

  const payload = boards.map((b) => {
    const rotation = Array.isArray(b.rotation_points)
      ? (b.rotation_points as Array<{ x?: unknown; y?: unknown }>)
          .map((p) => ({
            x: typeof p?.x === "number" ? p.x : 0,
            y: typeof p?.y === "number" ? p.y : 0,
          }))
          .filter((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)
      : [];
    return {
      id: b.id,
      title: pickTranslation(
        (b.title ?? {}) as { en: string; ar: string },
        locale,
      ),
      description: pickTranslation(
        (b.description ?? {}) as { en: string; ar: string },
        locale,
      ),
      mapName: b.map_name,
      mapImageUrl: b.map_image_url ?? null,
      drop: { x: Number(b.drop_x), y: Number(b.drop_y) },
      rotation,
    };
  });

  return (
    <section
      className="grain relative overflow-hidden py-20 md:py-28"
      style={{ background: "var(--ash-3)" }}
      aria-labelledby="tactics-heading"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex flex-col items-start gap-3 md:mb-12">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase md:text-[11px]"
            style={{ color: "var(--hell-red)" }}
          >
            {t("eyebrow")}
          </div>
          <h2
            id="tactics-heading"
            className="font-display text-4xl leading-[0.95] font-black tracking-tight uppercase italic md:text-6xl"
            style={{ color: "var(--bone)" }}
          >
            {t("t1")} <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
          </h2>
          <p
            className="max-w-md font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {t("sub")}
          </p>
        </div>

        <TacticsBoardClient
          boards={payload}
          dropLabel={t("drop")}
          rotationLabel={t("rotation")}
        />
      </div>
    </section>
  );
}
