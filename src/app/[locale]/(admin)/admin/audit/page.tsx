import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { listAuditLog } from "@/lib/admin/data/audit";
import { formatDateLong } from "@/lib/utils/format";
import type { Locale } from "@/types/domain";

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { rows, total } = await listAuditLog({
    page,
    pageSize: 50,
    ...(sp.entity ? { entityType: sp.entity } : {}),
  });

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// AUDIT LOG"}
      </div>
      <h1
        className="font-display mt-1 mb-6 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Audit <span style={{ color: "rgba(245,240,232,0.4)" }}>({total})</span>
      </h1>

      {rows.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No audit entries yet.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ash-3)" }}>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                  <Td>
                    <span className="font-mono text-[11px]">
                      {formatDateLong(r.created_at, locale as Locale)}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{r.actor_email ?? "—"}</span>
                  </Td>
                  <Td>
                    <span
                      className="font-mono text-[11px] tracking-[0.15em] uppercase"
                      style={{ color: "var(--hell-red)" }}
                    >
                      {r.action}
                    </span>
                  </Td>
                  <Td>
                    {r.entity_type}
                    {r.entity_id ? (
                      <span style={{ color: "rgba(245,240,232,0.5)" }}> · {r.entity_id}</span>
                    ) : null}
                  </Td>
                  <Td>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: "rgba(245,240,232,0.5)" }}
                    >
                      {r.ip ?? "—"}
                    </span>
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
