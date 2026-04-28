import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listMilestonesAdmin } from "@/lib/admin/data/team";
import { pickTranslation, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

export default async function AdminChroniclePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const milestones = await listMilestonesAdmin();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// CHRONICLE"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Chronicle{" "}
            <span style={{ color: "rgba(245,240,232,0.4)" }}>({milestones.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/chronicle/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW ENTRY
        </Link>
      </div>

      {milestones.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No chronicle entries yet — start the team&apos;s story.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Title</Th>
                <Th>Published</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const title = (m.title ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">
                        {formatDateLong(m.occurred_on, locale as Locale)}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--ember)" }}
                      >
                        {m.category.replace("_", " ")}
                      </span>
                    </Td>
                    <Td>
                      {pickTranslation(title as { en: string; ar: string }, locale as Locale)}
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: m.is_published
                            ? "var(--hell-red)"
                            : "rgba(245,240,232,0.5)",
                        }}
                      >
                        {m.is_published ? "yes" : "draft"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/chronicle/${m.id}/edit` as never}
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
