import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderImage } from "@/components/brand";
import { Link, isLocale, routing } from "@/lib/i18n/routing";
import {
  formatDateLong,
  formatTime,
  formatWeekday,
  relativeUntil,
} from "@/lib/utils/format";
import {
  getEventBySlug,
  getEventSignupCount,
  getPastEvents,
  getUpcomingEvents,
  getUserSignupForEvent,
} from "@/lib/data/events";
import { getSessionUser } from "@/lib/auth/session";
import {
  formatPrice,
  getEventMaps,
  pickTranslation,
  type Event,
  type Locale,
} from "@/types/domain";

interface EventDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);
  const slugs = new Set<string>();
  for (const ev of upcoming) slugs.add(ev.slug);
  for (const ev of past) slugs.add(ev.slug);

  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: EventDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const title = pickTranslation(event.title, locale);
  const description = pickTranslation(event.description, locale);

  return {
    title: `${title} · Silent Hell Esports`,
    description: description.length > 0 ? description : undefined,
    alternates: {
      canonical: `/${locale}/events/${slug}`,
      languages: {
        en: `/en/events/${slug}`,
        ar: `/ar/events/${slug}`,
      },
    },
    openGraph: {
      title,
      description: description.length > 0 ? description : undefined,
      type: "article",
      images: event.cover_image_url ? [event.cover_image_url] : undefined,
    },
  };
}

type StatusKey = Event["status"];

function statusLabelKey(status: StatusKey): string {
  switch (status) {
    case "upcoming":
      return "statusUpcoming";
    case "open":
      return "statusOpen";
    case "live":
      return "statusLive";
    case "closed":
      return "statusClosed";
    case "completed":
      return "statusCompleted";
    case "cancelled":
      // RLS hides these — treat visually as completed if it slips through.
      return "statusCompleted";
    default:
      return "statusUpcoming";
  }
}

