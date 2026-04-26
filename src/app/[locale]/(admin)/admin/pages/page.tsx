import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listPages } from "@/lib/admin/data/pages";
import { pickTranslation, type Locale } from "@/types/domain";

export default async function AdminPagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const pages = await listPages();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// PAGES"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Pages <span style={{ color: "rgba(245,240,232,0.4)" }}>({pages.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/pages/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW PAGE
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No pages yet.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Slug</Th>
                <Th>Title</Th>
                <Th>Published</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => {
                const title = (p.title ?? {}) as { en?: string; ar?: string };
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono">/{p.slug}</span>
                    </Td>
                    <Td>{pickTranslation(title as { en: string; ar: string }, locale as Locale)}</Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: p.is_published ? "var(--ember)" : "rgba(245,240,232,0.4)",
                        }}
                      >
                        {p.is_published ? "LIVE" : "DRAFT"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/pages/${p.id}/edit` as never}
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
