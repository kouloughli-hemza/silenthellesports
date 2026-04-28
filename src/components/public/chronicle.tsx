import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getPublishedMilestones } from "@/lib/data/team";
import { Link } from "@/lib/i18n/routing";
import { pickTranslation, type Locale, type TeamMilestone } from "@/types/domain";
import { ChronicleReveal } from "./chronicle-reveal";

interface ChronicleProps {
  locale: Locale;
  variant?: "home" | "page";
  limit?: number;
}

const CATEGORY_LABEL_KEY: Record<TeamMilestone["category"], string> = {
  founding: "category.founding",
  tournament_win: "category.tournament_win",
  roster: "category.roster",
  milestone: "category.milestone",
  release: "category.release",
  partnership: "category.partnership",
  other: "category.other",
};

// Vertical timeline. Desktop: a center-line spine with cards alternating
// left/right. Mobile: line glued to the inline-start edge with all cards on
// the trailing side. Each card reveals on scroll via ChronicleReveal.
export async function Chronicle({
  locale,
  variant = "page",
  limit,
}: ChronicleProps) {
  const milestones = await getPublishedMilestones(limit);
  if (milestones.length === 0 && variant === "home") return null;

  const t = await getTranslations({ locale, namespace: "chronicle" });
  const isAr = locale === "ar";

  return (
    <section
      className="grain relative overflow-hidden py-20 md:py-28"
      style={{ background: "var(--black)" }}
      aria-labelledby="chronicle-heading"
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        {/* heading */}
        <div className="mb-12 flex flex-col items-start justify-between gap-3 md:mb-16 md:flex-row md:items-end md:gap-6">
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase md:text-[11px]"
              style={{ color: "var(--hell-red)" }}
            >
              {t("eyebrow")}
            </div>
            <h2
              id="chronicle-heading"
              className="font-display mt-2 text-4xl leading-[0.95] font-black tracking-tight uppercase italic md:text-6xl"
              style={{ color: "var(--bone)" }}
            >
              {t("t1")}
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
              aria-label={t("ctaFull")}
            >
              {t("ctaFull")}
              <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
            </Link>
          ) : null}
        </div>

        {milestones.length === 0 ? (
          <div
            className="notch p-10 text-center"
            style={{ background: "var(--ash-1)" }}
          >
            <p
              className="font-display text-2xl font-black uppercase italic"
              style={{ color: "var(--bone)" }}
            >
              {t("empty")}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* spine */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-px md:left-1/2 md:-translate-x-1/2"
              style={{
                left: 14,
                background:
                  "linear-gradient(180deg, rgba(230,0,19,0) 0%, rgba(230,0,19,0.7) 8%, rgba(230,0,19,0.7) 92%, rgba(230,0,19,0) 100%)",
              }}
            />

            <ol className="relative space-y-12 md:space-y-16">
              {milestones.map((m, i) => {
                const title = pickTranslation(
                  (m.title ?? {}) as { en: string; ar: string },
                  locale,
                );
                const description = pickTranslation(
                  (m.description ?? {}) as { en: string; ar: string },
                  locale,
                );
                const yearLabel = m.occurred_on.slice(0, 4);
                const dateLabel = formatDate(m.occurred_on, locale);
                const categoryLabel = t(CATEGORY_LABEL_KEY[m.category]);
                const onLeft = i % 2 === 0; // desktop only

                return (
                  <li key={m.id} className="relative">
                    {/* node dot */}
                    <span
                      aria-hidden
                      className="absolute z-10 block h-3 w-3 rounded-full md:left-1/2 md:-translate-x-1/2"
                      style={{
                        background: "var(--hell-red)",
                        boxShadow:
                          "0 0 12px var(--hell-red), 0 0 4px var(--hell-red)",
                        top: 18,
                        left: 8,
                      }}
                    />

                    <ChronicleReveal index={i}>
                      <div
                        className={`md:grid md:grid-cols-2 md:gap-10 ${
                          onLeft ? "" : "md:[&>*:first-child]:order-2"
                        }`}
                      >
                        {/* card */}
                        <article
                          className={`relative ${
                            onLeft
                              ? "md:pr-10 md:text-right"
                              : "md:pl-10 md:text-left"
                          }`}
                          style={{ paddingInlineStart: 36 }}
                        >
                          <div
                            className="notch group p-5 transition-transform md:p-7"
                            style={{
                              background: "var(--ash-1)",
                              border: "1px solid rgba(230,0,19,0.25)",
                            }}
                          >
                            <div
                              className="flex flex-wrap items-baseline gap-3"
                              style={{
                                justifyContent:
                                  onLeft && !isAr ? "flex-end" : "flex-start",
                              }}
                            >
                              <span
                                className="font-display text-5xl leading-none font-black italic md:text-6xl"
                                style={{ color: "var(--hell-red)" }}
                              >
                                {yearLabel}
                              </span>
                              <span
                                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                                style={{ color: "rgba(245,240,232,0.5)" }}
                              >
                                {dateLabel}
                              </span>
                            </div>
                            <div
                              className="mt-2 font-mono text-[10px] tracking-[0.3em] uppercase"
                              style={{ color: "var(--ember)" }}
                            >
                              {`// ${categoryLabel}`}
                            </div>
                            <h3
                              className="font-display mt-3 text-2xl font-black uppercase italic md:text-3xl"
                              style={{ color: "var(--bone)" }}
                            >
                              {title}
                            </h3>
                            {description ? (
                              <p
                                className="mt-3 text-sm leading-relaxed"
                                style={{ color: "rgba(245,240,232,0.78)" }}
                              >
                                {description}
                              </p>
                            ) : null}
                          </div>
                        </article>
                        {/* image side (desktop) */}
                        {m.image_url ? (
                          <div
                            className={`mt-4 md:mt-0 ${
                              onLeft ? "md:pl-10" : "md:pr-10"
                            }`}
                            style={{ paddingInlineStart: 36 }}
                          >
                            <div
                              className="relative aspect-[16/10] w-full overflow-hidden"
                              style={{
                                background: "var(--ash-3)",
                                border: "1px solid rgba(230,0,19,0.25)",
                              }}
                            >
                              <Image
                                src={m.image_url}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 100vw, 540px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </ChronicleReveal>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-DZ" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}