function statusColor(status: StatusKey, isFull: boolean): {
  background: string;
  color: string;
  border?: string;
} {
  if (isFull && (status === "open" || status === "upcoming")) {
    return {
      background: "var(--ash-3)",
      color: "var(--hell-red)",
      border: "1px solid var(--hell-red)",
    };
  }
  if (status === "live") {
    return {
      background: "var(--ember)",
      color: "var(--black)",
    };
  }
  if (status === "upcoming" || status === "open") {
    return {
      background: "var(--hell-red)",
      color: "var(--bone)",
    };
  }
  // closed / completed / cancelled
  return {
    background: "var(--ash-3)",
    color: "rgba(245,240,232,0.5)",
    border: "1px solid rgba(245,240,232,0.15)",
  };
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const signupCount = await getEventSignupCount(event.id);

  const t = await getTranslations({ locale, namespace: "events" });
  const isAr = locale === "ar";

  const title = pickTranslation(event.title, locale);
  const description = pickTranslation(event.description, locale);
  // Rules are stored as an array of bilingual items (`{en, ar}`) by the admin form.
  // Older events (default value) may have a single bilingual object — handle both.
  const rules: string[] = Array.isArray(event.rules)
    ? (event.rules as Array<{ en?: string; ar?: string }>)
        .map((r) =>
          locale === "ar"
            ? (r?.ar ?? "").trim() || (r?.en ?? "").trim()
            : (r?.en ?? "").trim() || (r?.ar ?? "").trim(),
        )
        .filter((s) => s.length > 0)
    : (() => {
        const single = pickTranslation(event.rules, locale);
        return single.length > 0 ? [single] : [];
      })();
  const tag = (event.tag ?? "").trim().toUpperCase();

  const capacity = event.capacity || 0;
  const filled = Math.min(signupCount, capacity);
  const pct = capacity > 0 ? Math.min(100, (filled / capacity) * 100) : 0;
  const isFull = capacity > 0 && filled >= capacity;

  const isLockedDown =
    event.status === "closed" ||
    event.status === "completed" ||
    event.status === "cancelled";
  const isLive = event.status === "live";
  const registrationClosed =
    new Date(event.registration_closes_at).getTime() < Date.now();
  const canSignup =
    !isLockedDown &&
    !isFull &&
    !registrationClosed &&
    (event.status === "upcoming" || event.status === "open");

  // Has the current user already signed up for this event?
  // RLS hides event_signups from anon — fetch via the admin-scoped helper.
  const sessionUser = await getSessionUser();
  let alreadySignedCode: string | null = null;
  if (sessionUser) {
    const existing = await getUserSignupForEvent(sessionUser.id, event.id);
    if (existing?.confirmation_code) {
      alreadySignedCode = existing.confirmation_code;
    }
  }

  const displayStatus: StatusKey =
    isFull && (event.status === "open" || event.status === "upcoming")
      ? event.status
      : event.status;

  const pillStyle = statusColor(displayStatus, isFull);
  const pillLabel = isFull && (event.status === "open" || event.status === "upcoming")
    ? t("statusFull")
    : t(statusLabelKey(displayStatus));

  const feeLabel =
    event.entry_fee > 0
      ? formatPrice(event.entry_fee, locale, "DZD")
      : t("free");

  const prizeLabel =
    event.prize_pool > 0
      ? formatPrice(event.prize_pool, locale, event.prize_currency)
      : t("tbd");

  const eventMaps = getEventMaps(event);
  const mapsLabel = eventMaps.length === 0 ? t("tbd") : eventMaps.join(" · ");
  const startsLong = formatDateLong(event.start_at, locale);
  const startsTime = formatTime(event.start_at, locale);
  const startsWeekday = formatWeekday(event.start_at, locale);
  const closesRel = relativeUntil(event.registration_closes_at, locale as Locale);

  return (
    <article
      className="grain relative pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
    >
      {/* hero band */}
      <header
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--ash-3) 0%, var(--black) 100%)",
        }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: "16/7", maxHeight: 520 }}
        >
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={t("coverAlt", { title })}
              fill
              priority
              sizes="(min-width: 1024px) 1400px, 100vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <PlaceholderImage
              label={t("coverAlt", { title })}
              aspect="16/7"
            />
          )}
          {/* darken overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.85) 100%)",
            }}
            aria-hidden
          />

          {/* status pill (top) */}
          <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-3 md:top-10 md:left-10 md:right-10">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{
                background: pillStyle.background,
                color: pillStyle.color,
                border: pillStyle.border,
              }}
            >
              {isLive ? <span className="live-dot" /> : null}
              {pillLabel}
            </span>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase transition-colors hover:opacity-80"
              style={{
                background: "var(--ash-3)",
                color: "var(--bone)",
                border: "1px solid rgba(245,240,232,0.15)",
              }}
            >
              <span aria-hidden>{isAr ? "→" : "←"}</span>
              {t("backToEvents")}
            </Link>
          </div>
        </div>

        {/* title block sits below hero image */}
        <div className="relative mx-auto max-w-[1400px] px-6 pt-10 md:px-10">
          {tag.length > 0 ? (
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {tag}
            </div>
          ) : null}
          <h1
            className="font-display mt-3 text-4xl leading-[0.9] font-black tracking-tight uppercase italic md:text-6xl"
            style={{ color: "var(--bone)" }}
          >
            {title}
          </h1>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-10 px-6 md:mt-12 md:grid-cols-[1fr_360px] md:px-10">
        {/* main column */}
        <div className="space-y-10">
          {/* meta strip: kick-off / map / mode / closes */}
          <section
            className="grid grid-cols-2 gap-px md:grid-cols-4"
            style={{ background: "rgba(230,0,19,0.25)" }}
            aria-label={t("details")}
          >
            {[
              {
                l: t("kickOff"),
                v: `${startsWeekday} · ${startsTime}`,
                sub: startsLong,
              },
              { l: t("mode"), v: event.mode, sub: null },
              {
                l: eventMaps.length > 1 ? t("maps") : t("map"),
                v: mapsLabel,
                sub:
                  eventMaps.length > 1 ? `${eventMaps.length} maps` : null,
              },
              {
                l: t("registrationCloses"),
                v: closesRel,
                sub: formatDateLong(event.registration_closes_at, locale),
              },
            ].map((b) => (
              <div
                key={b.l}
                className="px-4 py-4"
                style={{ background: "var(--ash-3)" }}
              >
                <div
                  className="font-mono text-[9px] tracking-[0.25em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {b.l}
                </div>
                <div
                  className="mt-1 font-display text-lg font-bold uppercase italic"
                  style={{ color: "var(--bone)" }}
                >
                  {b.v}
                </div>
                {b.sub ? (
                  <div
                    className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: "rgba(245,240,232,0.4)" }}
                  >
                    {b.sub}
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          {/* description */}
          {description.length > 0 ? (
            <section>
              <SectionLabel label={t("details")} />
              <p
                className="mt-4 max-w-2xl text-base leading-relaxed whitespace-pre-line"
                style={{ color: "rgba(245,240,232,0.78)" }}
              >
                {description}
              </p>
            </section>
          ) : null}

          {/* rules */}
          {rules.length > 0 ? (
            <section>
              <SectionLabel label={t("rules")} />
              <ol
                className="notch mt-4 space-y-3 p-6 text-sm leading-relaxed md:p-8 md:text-base"
                style={{
                  background: "var(--ash-1)",
                  color: "rgba(245,240,232,0.85)",
                }}
              >
                {rules.map((rule, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="font-mono text-[11px] tracking-[0.2em] shrink-0"
                      style={{ color: "var(--hell-red)", minWidth: "1.5rem" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="whitespace-pre-line">{rule}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        {/* side column: prize, fee, slots, signup */}
        <aside className="space-y-4">
          <div
            className="notch p-6"
            style={{ background: "var(--ash-1)" }}
          >
            <div className="grid grid-cols-2 gap-px"
              style={{ background: "rgba(245,240,232,0.06)" }}>
              <Stat label={t("prize")} value={prizeLabel} accent />
              <Stat label={t("fee")} value={feeLabel} />
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <div
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {t("slots")}
                </div>
                <div className="font-display text-2xl font-black italic">
                  <span className="stat-number">{filled}</span>
                  <span style={{ color: "rgba(245,240,232,0.4)" }}>
                    &nbsp;/&nbsp;{capacity}
                  </span>
                </div>
              </div>
              <div className="slot-bar mt-2" aria-hidden>
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-6">
              {alreadySignedCode ? (
                <div
                  className="inline-flex w-full flex-col items-center justify-center gap-1 px-4 py-3 font-mono text-[11px] tracking-[0.25em] uppercase"
                  style={{
                    background: "var(--ash-3)",
                    color: "var(--ember)",
                    border: "1px solid rgba(230,0,19,0.4)",
                  }}
                  role="status"
                >
                  <span style={{ color: "var(--hell-red)" }}>
                    {t("alreadyIn")}
                  </span>
                  <span>
                    {t("alreadyInDetail", {
                      code: `SH-${alreadySignedCode}`,
                    })}
                  </span>
                </div>
              ) : isLockedDown ? (
                <div
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-[11px] tracking-[0.25em] uppercase"
                  style={{
                    background: "var(--ash-3)",
                    color: "rgba(245,240,232,0.6)",
                    border: "1px solid rgba(245,240,232,0.15)",
                  }}
                  role="status"
                >
                  {event.status === "completed" || event.status === "cancelled"
                    ? t("eventCompleted")
                    : t("registrationClosed")}
                </div>
              ) : !canSignup ? (
                <div
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-[11px] tracking-[0.25em] uppercase"
                  style={{
                    background: "var(--ash-3)",
                    color: "rgba(245,240,232,0.6)",
                    border: "1px solid rgba(245,240,232,0.15)",
                  }}
                  role="status"
                >
                  {isFull ? t("statusFull") : t("registrationClosed")}
                </div>
              ) : (
                <Link
                  href={`/events/${slug}/signup`}
                  className="btn-hell w-full justify-center"
                >
                  {t("slotIn")}
                  <span aria-hidden>↗</span>
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-px w-8"
        style={{ background: "var(--hell-red)" }}
        aria-hidden
      />
      <span
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {label}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-4" style={{ background: "var(--ash-3)" }}>
      <div
        className="font-mono text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "rgba(245,240,232,0.5)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl font-black italic"
        style={{ color: accent ? "var(--hell-red)" : "var(--bone)" }}
      >
        {value}
      </div>
    </div>
  );
}
