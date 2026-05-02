import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PlaceholderImage, PlayerPortrait, SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import {
  getActivePlayers,
  getPlayerByIgn,
  getStaff,
} from "@/lib/data/players";
import { getActiveProducts } from "@/lib/data/products";
import { highlightEmbedSrc, parseHighlightUrl } from "@/lib/players/highlight";
import { flagEmoji } from "@/lib/utils/format";
import {
  formatPrice,
  pickTranslation,
  type PlayerSocials,
  type PlayerStats,
  type Product,
} from "@/types/domain";

// -----------------------------------------------------------------------------
// Static params + metadata
// -----------------------------------------------------------------------------

export async function generateStaticParams(): Promise<Array<{ ign: string }>> {
  const [active, staff] = await Promise.all([getActivePlayers(), getStaff()]);
  const all = [...active, ...staff];
  const seen = new Set<string>();
  const params: Array<{ ign: string }> = [];
  for (const p of all) {
    const key = p.ign.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({ ign: p.ign });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ign: string }>;
}): Promise<Metadata> {
  const { locale, ign } = await params;
  if (!isLocale(locale)) return {};

  const player = await getPlayerByIgn(decodeURIComponent(ign));
  const t = await getTranslations({ locale, namespace: "roster" });

  if (!player) {
    return {
      title: t("metaTitle"),
      description: t("metaDescription"),
    };
  }

  const bio = pickTranslation(player.bio, locale);
  const description =
    bio.trim().length > 0
      ? bio
      : t("playerMetaDescriptionFallback", { ign: player.ign });

  return {
    title: t("playerMetaTitle", { ign: player.ign }),
    description,
    alternates: {
      canonical: `/${locale}/roster/${player.ign}`,
    },
    openGraph: {
      title: t("playerMetaTitle", { ign: player.ign }),
      description,
      type: "profile",
      locale: locale === "ar" ? "ar_DZ" : "en_US",
      images: player.photo_url ? [{ url: player.photo_url }] : undefined,
    },
  };
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; ign: string }>;
}) {
  const { locale, ign } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const decodedIgn = decodeURIComponent(ign);
  const player = await getPlayerByIgn(decodedIgn);
  if (!player) notFound();

  const [products, t] = await Promise.all([
    getActiveProducts({ wornByPlayerId: player.id }),
    getTranslations({ locale, namespace: "roster" }),
  ]);

  const stats = readStats(player.stats);
  const socials = readSocials(player.socials);
  const bio = pickTranslation(player.bio, locale);
  const isAr = locale === "ar";
  const flag = flagEmoji(player.country_code);
  const highlight = parseHighlightUrl(player.highlight_url);

  return (
    <article style={{ background: "var(--black)" }}>
      {/* Back link */}
      <div className="mx-auto max-w-[1400px] px-6 pt-24 md:px-10 md:pt-32">
        <Link
          href="/roster"
          locale={locale}
          className="interactive inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(245,240,232,0.65)" }}
        >
          <span style={{ color: "var(--hell-red)" }}>{isAr ? "→" : "←"}</span>
          {t("back")}
        </Link>
      </div>

      {/* Hero band */}
      <section className="grain mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
          {/* Portrait */}
          <div
            className="card-bite notch overflow-hidden"
            style={{ background: "var(--ash-1)" }}
          >
            <PlayerPortrait
              src={player.photo_url}
              alt={player.ign}
              fallbackLabel={`OPERATIVE · ${player.ign}`}
              aspect="4/5"
              sizes="(max-width: 768px) 90vw, 420px"
              priority
            />
          </div>

          {/* Identity */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="px-2 py-1 font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ background: "var(--hell-red)", color: "var(--bone)" }}
              >
                {player.role}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                {t("operative")}
              </span>
            </div>
            <h1
              className="font-display mt-5 text-5xl leading-[0.85] font-black italic uppercase md:text-7xl"
              style={{ color: "var(--bone)" }}
            >
              {player.ign}
            </h1>
            {player.real_name ? (
              <p
                className="mt-4 font-mono text-sm tracking-wide uppercase"
                style={{ color: "rgba(245,240,232,0.65)" }}
              >
                <span style={{ color: "var(--hell-red)" }}>{"// "}</span>
                {t("real")} · {player.real_name}
              </p>
            ) : null}
            {player.country_code ? (
              <p
                className="mt-2 flex items-center gap-2 font-mono text-sm tracking-wide uppercase"
                style={{ color: "rgba(245,240,232,0.65)" }}
              >
                <span style={{ color: "var(--hell-red)" }}>{"// "}</span>
                {t("country")} ·
                <span aria-hidden className="text-xl">
                  {flag}
                </span>
                <span>{player.country_code}</span>
              </p>
            ) : null}

            {/* Stats grid */}
            <div
              className="mt-8 grid grid-cols-3 gap-px"
              style={{ background: "rgba(230,0,19,0.25)" }}
            >
              <StatCell
                label={t("kd")}
                value={formatKd(stats.kd, locale, t("noStat"))}
                accent
              />
              <StatCell
                label={t("hs")}
                value={formatHs(stats.headshot_pct, locale, t("noStat"))}
              />
              <StatCell
                label={t("matches")}
                value={formatInt(stats.matches, locale, t("noStat"))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Signature loadout */}
      {player.signature_loadout ? (
        <section
          className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16"
        >
          <div className="mb-6">
            <span className="section-label">{t("loadout")}</span>
          </div>
          <div
            className="notch p-6 md:p-8"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.25)",
            }}
          >
            <p
              className="font-mono text-sm leading-relaxed whitespace-pre-line md:text-base"
              style={{ color: "var(--bone)" }}
            >
              {player.signature_loadout}
            </p>
          </div>
        </section>
      ) : null}

      {/* Highlight reel */}
      {highlight ? (
        <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
          <div className="mb-6">
            <span className="section-label">{t("highlight")}</span>
          </div>
          <div
            className="relative w-full overflow-hidden mx-auto"
            style={
              highlight.platform === "tiktok"
                ? { maxWidth: 360, aspectRatio: "9 / 16", border: "1px solid rgba(230,0,19,0.25)" }
                : { aspectRatio: "16 / 9", border: "1px solid rgba(230,0,19,0.25)" }
            }
          >
            <iframe
              src={highlightEmbedSrc(highlight)}
              title={t("highlightAria", { ign: player.ign })}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
                background: "var(--ash-3)",
              }}
            />
          </div>
        </section>
      ) : null}

      {/* Bio */}
      <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
        <div className="mb-6">
          <span className="section-label">{t("bio")}</span>
        </div>
        <div
          className="notch-sm p-6 md:p-8"
          style={{
            background: "var(--ash-3)",
            border: "1px solid rgba(245,240,232,0.08)",
          }}
        >
          <p
            className="text-base leading-relaxed whitespace-pre-line md:text-lg"
            style={{
              color: bio ? "var(--bone)" : "rgba(245,240,232,0.55)",
            }}
          >
            {bio || t("noBio")}
          </p>
        </div>
      </section>

      {/* Socials */}
      {hasAnySocial(socials) ? (
        <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16">
          <div className="mb-6">
            <span className="section-label">{t("socials")}</span>
          </div>
          <ul className="flex flex-wrap gap-3">
            {socials.tiktok ? (
              <SocialLink
                href={socials.tiktok}
                label="TikTok"
                icon={<TikTokIcon />}
              />
            ) : null}
            {socials.liquipedia ? (
              <SocialLink
                href={socials.liquipedia}
                label="Liquipedia"
                icon={<LiquipediaIcon />}
              />
            ) : null}
            {socials.instagram ? (
              <SocialLink
                href={socials.instagram}
                label="Instagram"
                icon={<InstagramIcon />}
              />
            ) : null}
          </ul>
        </section>
      ) : null}

      {/* Shop their gear */}
      <section
        className="grain mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24"
      >
        <SectionHeading
          label={t("gear").toUpperCase()}
          title={
            <>
              {t("gear")}
              <span style={{ color: "var(--hell-red)" }}>.</span>
            </>
          }
          subtitle={t("gearSub")}
        />
        {products.length === 0 ? (
          <div
            className="notch flex flex-col items-start gap-4 p-6 md:p-8"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.25)",
            }}
          >
            <p className="text-base" style={{ color: "rgba(245,240,232,0.7)" }}>
              {t("noGear")}
            </p>
            <Link
              href="/store"
              locale={locale}
              className="btn-ghost interactive"
            >
              {t("browseStore")}
              <span style={{ color: "var(--hell-red)" }}>
                {isAr ? "←" : "→"}
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => (
              <GearCard
                key={product.id}
                product={product}
                index={i}
                locale={locale}
              />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="p-5" style={{ background: "var(--ash-3)" }}>
      <div
        className="mb-2 font-mono text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {label}
      </div>
      <div
        className="font-display stat-number text-3xl font-black md:text-4xl"
        style={{ color: accent ? "var(--hell-red)" : "var(--bone)" }}
      >
        {value}
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={label}
        className="interactive inline-flex h-11 w-11 items-center justify-center"
        style={{
          background: "var(--ash-1)",
          color: "var(--bone)",
          border: "1px solid rgba(230,0,19,0.4)",
        }}
      >
        {icon}
      </a>
    </li>
  );
}

