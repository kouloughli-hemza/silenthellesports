import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { listOrders, ORDER_STATUSES, type OrderStatus } from "@/lib/admin/data/orders";
import { formatPrice, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "var(--ember)",
  confirmed: "var(--bone)",
  shipped: "var(--hell-red)",
  delivered: "rgba(245,240,232,0.5)",
  cancelled: "rgba(245,240,232,0.4)",
  returned: "rgba(245,240,232,0.4)",
};

interface SP {
  status?: string;
  q?: string;
  page?: string;
}

export default async function AdminOrdersPage({
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
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus)
    ? (sp.status as OrderStatus)
    : undefined;

  const { rows, total } = await listOrders({
    page,
    pageSize: 25,
    sort: "created_at",
    dir: "desc",
    ...(status ? { status } : {}),
    ...(sp.q ? { q: sp.q } : {}),
  });

  const pageCount = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// ORDERS"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Orders <span style={{ color: "rgba(245,240,232,0.4)" }}>({total})</span>
          </h1>
        </div>
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
          placeholder="Order # or phone"
          className="field flex-1 min-w-[200px]"
        />
        <select name="status" defaultValue={status ?? ""} className="field" style={{ flex: "0 0 160px" }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-hell" style={{ padding: "10px 20px", fontSize: 12 }}>
          Filter
        </button>
        <Link
          href="/admin/orders"
          className="btn-ghost"
          style={{ padding: "10px 20px", fontSize: 12 }}
        >
          Clear
        </Link>
      </form>

      {rows.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No orders match.
          </p>
        </div>
      ) : (
        <div className="notch overflow-x-auto" style={{ background: "var(--ash-1)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ background: "var(--ash-3)", borderBottom: "1px solid rgba(230,0,19,0.25)" }}
              >
                <Th>Order #</Th>
                <Th>Customer</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                >
                  <Td>
                    <span className="font-mono">{o.order_number}</span>
                  </Td>
                  <Td>
                    <div>{o.customer_name}</div>
                    <div
                      className="font-mono text-[10px]"
                      style={{ color: "rgba(245,240,232,0.5)" }}
                    >
                      {o.customer_phone}
                    </div>
                  </Td>
                  <Td>{formatPrice(Number(o.total), locale as Locale, o.currency)}</Td>
                  <Td>
                    <StatusPill status={o.status} />
                  </Td>
                  <Td>
                    <span className="font-mono text-[11px]">
                      {formatDateLong(o.created_at, locale as Locale)}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/orders/${o.order_number}` as never}
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
                pathname: "/admin/orders",
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

function StatusPill({ status }: { status: OrderStatus }) {
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
