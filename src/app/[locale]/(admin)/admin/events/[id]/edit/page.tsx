import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getEventByIdAdmin, listSignupsForEvent } from "@/lib/admin/data/events";
import { EventForm } from "../../event-form";
import type { EventInput } from "../../actions";
import { formatDateLong } from "@/lib/utils/format";
import type { Locale } from "@/types/domain";

const PAYMENT_COLOR: Record<string, string> = {
  pending: "var(--ember)",
  paid: "var(--hell-red)",
  waived: "rgba(245,240,232,0.6)",
  refunded: "rgba(245,240,232,0.4)",
};

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
  const rulesRaw = (event.rules ?? []) as Array<{ en?: string; ar?: string }>;
  const rules = rulesRaw.map((r) => ({ en: r.en ?? "", ar: r.ar ?? "" }));

  const initial: EventInput = {
    slug: event.slug,
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    mode: event.mode,
    map: event.map,
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

      <section className="notch mt-8 p-5" style={{ background: "var(--ash-1)" }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// SIGNUPS (${signups.length} / ${event.capacity})`}
          </div>
        </div>
        {signups.length === 0 ? (
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No signups yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(245,240,232,0.1)" }}>
                  <Th>Code</Th>
                  <Th>IGN</Th>
                  <Th>Phone</Th>
                  <Th>Discord</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {signups.slice(0, 200).map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <td className="px-3 py-2 font-mono text-[11px]">{s.confirmation_code}</td>
                    <td className="px-3 py-2 font-display italic font-bold">{s.ign}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.contact_phone}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.discord_tag}</td>
                    <td className="px-3 py-2">
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: PAYMENT_COLOR[s.payment_status] ?? "var(--bone)" }}
                      >
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "rgba(245,240,232,0.7)" }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {formatDateLong(s.created_at, locale as Locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {signups.length > 200 ? (
              <p className="mt-3 font-mono text-[10px]" style={{ color: "rgba(245,240,232,0.5)" }}>
                Showing 200 of {signups.length} signups.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{ color: "rgba(245,240,232,0.55)" }}
    >
      {children}
    </th>
  );
}
