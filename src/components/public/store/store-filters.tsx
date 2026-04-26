import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { flagEmoji } from "@/lib/utils/format";
import type { Locale, Player } from "@/types/domain";

const CATEGORY_KEYS = [
  "tee",
  "hoodie",
  "jersey",
  "mousepad",
  "cap",
  "sticker",
  "lanyard",
  "other",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface StoreFiltersProps {
  locale: Locale;
  players: Player[];
  activeCategory?: string | undefined;
  activePlayerId?: string | undefined;
}

const MAX_VISIBLE_PLAYERS = 8;

export async function StoreFilters({
  locale,
  players,
  activeCategory,
  activePlayerId,
}: StoreFiltersProps) {
  const t = await getTranslations({ locale, namespace: "store" });
  const hasFilter = Boolean(activeCategory) || Boolean(activePlayerId);

  return (
    <div
      className="notch mb-10 p-5"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.18)",
      }}
    >
      {/* Category row */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {t("category")}
        </span>
        <FilterChip
          label={t("filters.all")}
          href={buildHref(undefined, activePlayerId)}
          active={!activeCategory}
        />
        {CATEGORY_KEYS.map((key) => (
          <FilterChip
            key={key}
            label={t(`filters.${key}`)}
            href={buildHref(key, activePlayerId)}
            active={activeCategory === key}
          />
        ))}
      </div>

      {/* Worn-by row */}
      {players.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "var(--ember)" }}
          >
            {t("wornByFilter")}
          </span>
          <FilterChip
            label={t("noPlayer")}
            href={buildHref(activeCategory, undefined)}
            active={!activePlayerId}
          />
          <div
            className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {players.slice(0, MAX_VISIBLE_PLAYERS).map((player) => (
              <PlayerChip
                key={player.id}
                player={player}
                href={buildHref(activeCategory, player.id)}
                active={activePlayerId === player.id}
              />
            ))}
            {players.length > MAX_VISIBLE_PLAYERS ? (
              <span
                className="flex flex-shrink-0 items-center px-2 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.4)" }}
              >
                {t("morePlayers", {
                  count: players.length - MAX_VISIBLE_PLAYERS,
                })}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasFilter ? (
        <div className="mt-4">
          <Link
            href="/store"
            locale={locale}
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
            style={{ color: "var(--hell-red)" }}
          >
            <span>×</span>
            <span>{t("clearFilters")}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  href: string;
  active: boolean;
}

function FilterChip({ label, href, active }: FilterChipProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
      style={{
        background: active ? "var(--hell-red)" : "var(--ash-3)",
        color: active ? "var(--bone)" : "rgba(245,240,232,0.7)",
        border: "1px solid " + (active ? "var(--hell-red)" : "rgba(245,240,232,0.08)"),
      }}
      aria-pressed={active}
    >
      {label}
    </Link>
  );
}

interface PlayerChipProps {
  player: Player;
  href: string;
  active: boolean;
}

function PlayerChip({ player, href, active }: PlayerChipProps) {
  return (
    <Link
      href={href}
      className="inline-flex flex-shrink-0 items-center gap-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors whitespace-nowrap"
      style={{
        background: active ? "var(--hell-red)" : "var(--ash-3)",
        color: active ? "var(--bone)" : "rgba(245,240,232,0.7)",
        border: "1px solid " + (active ? "var(--hell-red)" : "rgba(245,240,232,0.08)"),
      }}
      aria-pressed={active}
    >
      <span aria-hidden>{flagEmoji(player.country_code)}</span>
      <span>{player.ign}</span>
    </Link>
  );
}

function buildHref(category: string | undefined, playerId: string | undefined): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (playerId) params.set("player", playerId);
  const qs = params.toString();
  return qs ? `/store?${qs}` : "/store";
}

export function isCategoryKey(value: string | undefined): value is CategoryKey {
  if (!value) return false;
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}
