import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listEventsAdmin, EVENT_STATUSES, type EventStatus } from "@/lib/admin/data/events";
import { formatPrice, pickTranslation, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

const STATUS_COLOR: Record<string, string> = {
  upcoming: "rgba(245,240,232,0.6)",
  open: "var(--ember)",
  closed: "rgba(245,240,232,0.4)",
  live: "var(--hell-red)",
  completed: "rgba(245,240,232,0.4)",
  cancelled: "rgba(245,240,232,0.3)",
};

export default async function AdminEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;

  const status = EVENT_STATUSES.includes(sp.status as EventStatus)
    ? (sp.status as EventStatus)
    : undefined;
  const events = await listEventsAdmin(status ? { status } : {});

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// EVENTS"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Events <span style={{ color: "rgba(245,240,232,0.4)" }}>({events.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/events/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW EVENT
        </Link>
      </div>

      <form
        method="get"
        className="mb-4 flex flex-wrap gap-2"
        style={{ background: "var(--ash-1)", padding: 8 }}
      >
        <select name="status" defaultValue={status ?? ""} className="field" style={{ flex: "0 0 200px" }}>
          <option value="">All statuses</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-hell" style={{ padding: "10px 20px", fontSize: 12 }}>
          Filter
        </button>
        <Link href="/admin/events" className="btn-ghost" style={{ padding: "10px 20px", fontSize: 12 }}>
          Clear
        </Link>
      </form>

      {events.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No events match.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Slug</Th>
                <Th>Title</Th>
                <Th>Mode</Th>
                <Th>Prize</Th>
                <Th>Status</Th>
                <Th>Start</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const title = (e.title ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">{e.slug}</span>
                    </Td>
                    <Td>{pickTranslation(title as { en: string; ar: string }, locale as Locale)}</Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--ember)" }}
                      >
                        {e.mode}
                      </span>
                    </Td>
                    <Td>{formatPrice(e.prize_pool, locale as Locale, e.prize_currency)}</Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: STATUS_COLOR[e.status] ?? "var(--bone)",
                          border: `1px solid ${STATUS_COLOR[e.status] ?? "var(--bone)"}`,
                          padding: "2px 8px",
                        }}
                      >
                        {e.status}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px]">
                        {formatDateLong(e.start_at, locale as Locale)}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/events/${e.id}/edit` as never}
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--hell-red)" }}
                      >
                        EDIT →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 align-top">{children}</td>;
}
