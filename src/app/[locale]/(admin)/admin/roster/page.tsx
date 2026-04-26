import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listPlayers } from "@/lib/admin/data/players";

export default async function AdminRosterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const players = await listPlayers();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// ROSTER"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Roster <span style={{ color: "rgba(245,240,232,0.4)" }}>({players.length})</span>
          </h1>
        </div>
        <Link
          href={"/admin/roster/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + NEW PLAYER
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No players yet. Add the first one.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "var(--ash-3)",
                  borderBottom: "1px solid rgba(230,0,19,0.25)",
                }}
              >
                <Th>#</Th>
                <Th>IGN</Th>
                <Th>Real name</Th>
                <Th>Role</Th>
                <Th>Country</Th>
                <Th>Active</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                  <Td>
                    <span className="font-mono text-[11px]">{p.display_order}</span>
                  </Td>
                  <Td>
                    <span className="font-display italic font-bold">{p.ign}</span>
                  </Td>
                  <Td>{p.real_name ?? "—"}</Td>
                  <Td>
                    <span
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--ember)" }}
                    >
                      {p.role}
                    </span>
                  </Td>
                  <Td>{p.country_code ?? "—"}</Td>
                  <Td>
                    <ActiveDot active={p.is_active} />
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/roster/${p.id}/edit` as never}
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--hell-red)" }}
                    >
                      EDIT →
                    </Link>
                  </Td>
                </tr>
              ))}
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

function ActiveDot({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: active ? "var(--hell-red)" : "rgba(245,240,232,0.25)",
        boxShadow: active ? "0 0 8px var(--hell-red)" : "none",
      }}
      aria-label={active ? "active" : "inactive"}
    />
  );
}
