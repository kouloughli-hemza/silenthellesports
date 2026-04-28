import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listStatsAdmin } from "@/lib/admin/data/team";
import { pickTranslation, type Locale } from "@/types/domain";

export default async function AdminStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const stats = await listStatsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// STATS WALL"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Stats <span style={{ color: "rgba(245,240,232,0.4)" }}>({stats.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/stats/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW STAT
        </Link>
      </div>

      {stats.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No stats yet — add your flex numbers.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Order</Th>
                <Th>Key</Th>
                <Th>Label</Th>
                <Th>Value</Th>
                <Th>Published</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const label = (s.label ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">{s.display_order}</span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--ember)" }}
                      >
                        {s.key}
                      </span>
                    </Td>
                    <Td>
                      {pickTranslation(label as { en: string; ar: string }, locale as Locale)}
                    </Td>
                    <Td>
                      <span className="font-display font-bold italic">
                        {Number(s.value).toLocaleString()}
                        {s.suffix ?? ""}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: s.is_published
                            ? "var(--hell-red)"
                            : "rgba(245,240,232,0.5)",
                        }}
                      >
                        {s.is_published ? "yes" : "draft"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/stats/${s.id}/edit` as never}
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