function GearCard({
  product,
  index,
  locale,
}: {
  product: Product;
  index: number;
  locale: Locale;
}) {
  const name = pickTranslation(product.name, locale);
  return (
    <Link
      href={`/store/${encodeURIComponent(product.slug)}`}
      locale={locale}
      className="card-bite notch-sm interactive group block focus-visible:outline-none"
      style={{ background: "var(--ash-1)" }}
    >
      <div className="relative">
        <PlaceholderImage
          label={`PRODUCT ${String(index + 1).padStart(2, "0")}`}
          aspect="1/1"
          grayscale
        />
      </div>
      <div className="p-3">
        <div className="font-display truncate text-base font-black uppercase">
          {name || product.slug}
        </div>
        <div
          className="stat-number mt-1 text-xs"
          style={{ color: "var(--ember)" }}
        >
          {formatPrice(Number(product.base_price), locale)}
        </div>
      </div>
    </Link>
  );
}

// -----------------------------------------------------------------------------
// Stats / socials helpers
// -----------------------------------------------------------------------------

function readStats(value: unknown): PlayerStats {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  return {
    kd: typeof obj.kd === "number" ? obj.kd : undefined,
    headshot_pct:
      typeof obj.headshot_pct === "number" ? obj.headshot_pct : undefined,
    matches: typeof obj.matches === "number" ? obj.matches : undefined,
    wins: typeof obj.wins === "number" ? obj.wins : undefined,
  };
}

