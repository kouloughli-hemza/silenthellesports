import { getTranslations } from "next-intl/server";
import { getPublishedStats } from "@/lib/data/team";
import { pickTranslation, type Locale } from "@/types/domain";
import { StatCounter } from "./stat-counter";

interface StatsWallProps {
  locale: Locale;
}

// Server component — pulls published stats and hands them to a client counter.
// Hidden entirely if the team hasn't entered any stats yet (better than an
// empty grid). Brand-consistent layout: red mono eyebrow, italic display title,
// counters that ignite when scrolled into view.
export async function StatsWall({ locale }: StatsWallProps) {
  const stats = await getPublishedStats();
  if (stats.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "stats" });

  return (
    <section
      className="grain relative overflow-hidden py-20 md:py-28"
      style={{ background: "var(--ash-3)" }}
      aria-labelledby="stats-wall-heading"
    >
      {/* faint diagonal scan line accent */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(120deg, transparent 0%, transparent 49.5%, rgba(230,0,19,0.08) 50%, transparent 50.5%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 md:mb-14 md:flex-row md:items-end md:gap-6">
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase md:text-[11px]"
              style={{ color: "var(--hell-red)" }}
            >
              {t("eyebrow")}
            </div>
            <h2
              id="stats-wall-heading"
              className="font-display mt-2 text-4xl leading-[0.95] font-black tracking-tight uppercase italic md:text-6xl"
              style={{ color: "var(--bone)" }}
            >
              {t("t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </h2>
          </div>
          <p
            className="max-w-md font-mono text-[11px] tracking-[0.2em] uppercase md:text-xs"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {t("sub")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: "rgba(230,0,19,0.25)" }}>
          {stats.map((s, i) => {
            const label = (s.label ?? {}) as { en?: string; ar?: string };
            return (
              <StatCounter
                key={s.id}
                value={Number(s.value) || 0}
                suffix={s.suffix ?? ""}
                label={pickTranslation(label as { en: string; ar: string }, locale)}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
