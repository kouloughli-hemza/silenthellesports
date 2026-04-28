import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { getTacticsEnabled, listTacticBoardsAdmin } from "@/lib/admin/data/team";
import { pickTranslation, type Locale } from "@/types/domain";
import { TacticsSectionToggle } from "./section-toggle";

export default async function AdminTacticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [boards, enabled] = await Promise.all([
    listTacticBoardsAdmin(),
    getTacticsEnabled(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// TACTICS"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Tactics{" "}
            <span style={{ color: "rgba(245,240,232,0.4)" }}>({boards.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/tactics/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW BOARD
        </Link>
      </div>

      <div className="notch mb-6 p-4" style={{ background: "var(--ash-1)" }}>
        <TacticsSectionToggle initial={enabled} />
      </div>

      {boards.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No tactic boards yet — show off your signature drop.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}>
                <Th>Order</Th>
                <Th>Map</Th>
                <Th>Title</Th>
                <Th>Rotation</Th>
                <Th>Published</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {boards.map((b) => {
                const title = (b.title ?? {}) as { en?: string; ar?: string };
                const rotationCount = Array.isArray(b.rotation_points)
                  ? b.rotation_points.length
                  : 0;
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <Td>
                      <span className="font-mono text-[11px]">{b.display_order}</span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--ember)" }}
                      >
                        {b.map_name}
                      </span>
                    </Td>
                    <Td>
                      {pickTranslation(title as { en: string; ar: string }, locale as Locale)}
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px]">
                        {rotationCount} pts
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          color: b.is_published
                            ? "var(--hell-red)"
                            : "rgba(245,240,232,0.5)",
                        }}
                      >
                        {b.is_published ? "yes" : "draft"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/tactics/${b.id}/edit` as never}
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
