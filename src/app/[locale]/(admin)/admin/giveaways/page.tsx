import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listGiveawaysAdmin } from "@/lib/admin/data/giveaways";
import { pickTranslation, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

const STATUS_COLOR: Record<string, string> = {
  upcoming: "rgba(245,240,232,0.6)",
  active: "var(--ember)",
  drawing: "var(--hell-red)",
  completed: "rgba(245,240,232,0.4)",
};

export default async function AdminGiveawaysPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const giveaways = await listGiveawaysAdmin();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// GIVEAWAYS"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Giveaways <span style={{ color: "rgba(245,240,232,0.4)" }}>({giveaways.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/giveaways/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW GIVEAWAY
        </Link>
      </div>

      {giveaways.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No giveaways yet.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Slug</Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Drop</Th>
                <Th>Ends</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {giveaways.map((g) => {
                const title = (g.title ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={g.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">{g.slug}</span>
                    </Td>
                    <Td>{pickTranslation(title as { en: string; ar: string }, locale as Locale)}</Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: STATUS_COLOR[g.status] ?? "var(--bone)",
                          border: `1px solid ${STATUS_COLOR[g.status] ?? "var(--bone)"}`,
                          padding: "2px 8px",
                        }}
                      >
                        {g.status}
                      </span>
                    </Td>
                    <Td>{g.drop_number ?? "—"}</Td>
                    <Td>
                      <span className="font-mono text-[11px]">
                        {formatDateLong(g.ends_at, locale as Locale)}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/giveaways/${g.id}/edit` as never}
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
