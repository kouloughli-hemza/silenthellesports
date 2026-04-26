import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PlaceholderImage, SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { getActivePlayers, getStaff } from "@/lib/data/players";
import { flagEmoji } from "@/lib/utils/format";
import type { Player, PlayerStats } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "roster" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/roster`,
      languages: {
        en: "/en/roster",
        ar: "/ar/roster",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      locale: locale === "ar" ? "ar_DZ" : "en_US",
    },
  };
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [players, staff, t] = await Promise.all([
    getActivePlayers(),
    getStaff(),
    getTranslations({ locale, namespace: "roster" }),
  ]);

  return (
    <section
      className="grain relative py-24 md:py-32"
      style={{ background: "var(--black)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeading
          label={t("label", { count: players.length })}
          title={
            <>
              {t("t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
              {t("t3")}
            </>
          }
        />

        {players.length === 0 ? (
          <RosterEmpty
            title={t("emptyTitle")}
            sub={t("emptySub")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {players.map((player, i) => (
              <PlayerGridCard
                key={player.id}
                player={player}
                index={i}
                locale={locale}
                callsignLabel={t("callsign")}
                kdLabel={t("kd")}
                hsLabel={t("hs")}
                noStat={t("noStat")}
              />
            ))}
          </div>
        )}

        {staff.length > 0 ? (
          <div className="mt-24 md:mt-32">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="section-label">{t("staff")}</span>
                <h3
                  className="font-display mt-3 text-3xl leading-[0.9] font-black uppercase md:text-4xl"
                  style={{ color: "var(--bone)" }}
                >
                  {t("staff").replace(/^\/\/\s*/, "")}
                </h3>
                <p
                  className="mt-2 max-w-md text-sm"
                  style={{ color: "rgba(245,240,232,0.6)" }}
                >
                  {t("staffSub")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {staff.map((person, i) => (
                <StaffCard
                  key={person.id}
                  person={person}
                  index={i}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// PlayerGridCard — adapted from design home.jsx PlayerCard for a static grid.
// -----------------------------------------------------------------------------

interface PlayerGridCardProps {
  player: Player;
  index: number;
  locale: Locale;
  callsignLabel: string;
  kdLabel: string;
  hsLabel: string;
  noStat: string;
}

function PlayerGridCard({
  player,
  index,
  locale,
  callsignLabel,
  kdLabel,
  hsLabel,
  noStat,
}: PlayerGridCardProps) {
  const stats = readStats(player.stats);
  const indexLabel = `P${String(index + 1).padStart(2, "0")}`;
  const flag = flagEmoji(player.country_code);

  return (
    <Link
      href={`/roster/${encodeURIComponent(player.ign)}`}
      locale={locale}
      className="card-bite notch interactive group block focus-visible:outline-none"
      style={{ background: "var(--ash-1)" }}
      aria-label={`${callsignLabel} ${player.ign}`}
    >
      <div className="relative">
        <PlaceholderImage
          label={`${callsignLabel} ${indexLabel}`}
          aspect="4/5"
          grayscale
        />
        <div
          className="absolute top-3 left-3 px-2 py-1 font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ background: "rgba(10,10,10,0.7)", color: "var(--bone)" }}
        >
          {indexLabel}
        </div>
        <div
          className="absolute top-3 right-3 text-2xl"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
          aria-hidden
        >
          {flag}
        </div>
        <div
          className="absolute bottom-3 left-3 px-2 py-1 font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ background: "var(--hell-red)", color: "var(--bone)" }}
        >
          {player.role}
        </div>
        {/* hover callsign reveal */}
        <div
          className="pointer-events-none absolute inset-0 flex items-end p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 60%)",
          }}
        >
          <div>
            <div
              className="font-mono text-[9px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {callsignLabel}
            </div>
            <div className="font-display glitch-target mt-1 text-xl font-black italic uppercase">
              {player.ign}
            </div>
          </div>
        </div>
      </div>
      <div
        className="border-t p-4"
        style={{ borderColor: "rgba(230,0,19,0.25)" }}
      >
        <div className="font-display text-2xl leading-none font-black italic uppercase">
          {player.ign}
        </div>
        <div
          className="mt-1 text-xs"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          {player.real_name ?? "—"}
        </div>
        <div
          className="mt-3 grid grid-cols-2 gap-2 border-t pt-3"
          style={{ borderColor: "rgba(245,240,232,0.08)" }}
        >
          <div>
            <div
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {kdLabel}
            </div>
            <div
              className="stat-number text-lg font-bold"
              style={{ color: "var(--hell-red)" }}
            >
              {formatKd(stats.kd, locale, noStat)}
            </div>
          </div>
          <div>
            <div
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {hsLabel}
            </div>
            <div className="stat-number text-lg font-bold">
              {formatHs(stats.headshot_pct, locale, noStat)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// -----------------------------------------------------------------------------
// StaffCard — slimmer card for Manager / Coach / Analyst.
// -----------------------------------------------------------------------------

interface StaffCardProps {
  person: Player;
  index: number;
  locale: Locale;
}

function StaffCard({ person, index, locale }: StaffCardProps) {
  const flag = flagEmoji(person.country_code);
  const indexLabel = `S${String(index + 1).padStart(2, "0")}`;
  return (
    <Link
      href={`/roster/${encodeURIComponent(person.ign)}`}
      locale={locale}
      className="card-bite notch-sm interactive group block p-4 focus-visible:outline-none"
      style={{ background: "var(--ash-1)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          {indexLabel}
        </span>
        <span
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ background: "var(--hell-red)", color: "var(--bone)", padding: "2px 6px" }}
        >
          {person.role}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display glitch-target truncate text-xl font-black italic uppercase">
            {person.ign}
          </div>
          <div
            className="mt-1 truncate text-xs"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {person.real_name ?? "—"}
          </div>
        </div>
        <div
          className="text-2xl"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
          aria-hidden
        >
          {flag}
        </div>
      </div>
    </Link>
  );
}

// -----------------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------------

function RosterEmpty({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      className="notch flex flex-col items-center justify-center gap-3 py-24 text-center"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <span
        className="font-mono text-xs tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {title}
      </span>
      <p
        className="max-w-md text-sm"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {sub}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stats helpers
// -----------------------------------------------------------------------------

function readStats(value: unknown): PlayerStats {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  const kd = typeof obj.kd === "number" ? obj.kd : undefined;
  const headshot_pct =
    typeof obj.headshot_pct === "number" ? obj.headshot_pct : undefined;
  const matches = typeof obj.matches === "number" ? obj.matches : undefined;
  const wins = typeof obj.wins === "number" ? obj.wins : undefined;
  return { kd, headshot_pct, matches, wins };
}

function formatKd(value: number | undefined, locale: Locale, fallback: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatHs(value: number | undefined, locale: Locale, fallback: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value) + "%";
}
