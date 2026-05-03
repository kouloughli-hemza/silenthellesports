import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import Image from "next/image";
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
  getActiveGiveaway,
  getCompletedGiveaways,
  getGiveawayBySlug,
  getGiveawayEntryCount,
} from "@/lib/data/giveaways";
import { getExistingEntryForCurrentUser } from "@/lib/giveaway/entries";
import { countdownTo, formatDateLong } from "@/lib/utils/format";
import { parseEntryMethods } from "@/lib/utils/giveaway";
import { pickTranslation, type GiveawayEntryMethodType } from "@/types/domain";
import type { Locale } from "@/types/domain";

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const [active, completed] = await Promise.all([
    getActiveGiveaway(),
    getCompletedGiveaways(20),
  ]);
  const slugs = new Set<string>();
  if (active) slugs.add(active.slug);
  for (const c of completed) slugs.add(c.slug);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const giveaway = await getGiveawayBySlug(slug);
  if (!giveaway) return {};
  const t = await getTranslations({ locale, namespace: "giveaway" });
  const title = pickTranslation(giveaway.title, locale);
  const prize = pickTranslation(giveaway.prize_description, locale);
  const fullTitle = t("metaSlugTitle", { title });
  return {
    title: fullTitle,
    description: prize || t("metaDescription"),
    alternates: {
      canonical: `/${locale}/giveaways/${slug}`,
      languages: {
        en: `/en/giveaways/${slug}`,
        ar: `/ar/giveaways/${slug}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: prize || t("metaDescription"),
      type: "article",
    },
  };
}

interface RuleEntry {
  t: string;
  s: string;
}

export default async function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const giveaway = await getGiveawayBySlug(slug);
  if (!giveaway) notFound();

  const t = await getTranslations({ locale, namespace: "giveaway" });
  const isAr = locale === "ar";

  const isActive = giveaway.status === "active";
  const isCompleted = giveaway.status === "completed";
  const isDrawing = giveaway.status === "drawing";

  const entryCount = isActive ? await getGiveawayEntryCount(giveaway.id) : 0;
  const methods = parseEntryMethods(giveaway.entry_methods);
  const rules = (t.raw("rules") as RuleEntry[]) ?? [];

  const session = isActive ? await getSessionUser() : null;
  const existingEntry = isActive
    ? await getExistingEntryForCurrentUser(giveaway.id)
    : null;
  const existingCompleted: GiveawayEntryMethodType[] = existingEntry
    ? existingEntry.completedMethods.filter(
        (m): m is GiveawayEntryMethodType =>
          m === "follow_tiktok" ||
          m === "join_discord" ||
          m === "subscribe_youtube" ||
          m === "share",
      )
    : [];

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

  const title = pickTranslation(giveaway.title, locale);
  const prize = pickTranslation(giveaway.prize_description, locale);
  const description = pickTranslation(giveaway.description, locale);
  const winnerAnnouncement = pickTranslation(giveaway.winner_announcement, locale);

  const initialCountdown = countdownTo(giveaway.ends_at);

  return (
    <article>
      {/* HERO */}
      <section
        className="grain relative overflow-hidden"
        style={{ background: "var(--black)" }}
      >
        <EmberField count={36} opacity={0.5} />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 70% 50%, rgba(230,0,19,0.28), transparent 70%), linear-gradient(180deg, var(--black) 0%, transparent 30%, transparent 70%, var(--ash-3) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-[1400px] px-6 pt-28 pb-16 md:px-10 md:pt-36 md:pb-20">
          <div className="mb-8">
            <Link
              href="/giveaways"
              className="font-mono text-[10px] tracking-[0.3em] uppercase transition-colors"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {isAr ? "←" : "←"} {t("backToGiveaways")}
            </Link>
          </div>

          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="section-label">
                {t("label", { drop: giveaway.drop_number ?? 1 })}
              </span>
              <h1
                className="font-display mt-5 text-4xl leading-[0.85] font-black uppercase md:text-6xl lg:text-7xl"
                style={{ color: "var(--bone)" }}
              >
                {title}
              </h1>
              {prize ? (
                <p
                  className="mt-4 max-w-2xl font-mono text-sm tracking-wider"
                  style={{ color: "rgba(245,240,232,0.7)" }}
                >
                  {prize}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {isActive ? (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      background: "var(--hell-red)",
                      color: "var(--bone)",
                    }}
                  >
                    <span className="live-dot" /> {t("live")}
                  </span>
                ) : null}
                {isDrawing ? (
                  <span
                    className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      background: "rgba(230,0,19,0.18)",
                      color: "var(--ember)",
                      border: "1px solid rgba(230,0,19,0.4)",
                    }}
                  >
                    {t("drawing")}
                  </span>
                ) : null}
                {isCompleted ? (
                  <span
                    className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      background: "rgba(10,10,10,0.85)",
                      color: "var(--ember)",
                      border: "1px solid rgba(255,69,0,0.4)",
                    }}
                  >
                    {t("completedBadge")}
                  </span>
                ) : null}
                {giveaway.estimated_value ? (
                  <span
                    className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      background: "var(--ash-1)",
                      color: "var(--bone)",
                      border: "1px solid rgba(245,240,232,0.12)",
                    }}
                  >
                    {t("value", { value: giveaway.estimated_value })}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full">
              {giveaway.prize_image_url ? (
                <Image
                  src={giveaway.prize_image_url}
                  alt={prize || title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <PlaceholderImage label={prize || title} aspect="4/3" />
              )}
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(230,0,19,0.18) 100%)",
                }}
              />
            </div>
          </div>

          {/* Active state: countdown + entry methods */}
          {isActive ? (
            <div className="mt-10">
              <CountdownTicker
                initial={initialCountdown}
                target={giveaway.ends_at}
                labels={{
                  days: t("days"),
                  hours: t("hours"),
                  minutes: t("minutes"),
                  seconds: t("seconds"),
                }}
                size="md"
              />
              <ActiveEntryPanel
                giveawayId={giveaway.id}
                methods={methods}
                locale={locale}
                entryCount={entryCount}
                sessionEmail={session?.email ?? null}
                existingDiscord={existingEntry?.discordTag ?? null}
                existingCompleted={existingCompleted}
                existingEntryCount={existingEntry?.entryCount ?? 0}
                formI18n={formI18n}
              />
            </div>
          ) : null}

          {/* Completed state: winner section */}
          {isCompleted ? (
            <div
              className="mt-10 grid gap-px md:grid-cols-2"
              style={{ background: "rgba(230,0,19,0.3)" }}
            >
              <div
                className="p-6 md:p-8"
                style={{ background: "var(--ash-1)" }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "var(--hell-red)" }}
                >
                  {t("winnerLabel")}
                </div>
                <p
                  className="font-display mt-3 text-2xl font-black italic uppercase md:text-3xl"
                  style={{ color: "var(--bone)" }}
                >
                  {giveaway.winner_user_id
                    ? winnerAnnouncement || t("winnerNotified")
                    : t("winnerNotified")}
                </p>
              </div>
              <div
                className="p-6 md:p-8"
                style={{ background: "var(--ash-1)" }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {t("endedOn", { date: formatDateLong(giveaway.ends_at, locale) })}
                </div>
                {winnerAnnouncement && giveaway.winner_user_id ? (
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: "rgba(245,240,232,0.75)" }}
                  >
                    {winnerAnnouncement}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* DETAILS */}
      <section className="relative py-16 md:py-20" style={{ background: "var(--ash-3)" }}>
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 md:px-10 lg:grid-cols-[1.5fr_1fr]">
          {/* prize + description */}
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {t("prize")}
            </div>
            <p
              className="font-display mt-3 text-2xl leading-tight font-black italic uppercase md:text-3xl"
              style={{ color: "var(--bone)" }}
            >
              {prize}
            </p>

            {description ? (
              <div className="mt-8">
                <div
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "var(--hell-red)" }}
                >
                  {t("details")}
                </div>
                <div
                  className="mt-3 space-y-4 text-sm leading-relaxed md:text-base"
                  style={{ color: "rgba(245,240,232,0.78)" }}
                >
                  {description.split(/\n{2,}/).map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <p
              className="mt-8 max-w-2xl font-mono text-xs tracking-wider"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {t("pull")}
            </p>
          </div>

          {/* rules */}
          <aside>
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {t("rulesLabel")}
            </div>
            <ul
              className="mt-3 grid gap-px"
              style={{ background: "rgba(230,0,19,0.25)" }}
            >
              {rules.map((r, i) => (
                <li
                  key={i}
                  className="p-4"
                  style={{ background: "var(--ash-1)" }}
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
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </article>
  );
}

// ----------------------------------------------------------------------------

function ActiveEntryPanel({
  giveawayId,
  methods,
  locale,
  entryCount,
  sessionEmail,
  existingDiscord,
  existingCompleted,
  existingEntryCount,
  formI18n,
}: {
  giveawayId: string;
  methods: ReturnType<typeof parseEntryMethods>;
  locale: Locale;
  entryCount: number;
  sessionEmail: string | null;
  existingDiscord: string | null;
  existingCompleted: GiveawayEntryMethodType[];
  existingEntryCount: number;
  formI18n: GiveawayEntryFormI18n;
}) {
  return (
    <div
      className="mt-px"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <div className="p-6 md:p-8">
        <GiveawayEntryForm
          giveawayId={giveawayId}
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
  );
}