function readSocials(value: unknown): PlayerSocials {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  const pickStr = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim().length > 0 ? v : undefined;
  return {
    tiktok: pickStr(obj.tiktok),
    liquipedia: pickStr(obj.liquipedia),
    instagram: pickStr(obj.instagram),
  };
}

function hasAnySocial(s: PlayerSocials): boolean {
  return Boolean(s.tiktok || s.liquipedia || s.instagram);
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
  return (
    new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
      maximumFractionDigits: 0,
    }).format(value) + "%"
  );
}

function formatInt(value: number | undefined, locale: Locale, fallback: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

// -----------------------------------------------------------------------------
// Inline social icons
// -----------------------------------------------------------------------------

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.5 6.5c-1.6 0-3-.6-4-1.7-.6-.7-1-1.6-1.1-2.6V2h-3.3v13.4c0 1.1-.5 2.2-1.4 2.9-.7.5-1.5.8-2.4.8-2.1 0-3.8-1.7-3.8-3.7s1.7-3.7 3.8-3.7c.4 0 .8.1 1.1.2V8.5c-.4-.1-.7-.1-1.1-.1C3.8 8.4 1 11.2 1 14.7s2.8 6.3 6.3 6.3c1.4 0 2.8-.5 3.9-1.3 1.5-1.1 2.5-2.9 2.5-4.9V8.6c1.4 1 3.1 1.6 4.8 1.6V7c-.1 0-.2 0-.3-.1.1-.1.2-.3.3-.4z" />
    </svg>
  );
}

// Liquipedia uses a stylised "L" wordmark; in this small footprint we use a
// simple monogram tile so the affordance reads as a button regardless of
// whether visitors recognise the brand.
function LiquipediaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 6.5v11h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
