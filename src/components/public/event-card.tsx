import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { EventBlueZone } from "@/components/scenes/EventBlueZone";
import {
  formatDateShort,
  formatTime,
  formatWeekday,
} from "@/lib/utils/format";
import { formatPrice, pickTranslation, type Event, type Locale } from "@/types/domain";

interface EventCardProps {
  event: Event;
  signupCount: number;
  locale: Locale;
  variant?: "upcoming" | "past";
}

export async function EventCard({
  event,
  signupCount,
  locale,
  variant = "upcoming",
}: EventCardProps) {
  const t = await getTranslations({ locale, namespace: "events" });
  const isAr = locale === "ar";

  const capacity = event.capacity || 0;
  const filled = Math.min(signupCount, capacity);
  const pct = capacity > 0 ? Math.min(100, (filled / capacity) * 100) : 0;
  const isFull = capacity > 0 && filled >= capacity;
  const hot = capacity > 0 && filled / capacity > 0.7;

  const title = pickTranslation(event.title, locale);
  const tag = (event.tag ?? "").trim().toUpperCase();

  const feeLabel =
    event.entry_fee > 0
      ? formatPrice(event.entry_fee, locale, "DZD")
      : t("free");

  const prizeLabel =
    event.prize_pool > 0
      ? formatPrice(event.prize_pool, locale, event.prize_currency)
      : t("tbd");

  const ctaLabel = variant === "past" ? t("viewResult") : t("slotIn");

  return (
    <article
      className="card-bite notch group relative overflow-hidden"
      style={{ background: "var(--ash-1)" }}
    >
      {variant === "upcoming" && capacity > 0 ? (
        <EventBlueZone pct={pct} isFull={isFull} hot={hot} closedLabel={t("statusClosed")} />
      ) : null}
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {tag.length > 0 ? (
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {tag}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-black tracking-tight uppercase italic">
                {formatDateShort(event.start_at, locale)}
              </span>
              <span
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {formatWeekday(event.start_at, locale)} · {formatTime(event.start_at, locale)} UTC
              </span>
            </div>
            <div
              className="mt-3 truncate font-display text-base font-bold uppercase italic"
              style={{ color: "var(--bone)" }}
              title={title}
            >
              {title}
            </div>
          </div>

          {hot && variant === "upcoming" ? (
            <span className="badge-hot shrink-0">
              <span className="live-dot" style={{ background: "var(--bone)" }} />
              {t("hot")}
            </span>
          ) : null}
        </div>

        <div
          className="mb-5 grid grid-cols-3 gap-px"
          style={{ background: "rgba(245,240,232,0.06)" }}
        >
          {[
            { l: t("mode"), v: event.mode },
            { l: t("map"), v: event.map ?? t("tbd") },
            { l: t("entry"), v: feeLabel },
          ].map((b) => (
            <div
              key={b.l}
              style={{ background: "var(--ash-3)" }}
              className="px-3 py-3"
            >
              <div
                className="font-mono text-[9px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {b.l}
              </div>
              <div
                className="mt-1 truncate font-display text-sm font-bold uppercase italic"
                title={b.v}
              >
                {b.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {t("prize")}
            </div>
            <div
              className="font-display text-2xl font-black italic md:text-3xl"
              style={{ color: "var(--hell-red)" }}
            >
              {prizeLabel}
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {t("slots")}
            </div>
            <div className="font-display text-2xl font-black whitespace-nowrap italic md:text-3xl">
              <span className="stat-number">{filled}</span>
              <span style={{ color: "rgba(245,240,232,0.4)" }}>
                &nbsp;/&nbsp;{capacity}
              </span>
            </div>
          </div>
        </div>

        <div className="slot-bar mb-5" aria-hidden>
          <div style={{ width: `${pct}%` }} />
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="btn-hell w-full justify-center"
          aria-label={`${ctaLabel} — ${title}`}
        >
          {variant === "upcoming" && isFull ? t("statusFull") : ctaLabel}
          <span aria-hidden>{isAr ? "↖" : "↗"}</span>
        </Link>
      </div>
    </article>
  );
}
