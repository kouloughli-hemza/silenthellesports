import { getNextEvent } from "@/lib/data/events";
import { getRecentTrophies } from "@/lib/data/trophies";
import { pickTranslation, type Locale } from "@/types/domain";
import { relativeUntil } from "@/lib/utils/format";

interface TickerItem {
  tag: string;
  value: string;
  meta: string;
}

interface LiveTickerProps {
  locale: Locale;
}

// Server component — computes ticker items from real data, passes to a tiny
// client wrapper for the marquee.
export async function LiveTicker({ locale }: LiveTickerProps) {
  const [next, recent] = await Promise.all([getNextEvent(), getRecentTrophies(2)]);
  const isAr = locale === "ar";

  const items: TickerItem[] = [];
  if (next) {
    items.push({
      tag: isAr ? "البطولة القادمة" : "NEXT MATCH",
      value: pickTranslation(next.title, locale),
      meta: relativeUntil(next.start_at, locale),
    });
  }
  if (recent[0]) {
    items.push({
      tag: isAr ? "آخر نتيجة" : "LAST RESULT",
      value: `${recent[0].placement} · ${recent[0].tournament_name}`,
      meta: recent[0].prize_amount
        ? `$${recent[0].prize_amount.toLocaleString()}`
        : "—",
    });
  }
  if (recent[1]) {
    items.push({
      tag: isAr ? "ميدالية" : "TROPHY",
      value: recent[1].tournament_name,
      meta: recent[1].placement,
    });
  }
  // Always show streaming + Discord teasers
  items.push({
    tag: isAr ? "ديسكورد" : "DISCORD",
    value: isAr ? "انضم إلى الفريق" : "JOIN THE SQUAD",
    meta: isAr ? "ديسكورد · مباشر" : "OPEN · LIVE",
  });

  if (items.length === 0) return null;

  // Duplicate items for seamless marquee loop
  const all = [...items, ...items];

  return (
    <div
      style={{
        background: "var(--hell-red)",
        borderTop: "1px solid #b8000f",
        borderBottom: "1px solid #b8000f",
        overflow: "hidden",
        position: "relative",
      }}
      aria-label={isAr ? "آخر التحديثات" : "Latest updates"}
    >
      <div className="ticker-track py-2.5">
        {all.map((it, i) => (
          <span key={i} className="ticker-item" style={{ color: "var(--bone)" }}>
            <span style={{ opacity: 0.7, fontWeight: 700 }}>{it.tag}</span>
            <span className="font-display text-base font-black tracking-wide uppercase italic">
              {it.value}
            </span>
            <span style={{ opacity: 0.85 }}>{it.meta}</span>
            <span className="ticker-sep" style={{ background: "var(--bone)" }} />
          </span>
        ))}
      </div>
    </div>
  );
}
