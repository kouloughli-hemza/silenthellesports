import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getEventByIdAdmin, listSignupsForEvent } from "@/lib/admin/data/events";
import { EventForm } from "../../event-form";
import type { EventInput } from "../../actions";
import { formatDateLong } from "@/lib/utils/format";
import type { Locale } from "@/types/domain";
import { SignupsTable, type SignupRow } from "./signups-table";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const event = await getEventByIdAdmin(id);
  if (!event) notFound();

  const signups = await listSignupsForEvent(id);
  const title = (event.title ?? {}) as { en?: string; ar?: string };
  const description = (event.description ?? {}) as { en?: string; ar?: string };
  // Older events may have rules stored as a single bilingual object ({en, ar})
  // or as the table's default ({"en":"","ar":""}). Normalize to the array shape
  // the form expects.
  const rulesRaw = Array.isArray(event.rules) ? event.rules : [];
  const rules = (rulesRaw as Array<{ en?: string; ar?: string }>).map((r) => ({
    en: r.en ?? "",
    ar: r.ar ?? "",
  }));

  // Maps may be stored in the new array column, or only in the legacy `map` text
  // (older events). Normalize so the form gets an array either way.
  const mapsRaw = (event as { maps?: unknown }).maps;
  const maps: string[] = Array.isArray(mapsRaw)
    ? (mapsRaw as unknown[])
        .map((m) => (typeof m === "string" ? m.trim() : ""))
        .filter((s) => s.length > 0)
    : event.map && event.map.trim().length > 0
      ? [event.map.trim()]
      : [];

  const initial: EventInput = {
    slug: event.slug,
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    mode: event.mode,
    map: event.map,
    maps,
    prize_pool: event.prize_pool,
    prize_currency: event.prize_currency,
    entry_fee: event.entry_fee,
    capacity: event.capacity,
    start_at: event.start_at,
    registration_closes_at: event.registration_closes_at,
    status: event.status,
    cover_image_url: event.cover_image_url,
    rules,
    tag: event.tag,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// EVENTS / ${event.slug.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit {title.en || event.slug}
      </h1>

      <EventForm mode="edit" id={event.id} locale={locale} initial={initial} />

      <SignupsTable
        signups={signups.map(
          (s): SignupRow => ({
            id: s.id,
            confirmation_code: s.confirmation_code,
            ign: s.ign,
            pubg_uid: s.pubg_uid,
            contact_phone: s.contact_phone,
            discord_tag: s.discord_tag,
            payment_status: s.payment_status as SignupRow["payment_status"],
            status: s.status as SignupRow["status"],
            created_at_label: formatDateLong(s.created_at, locale as Locale),
            squad_members: Array.isArray(s.squad_members)
              ? (s.squad_members as Array<{ ign?: string; pubg_uid?: string }>)
                  .map((m) => ({
                    ign: typeof m?.ign === "string" ? m.ign : "",
                    pubg_uid: typeof m?.pubg_uid === "string" ? m.pubg_uid : "",
                  }))
              : [],
          }),
        )}
        capacity={event.capacity}
      />
    </div>
  );
}
