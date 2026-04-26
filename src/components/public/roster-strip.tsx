import { getTranslations } from "next-intl/server";
import { PlaceholderImage, SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { getActivePlayers } from "@/lib/data/players";
import { flagEmoji } from "@/lib/utils/format";
import type { Locale, Player, PlayerStats } from "@/types/domain";

interface RosterStripProps {
  locale: Locale;
}

export async function RosterStrip({ locale }: RosterStripProps) {
  const t = await getTranslations({ locale, namespace: "roster" });
  const isAr = locale === "ar";
  const players = await getActivePlayers();

  return (
    <section
      id="roster"
      className="relative py-24 md:py-32"
      style={{ background: "var(--black)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
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
          <Link href="/roster" locale={locale} className="btn-ghost">
            {t("full")}
            <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
          </Link>
        </div>

        {players.length === 0 ? (
          <EmptyState message={t("empty")} />
        ) : (
          <div className="roster-scroll -mx-6 overflow-x-auto px-6 pb-4 md:-mx-10 md:px-10">
            <div className="flex gap-5" style={{ minWidth: "max-content" }}>
              {players.map((player, i) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  index={i}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
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

interface PlayerCardProps {
  player: Player;
  index: number;
  locale: Locale;
}

function readStats(value: Player["stats"]): PlayerStats {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  const stats: PlayerStats = {};
  if (typeof obj.kd === "number") stats.kd = obj.kd;
  else if (typeof obj.kd === "string" && obj.kd.length > 0) {
    const n = Number(obj.kd);
    if (!Number.isNaN(n)) stats.kd = n;
  }
  if (typeof obj.headshot_pct === "number") stats.headshot_pct = obj.headshot_pct;
  else if (typeof obj.headshot_pct === "string" && obj.headshot_pct.length > 0) {
    const n = Number(obj.headshot_pct);
    if (!Number.isNaN(n)) stats.headshot_pct = n;
  }
  return stats;
}

function PlayerCard({ player, index, locale }: PlayerCardProps) {
  const t_kd = "K/D";
  const t_hs = "HS%";
  const stats = readStats(player.stats);
  const flag = flagEmoji(player.country_code);
  const indexLabel = `P${String(index + 1).padStart(2, "0")}`;

  return (
    <Link
      href={`/roster/${encodeURIComponent(player.ign)}`}
      locale={locale}
      className="card-bite notch group flex-shrink-0 focus-visible:outline-none"
      style={{ width: 280, background: "var(--ash-1)", padding: 0, display: "block" }}
      aria-label={player.ign}
    >
      <div className="relative">
        <PlaceholderImage
          label={`PLAYER ${String(index + 1).padStart(2, "0")}`}
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
      </div>
      <div
        className="border-t p-4"
        style={{ borderColor: "rgba(230,0,19,0.25)" }}
      >
        <div className="font-display text-2xl leading-none font-black uppercase italic">
          {player.ign}
        </div>
        <div
          className="mt-1 text-xs"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          {player.real_name ?? "—"}
        </div>
        {(stats.kd != null || stats.headshot_pct != null) && (
          <div
            className="mt-3 grid grid-cols-2 gap-2 border-t pt-3"
            style={{ borderColor: "rgba(245,240,232,0.08)" }}
          >
            <div>
              <div
                className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {t_kd}
              </div>
              <div
                className="stat-number text-lg font-bold"
                style={{ color: "var(--hell-red)" }}
              >
                {stats.kd != null
                  ? new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(stats.kd)
                  : "—"}
              </div>
            </div>
            <div>
              <div
                className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {t_hs}
              </div>
              <div className="stat-number text-lg font-bold">
                {stats.headshot_pct != null ? `${Math.round(stats.headshot_pct)}%` : "—"}
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
