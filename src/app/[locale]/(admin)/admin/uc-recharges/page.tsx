import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import {
  listUcRequests,
  UC_REQUEST_STATUSES,
  type UcRequestStatus,
} from "@/lib/admin/data/uc-requests";
import { formatPrice, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

const STATUS_COLOR: Record<UcRequestStatus, string> = {
  pending: "var(--ember)",
  payment_received: "var(--bone)",
  delivered: "rgba(245,240,232,0.5)",
  rejected: "var(--hell-red)",
  cancelled: "rgba(245,240,232,0.4)",
};

interface SP {
  status?: string;
  q?: string;
  page?: string;
}

export default async function AdminUcRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const status = UC_REQUEST_STATUSES.includes(sp.status as UcRequestStatus)
    ? (sp.status as UcRequestStatus)
    : undefined;

  const { rows, total } = await listUcRequests({
    page,
    pageSize: 25,
    ...(status ? { status } : {}),
    ...(sp.q ? { q: sp.q } : {}),
  });

  const pageCount = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <div className="mb-6">
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {"// UC RECHARGES"}
        </div>
        <h1
          className="font-display mt-1 text-3xl font-black uppercase italic"
          style={{ color: "var(--bone)" }}
        >
          UC Recharge Requests{" "}
          <span style={{ color: "rgba(245,240,232,0.4)" }}>({total})</span>
        </h1>
      </div>

      <form
        method="get"
        className="mb-4 flex flex-wrap gap-2"
        style={{ background: "var(--ash-1)", padding: "8px" }}
      >
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Request #, PUBG ID, phone, transfer code"
          className="field flex-1 min-w-[240px]"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="field"
          style={{ flex: "0 0 180px" }}
        >
          <option value="">All statuses</option>
          {UC_REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="btn-hell"
          style={{ padding: "10px 20px", fontSize: 12 }}
        >
          Filter
        </button>
        <Link
          href={"/admin/uc-recharges" as never}
          className="btn-ghost"
          style={{ padding: "10px 20px", fontSize: 12 }}
        >
          Clear
        </Link>
      </form>

      {rows.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No requests match.
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
                <Th>Request #</Th>
                <Th>UC</Th>
                <Th>Price</Th>
                <Th>PUBG</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                >
                  <Td>
                    <span className="font-mono">{r.request_number}</span>
                  </Td>
                  <Td>
                    <span className="font-mono">
                      {r.uc_amount_snapshot}
                      {r.bonus_uc_snapshot > 0 ? ` + ${r.bonus_uc_snapshot}` : ""}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">
                      {formatPrice(Number(r.price_dzd_snapshot), locale as Locale, "DZD")}
                    </span>
                  </Td>
                  <Td>
                    <div className="font-mono text-[11px]">{r.ign}</div>
                    <div
                      className="font-mono text-[10px]"
                      style={{ color: "rgba(245,240,232,0.5)" }}
                    >
                      ID {r.pubg_id}
                    </div>
                  </Td>
                  <Td>
                    <span
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--ember)" }}
                    >
                      {r.payment_method}
                    </span>
                    {r.transfer_code ? (
                      <div
                        className="font-mono text-[10px]"
                        style={{ color: "rgba(245,240,232,0.5)" }}
                      >
                        {r.transfer_code}
                      </div>
                    ) : null}
                  </Td>
                  <Td>
                    <StatusPill status={r.status} />
                  </Td>
                  <Td>
                    <span className="font-mono text-[11px]">
                      {formatDateLong(r.created_at, locale as Locale)}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/uc-recharges/${r.request_number}` as never}
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--hell-red)" }}
                    >
                      VIEW →
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{
                pathname: "/admin/uc-recharges",
                query: {
                  ...(status ? { status } : {}),
                  ...(sp.q ? { q: sp.q } : {}),
                  page: String(p),
                },
              } as never}
              className="font-mono text-[11px] tracking-[0.15em] uppercase"
              style={{
                background: p === page ? "var(--hell-red)" : "var(--ash-1)",
                color: "var(--bone)",
                padding: "6px 12px",
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
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
function StatusPill({ status }: { status: UcRequestStatus }) {
  return (
    <span
      className="font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{
        background: "rgba(10,10,10,0.5)",
        color: STATUS_COLOR[status],
        border: `1px solid ${STATUS_COLOR[status]}`,
        padding: "2px 8px",
      }}
    >
      {status}
    </span>
  );
}
