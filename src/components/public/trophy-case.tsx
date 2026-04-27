import { getTranslations } from "next-intl/server";
import { CountUp, SectionHeading, SkullIcon } from "@/components/brand";
import { TrophyRevealMount } from "@/components/scenes/TrophyRevealMount";
import { getRecentTrophies, getTrophyStats } from "@/lib/data/trophies";
import { pickTranslation, type Locale, type Trophy } from "@/types/domain";

interface TrophyCaseProps {
  locale: Locale;
}

function isFirstPlacement(placement: string): boolean {
  return /^1(st)?$/i.test(placement.trim());
}

function formatPrizeShort(amount: number, currency: string, locale: Locale): string {
  if (amount <= 0) return "";
  const symbol = currency === "USD" ? "$" : "";
  const localeStr = locale === "ar" ? "ar-DZ" : "en-US";
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${symbol}${v.toLocaleString(localeStr, { maximumFractionDigits: 1 })}M`;
  }
  if (amount >= 1_000) {
    const v = amount / 1_000;
    return `${symbol}${v.toLocaleString(localeStr, { maximumFractionDigits: 0 })}K`;
  }
  return `${symbol}${amount.toLocaleString(localeStr, { maximumFractionDigits: 0 })}`;
}

export async function TrophyCase({ locale }: TrophyCaseProps) {
  const t = await getTranslations({ locale, namespace: "trophy" });
  const trophies = await getRecentTrophies(6);
  const stats = await getTrophyStats();

  const totalPrizeLabel = formatPrizeShort(stats.totalPrizeUsd, "USD", locale) || "$0";

  return (
    <section
      className="grain relative py-24 md:py-32"
      style={{ background: "var(--ash-3)" }}
    >
      <TrophyRevealMount
        winnerLine={t("revealWinner")}
        chickenLine={t("revealChicken")}
        subtitle={t("revealSubtitle")}
        skipLabel={locale === "ar" ? "تخطي" : "SKIP"}
      />
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-12 grid items-end gap-12 md:grid-cols-[1fr_2fr]">
          <SectionHeading
            label={t("label", { count: stats.totalCount })}
            title={
              <>
                {t("t1")}
                <br />
                {t("t2")}
              </>
            }
            subtitle={t("sub")}
          />
          <div
            className="grid grid-cols-3 gap-px"
            style={{ background: "rgba(230,0,19,0.2)" }}
          >
            <div className="p-4" style={{ background: "var(--ash-3)" }}>
              <div
                className="font-display text-3xl font-black"
                style={{ color: "var(--hell-red)" }}
              >
                {totalPrizeLabel}
              </div>
              <div
                className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                {t("lifetime")}
              </div>
            </div>
            <div className="p-4" style={{ background: "var(--ash-3)" }}>
              <div className="font-display text-3xl font-black">
                <CountUp to={stats.totalCount} />
              </div>
              <div
                className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                {t("trophies")}
              </div>
            </div>
            <div className="p-4" style={{ background: "var(--ash-3)" }}>
              <div className="font-display text-3xl font-black">
                <CountUp to={stats.firstPlaceCount} />
              </div>
              <div
                className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.55)" }}
              >
                {t("firstPlace")}
              </div>
            </div>
          </div>
        </div>

        {trophies.length === 0 ? (
          <EmptyTrophies message={t("empty")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {trophies.map((trophy) => (
              <TrophyCard key={trophy.id} trophy={trophy} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyTrophies({ message }: { message: string }) {
  return (
    <div
      className="notch p-10 text-center"
      style={{ background: "var(--ash-1)", border: "1px solid rgba(230,0,19,0.25)" }}
    >
      <p
        className="font-display text-2xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
    </div>
  );
}

function TrophyCard({ trophy, locale }: { trophy: Trophy; locale: Locale }) {
  const isFirst = isFirstPlacement(trophy.placement);
  const year = new Date(trophy.date).getUTCFullYear();
  const titleText = pickTranslation(trophy.title, locale) || trophy.tournament_name;
  const prizeText = trophy.prize_amount
    ? formatPrizeShort(Number(trophy.prize_amount), trophy.prize_currency, locale)
    : "";

  return (
    <div
      className="card-bite notch-sm p-5"
      style={{ background: "var(--ash-1)", minHeight: 180 }}
    >
      <div className="mb-3 flex items-start justify-between">
        <SkullIcon
          size={20}
          color={isFirst ? "#E60013" : "rgba(245,240,232,0.4)"}
        />
        <span
          className="font-mono text-[10px] tracking-[0.25em]"
          style={{ color: "rgba(245,240,232,0.4)" }}
        >
          {year}
        </span>
      </div>
      <div
        className="font-display mb-1 text-3xl font-black italic"
        style={{ color: isFirst ? "var(--hell-red)" : "var(--bone)" }}
      >
        {trophy.placement.toUpperCase()}
      </div>
      <div
        className="glitch-target font-mono text-[10px] leading-relaxed tracking-[0.2em] uppercase"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {titleText}
      </div>
      {prizeText ? (
        <div
          className="mt-3 border-t pt-3 font-mono text-[10px]"
          style={{ borderColor: "rgba(245,240,232,0.08)", color: "var(--ember)" }}
        >
          {prizeText}
        </div>
      ) : null}
    </div>
  );
}
