import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmberField, PlaceholderImage } from "@/components/brand";
import { CountdownTicker } from "@/components/public/countdown-ticker";
import {
  GiveawayEntryForm,
  type GiveawayEntryFormI18n,
} from "@/components/public/giveaway-entry-form";
import { Link } from "@/lib/i18n/routing";
import { isLocale } from "@/lib/i18n/routing";
import { getSessionUser } from "@/lib/auth/session";
import {
  getActiveGiveaways,
  getCompletedGiveaways,
  getGiveawayEntryCount,
} from "@/lib/data/giveaways";
import { getExistingEntryForCurrentUser } from "@/lib/giveaway/entries";
import { countdownTo, formatDateLong } from "@/lib/utils/format";
import { parseEntryMethods } from "@/lib/utils/giveaway";
import { pickTranslation, type GiveawayEntryMethodType } from "@/types/domain";
import type { Giveaway, Locale } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "giveaway" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/giveaways`,
      languages: {
        en: "/en/giveaways",
        ar: "/ar/giveaways",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

interface RuleEntry {
  t: string;
  s: string;
}

export default async function GiveawaysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "giveaway" });
  const isAr = locale === "ar";

  const [actives, completed] = await Promise.all([
    getActiveGiveaways(),
    getCompletedGiveaways(6),
  ]);
  const active = actives[0] ?? null;
  const otherActives = actives.slice(1);

  const entryCount = active ? await getGiveawayEntryCount(active.id) : 0;
  const session = active ? await getSessionUser() : null;
  const existingEntry = active
    ? await getExistingEntryForCurrentUser(active.id)
    : null;
  const hasContent = actives.length > 0 || completed.length > 0;
  const rules = (t.raw("rules") as RuleEntry[]) ?? [];

  const formI18n: GiveawayEntryFormI18n = {
    live: t("live"),
    yours: t("yours"),
    pool: t("pool"),
    lockEntry: t("lockEntry"),
    lockSubmitting: t("lockSubmitting"),
    lockedSuccess: t("lockedSuccess"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    emailRequired: t("emailRequired"),
    discordOptional: t("discordOptional"),
    discordPlaceholder: t("discordPlaceholder"),
    alreadyEntered: t("alreadyEntered"),
    error: t("error"),
    openLink: t("openLink"),
    markComplete: t("markComplete"),
    markedComplete: t("markedComplete"),
    noEntryMethods: t("noEntryMethods"),
    h1: t("h1"),
    h2: t("h2"),
    h3: t("h3"),
    entry: t("entry"),
    entries: t("entries"),
  };

  return (
    <>
      {active ? (
        <ActiveGiveawayHero
          giveaway={active}
          entryCount={entryCount}
          locale={locale}
          isAr={isAr}
          rules={rules}
          formI18n={formI18n}
          sessionEmail={session?.email ?? null}
          existingDiscord={existingEntry?.discordTag ?? null}
          existingCompleted={
            existingEntry
              ? existingEntry.completedMethods.filter(
                  (m): m is GiveawayEntryMethodType =>
                    m === "follow_tiktok" ||
                    m === "join_discord" ||
                    m === "subscribe_youtube" ||
                    m === "share",
                )
              : []
          }
          existingEntryCount={existingEntry?.entryCount ?? 0}
          i18n={{
            label: t("label", { drop: active.drop_number ?? 1 }),
            t1: t("t1"),
            t2: t("t2"),
            total: t("total"),
            tier: t("tier"),
            valueFmt: (value: string) => t("value", { value }),
            pull: t("pull"),
            days: t("days"),
            hours: t("hours"),
            minutes: t("minutes"),
            seconds: t("seconds"),
          }}
        />
      ) : (
        <EmptyHero
          title1={t("t1")}
          title2={t("t2")}
          archive={t("archive")}
          archiveSub={t("archiveSub")}
        />
      )}

      {otherActives.length > 0 ? (
        <AlsoLive
          giveaways={otherActives}
          locale={locale}
          alsoLiveLabel={t("alsoLive")}
          alsoLiveSub={t("alsoLiveSub")}
          enterLabel={t("enterLabel")}
          endsFmt={(date: string) => t("endsOn", { date })}
        />
      ) : null}

      {completed.length > 0 ? (
        <PastWinners
          giveaways={completed}
          locale={locale}
          archive={t("archive")}
          archiveSub={t("archiveSub")}
          completedBadge={t("completedBadge")}
          viewDraw={t("viewDraw")}
          endedFmt={(date: string) => t("endedOn", { date })}
        />
      ) : null}

      {!hasContent ? <EmptyState message={t("noActive")} /> : null}
    </>
  );
}

// ----------------------------------------------------------------------------
// Active hero — full-bleed adaptation of GiveawaysSection from the design.
// ----------------------------------------------------------------------------

interface HeroI18n {
  label: string;
  t1: string;
  t2: string;
  total: string;
  tier: string;
  valueFmt: (value: string) => string;
  pull: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function ActiveGiveawayHero({
  giveaway,
  entryCount,
  locale,
  isAr,
  rules,
  i18n,
  formI18n,
  sessionEmail,
  existingDiscord,
  existingCompleted,
  existingEntryCount,
}: {
  giveaway: Giveaway;
  entryCount: number;
  locale: Locale;
  isAr: boolean;
  rules: RuleEntry[];
  i18n: HeroI18n;
  formI18n: GiveawayEntryFormI18n;
  sessionEmail: string | null;
  existingDiscord: string | null;
  existingCompleted: GiveawayEntryMethodType[];
  existingEntryCount: number;
}) {
  const title = pickTranslation(giveaway.title, locale);
  const prizeText = pickTranslation(giveaway.prize_description, locale);
  const description = pickTranslation(giveaway.description, locale);

  const methods = parseEntryMethods(giveaway.entry_methods);
  const initialCountdown = countdownTo(giveaway.ends_at);
  const formattedCount = new Intl.NumberFormat(isAr ? "ar-DZ" : "en-US").format(entryCount);

  return (
    <section
      id="giveaways"
      className="grain relative overflow-hidden"
      style={{ background: "var(--black)" }}
    >
      <EmberField count={50} opacity={0.6} />
      <div className="absolute inset-0 opacity-30" aria-hidden>
        <PlaceholderImage label="" aspect="auto" redLight={false} />
      </div>
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 80% 50%, rgba(230,0,19,0.35), transparent 70%), linear-gradient(180deg, var(--black) 0%, transparent 30%, transparent 70%, var(--black) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32">
        {/* heading row */}
        <div className="mb-12 grid items-end gap-8 lg:mb-16 lg:grid-cols-[auto_1fr_auto]">
          <div>
            <span className="section-label">{i18n.label}</span>
            <h1
              className="font-display mt-5 text-5xl leading-[0.85] font-black uppercase md:text-7xl lg:text-8xl"
              style={{ color: "var(--bone)" }}
            >
              {i18n.t1}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{i18n.t2}</span>
            </h1>
          </div>
          <div className="hidden lg:block" />
          <div className="text-end">
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {i18n.total}
            </div>
            <div className="font-display mt-1 text-4xl font-black italic md:text-5xl">
              <span className="stat-number">{formattedCount}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* countdown strip */}
          <div className="mb-px">
            <CountdownTicker
              initial={initialCountdown}
              target={giveaway.ends_at}
              labels={{
                days: i18n.days,
                hours: i18n.hours,
                minutes: i18n.minutes,
                seconds: i18n.seconds,
              }}
              size="lg"
            />
          </div>

          {/* main panel */}
          <div
            className="grid lg:grid-cols-[1.1fr_1fr]"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.25)",
            }}
          >
            {/* left: prize visual */}
            <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
              {giveaway.prize_image_url ? (
                <Image
                  src={giveaway.prize_image_url}
                  alt={prizeText || title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <PlaceholderImage label={prizeText || title} aspect="auto" />
              )}
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(230,0,19,0.2) 100%)",
                }}
              />
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                <span
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ background: "var(--hell-red)", padding: "0.375rem 0.75rem" }}
                >
                  {i18n.tier}
                </span>
                {giveaway.estimated_value ? (
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      background: "rgba(10,10,10,0.85)",
                      color: "var(--ember)",
                      padding: "0.375rem 0.75rem",
                    }}
                  >
                    {i18n.valueFmt(giveaway.estimated_value)}
                  </span>
                ) : null}
              </div>
              <div className="absolute right-6 bottom-6 left-6">
                <div className="font-display text-3xl leading-[0.9] font-black italic uppercase md:text-5xl">
                  {title}
                </div>
                {prizeText ? (
                  <div
                    className="mt-3 font-mono text-xs tracking-wider"
                    style={{ color: "rgba(245,240,232,0.7)" }}
                  >
                    {prizeText}
                  </div>
                ) : null}
              </div>
            </div>

            {/* right: tasks */}
            <div className="flex flex-col p-7 md:p-10">
              {description ? (
                <p
                  className="mb-4 max-w-md text-sm leading-relaxed"
                  style={{ color: "rgba(245,240,232,0.7)" }}
                >
                  {description}
                </p>
              ) : null}
              <GiveawayEntryForm
                giveawayId={giveaway.id}
                methods={methods}
                locale={locale}
                initialPool={entryCount}
                defaultEmail={sessionEmail}
                defaultDiscordTag={existingDiscord}
                initialCompleted={existingCompleted}
                initialEntryCount={existingEntryCount}
                i18n={formI18n}
              />
            </div>
          </div>

          {/* footer rules strip */}
          <div
            className="mt-px grid grid-cols-2 gap-px md:grid-cols-4"
            style={{ background: "rgba(230,0,19,0.25)" }}
          >
            {rules.map((r, i) => (
              <div
                key={i}
                className="p-4 md:p-5"
                style={{ background: "var(--ash-3)" }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "var(--hell-red)" }}
                >
                  {`// 0${i + 1}`}
                </div>
                <div className="font-display mt-1.5 text-sm font-bold italic uppercase md:text-base">
                  {r.t}
                </div>
                <div
                  className="mt-1 font-mono text-[10px] tracking-wider"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {r.s}
                </div>
              </div>
            ))}
          </div>

          <p
            className="mt-6 max-w-2xl font-mono text-xs tracking-wider"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {i18n.pull}
          </p>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Empty hero — when no active giveaway exists.
// ----------------------------------------------------------------------------

function EmptyHero({
  title1,
  title2,
  archive,
  archiveSub,
}: {
  title1: string;
  title2: string;
  archive: string;
  archiveSub: string;
}) {
  return (
    <section
      className="grain relative overflow-hidden"
      style={{ background: "var(--black)" }}
    >
      <EmberField count={30} opacity={0.4} />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(230,0,19,0.18), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <span className="section-label">{archive}</span>
        <h1
          className="font-display mt-5 text-5xl leading-[0.85] font-black uppercase md:text-7xl"
          style={{ color: "var(--bone)" }}
        >
          {title1}
          <br />
          <span style={{ color: "var(--hell-red)" }}>{title2}</span>
        </h1>
        <p
          className="mt-6 max-w-xl font-mono text-sm tracking-wider"
          style={{ color: "rgba(245,240,232,0.6)" }}
        >
          {archiveSub}
        </p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Past winners gallery.
// ----------------------------------------------------------------------------

function PastWinners({
  giveaways,
  locale,
  archive,
  archiveSub,
  completedBadge,
  viewDraw,
  endedFmt,
}: {
  giveaways: Giveaway[];
  locale: Locale;
  archive: string;
  archiveSub: string;
  completedBadge: string;
  viewDraw: string;
  endedFmt: (date: string) => string;
}) {
  return (
    <section className="relative py-20 md:py-24" style={{ background: "var(--ash-3)" }}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <span className="section-label">{archive}</span>
            <h2
              className="font-display mt-4 text-3xl leading-[0.95] font-black uppercase md:text-5xl"
              style={{ color: "var(--bone)" }}
            >
              {archiveSub}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {giveaways.map((g) => {
            const title = pickTranslation(g.title, locale);
            const prize = pickTranslation(g.prize_description, locale);
            return (
              <Link
                key={g.id}
                href={`/giveaways/${g.slug}`}
                className="card-bite interactive group flex flex-col"
                style={{
                  background: "var(--ash-1)",
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {g.prize_image_url ? (
                    <Image
                      src={g.prize_image_url}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <PlaceholderImage label={title} aspect="4/3" />
                  )}
                  <div
                    className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.25em] uppercase"
                    style={{
                      background: "rgba(10,10,10,0.85)",
                      color: "var(--ember)",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {completedBadge}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div
                    className="font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {endedFmt(formatDateLong(g.ends_at, locale))}
                  </div>
                  <div className="font-display glitch-target text-base leading-tight font-black italic uppercase md:text-lg">
                    {title}
                  </div>
                  {prize ? (
                    <div
                      className="text-xs leading-snug"
                      style={{ color: "rgba(245,240,232,0.65)" }}
                    >
                      {prize}
                    </div>
                  ) : null}
                  <div
                    className="mt-auto flex items-center justify-between pt-3 font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--hell-red)" }}
                  >
                    <span>{viewDraw}</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Also live — secondary active giveaways shown under the hero.
// ----------------------------------------------------------------------------

function AlsoLive({
  giveaways,
  locale,
  alsoLiveLabel,
  alsoLiveSub,
  enterLabel,
  endsFmt,
}: {
  giveaways: Giveaway[];
  locale: Locale;
  alsoLiveLabel: string;
  alsoLiveSub: string;
  enterLabel: string;
  endsFmt: (date: string) => string;
}) {
  return (
    <section className="relative py-16 md:py-20" style={{ background: "var(--black)" }}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-8">
          <span className="section-label">{alsoLiveLabel}</span>
          <h2
            className="font-display mt-3 text-3xl leading-[0.95] font-black uppercase md:text-4xl"
            style={{ color: "var(--bone)" }}
          >
            {alsoLiveSub}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {giveaways.map((g) => {
            const title = pickTranslation(g.title, locale);
            const prize = pickTranslation(g.prize_description, locale);
            return (
              <Link
                key={g.id}
                href={`/giveaways/${g.slug}`}
                className="card-bite interactive group flex flex-col"
                style={{
                  background: "var(--ash-1)",
                  border: "1px solid rgba(230,0,19,0.25)",
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {g.prize_image_url ? (
                    <Image
                      src={g.prize_image_url}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <PlaceholderImage label={title} aspect="4/3" />
                  )}
                  <div
                    className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1"
                    style={{ background: "var(--hell-red)" }}
                  >
                    <span className="live-dot" style={{ background: "var(--bone)" }} />
                    <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase">
                      {alsoLiveLabel.replace(/^\/\/\s*/, "")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div
                    className="font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {endsFmt(formatDateLong(g.ends_at, locale))}
                  </div>
                  <div className="font-display glitch-target text-base leading-tight font-black italic uppercase md:text-lg">
                    {title}
                  </div>
                  {prize ? (
                    <div
                      className="text-xs leading-snug"
                      style={{ color: "rgba(245,240,232,0.65)" }}
                    >
                      {prize}
                    </div>
                  ) : null}
                  <div
                    className="mt-auto flex items-center justify-between pt-3 font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--hell-red)" }}
                  >
                    <span>{enterLabel}</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Empty state when nothing exists at all.
// ----------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <section className="relative py-20" style={{ background: "var(--ash-3)" }}>
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p
          className="font-mono text-sm tracking-wider"
          style={{ color: "rgba(245,240,232,0.7)" }}
        >
          {message}
        </p>
      </div>
    </section>
  );
}
