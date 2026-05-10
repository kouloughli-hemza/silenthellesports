import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { findDuplicateOrdersForOrder, getOrderByNumberAdmin } from "@/lib/admin/data/orders";
import { formatPrice, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";
import {
  cancelOrderAction,
  confirmOrderAction,
  createShipmentAction,
  markDeliveredAction,
} from "../actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const order = await getOrderByNumberAdmin(orderNumber);
  if (!order) notFound();

  const tLocale = locale as Locale;
  const duplicateOrders = await findDuplicateOrdersForOrder(order.id);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        ← BACK TO ORDERS
      </Link>

      <div className="mt-4 mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// ORDER ${order.order_number}`}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            {order.customer_name}
          </h1>
          <p
            className="mt-1 font-mono text-xs"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            {order.customer_phone} · {formatDateLong(order.created_at, tLocale)}
          </p>
        </div>
        <span
          className="font-mono text-xs tracking-[0.2em] uppercase"
          style={{
            background: "var(--hell-red)",
            color: "var(--bone)",
            padding: "6px 14px",
          }}
        >
          {order.status}
        </span>
      </div>

      {duplicateOrders.length > 0 ? (
        <section
          className="notch mb-6 p-5"
          style={{
            background: "rgba(230,0,19,0.08)",
            border: "1px solid var(--hell-red)",
          }}
        >
          <div
            className="mb-2 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// DUPLICATE PRODUCTS — ${duplicateOrders.length} OTHER ORDER${duplicateOrders.length === 1 ? "" : "S"}`}
          </div>
          <p
            className="mb-4 max-w-3xl font-mono text-[11px] leading-relaxed"
            style={{ color: "rgba(245,240,232,0.75)" }}
          >
            This customer (matched by {order.user_id ? "account" : "phone"}) has
            other orders containing the same product(s) as this one. Common with
            free / promo items — review and cancel any duplicates you don&apos;t
            want to fulfill.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(230,0,19,0.35)" }}>
                  <th
                    className="px-2 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(245,240,232,0.6)" }}
                  >
                    Order #
                  </th>
                  <th
                    className="px-2 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(245,240,232,0.6)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-2 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(245,240,232,0.6)" }}
                  >
                    Created
                  </th>
                  <th
                    className="px-2 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(245,240,232,0.6)" }}
                  >
                    Total
                  </th>
                  <th
                    className="px-2 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(245,240,232,0.6)" }}
                  >
                    Same product(s)
                  </th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {duplicateOrders.map((d) => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                  >
                    <td className="px-2 py-2 font-mono text-xs">
                      {d.order_number}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{
                          background: "rgba(10,10,10,0.5)",
                          color: "var(--bone)",
                          border: "1px solid rgba(245,240,232,0.2)",
                          padding: "2px 8px",
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-[11px]">
                      {formatDateLong(d.created_at, tLocale)}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {formatPrice(Number(d.total), tLocale, d.currency)}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {d.sharedProductNames.length > 0
                        ? d.sharedProductNames.join(", ")
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Link
                        href={`/admin/orders/${d.order_number}` as never}
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--hell-red)" }}
                      >
                        OPEN →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="notch p-6" style={{ background: "var(--ash-1)" }}>
          <div
            className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {`// ITEMS (${order.items.length})`}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {order.items.map((it) => (
                <tr
                  key={it.id}
                  style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                >
                  <td className="py-2">
                    <div>{it.product_name_snapshot}</div>
                    {it.variant_label_snapshot ? (
                      <div
                        className="font-mono text-[10px]"
                        style={{ color: "rgba(245,240,232,0.5)" }}
                      >
                        {it.variant_label_snapshot}
                      </div>
                    ) : null}
                    {it.custom_name ? (
                      <div
                        className="font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "var(--ember)" }}
                      >
                        {`// PRINT NAME · ${it.custom_name}`}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 text-right font-mono text-xs">×{it.quantity}</td>
                  <td className="py-2 text-right font-mono text-xs">
                    {formatPrice(Number(it.line_total), tLocale, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr style={{ border: "none", borderTop: "1px solid rgba(245,240,232,0.1)", margin: "16px 0" }} />
          <div className="space-y-1 text-sm">
            <Row label="Subtotal" value={formatPrice(Number(order.subtotal), tLocale, order.currency)} />
            <Row
              label="Shipping"
              value={formatPrice(Number(order.shipping_fee), tLocale, order.currency)}
            />
            <Row
              label="Total"
              value={formatPrice(Number(order.total), tLocale, order.currency)}
              big
            />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="notch p-6" style={{ background: "var(--ash-1)" }}>
            <div
              className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {"// SHIPPING"}
            </div>
            <div className="text-sm">
              <div>{order.customer_name}</div>
              <div>{order.customer_phone}</div>
              {order.customer_email ? <div>{order.customer_email}</div> : null}
              <div className="mt-2">{order.shipping_address}</div>
              <div>
                {order.shipping_commune_name}, Wilaya {order.shipping_wilaya_code}
              </div>
              <div
                className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--ember)" }}
              >
                {order.is_stopdesk ? "STOPDESK PICKUP" : "HOME DELIVERY"}
              </div>
            </div>

            {order.yalidine_tracking ? (
              <div
                className="mt-4 border-t pt-4"
                style={{ borderColor: "rgba(245,240,232,0.1)" }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,240,232,0.55)" }}
                >
                  Tracking
                </div>
                <div className="mt-1 font-mono text-sm" style={{ color: "var(--hell-red)" }}>
                  {order.yalidine_tracking}
                </div>
                {order.yalidine_status ? (
                  <div
                    className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {order.yalidine_status}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="notch p-6" style={{ background: "var(--ash-1)" }}>
            <div
              className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {"// ACTIONS"}
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status === "pending" ? (
                <form
                  action={async () => {
                    "use server";
                    await confirmOrderAction(order.order_number);
                  }}
                >
                  <button
                    type="submit"
                    className="btn-hell"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    CONFIRM ORDER
                  </button>
                </form>
              ) : null}
              {order.status === "confirmed" && !order.yalidine_tracking ? (
                <form
                  action={async () => {
                    "use server";
                    await createShipmentAction(order.order_number);
                  }}
                >
                  <button
                    type="submit"
                    className="btn-hell"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    CREATE SHIPMENT
                  </button>
                </form>
              ) : null}
              {order.status === "shipped" ? (
                <form
                  action={async () => {
                    "use server";
                    await markDeliveredAction(order.order_number);
                  }}
                >
                  <button
                    type="submit"
                    className="btn-hell"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    MARK DELIVERED
                  </button>
                </form>
              ) : null}
              {!["delivered", "cancelled", "returned"].includes(order.status) ? (
                <form
                  action={async (formData) => {
                    "use server";
                    const reason = String(formData.get("reason") ?? "Cancelled by admin");
                    await cancelOrderAction(order.order_number, reason);
                  }}
                  className="flex flex-col gap-2 w-full"
                >
                  <input
                    name="reason"
                    placeholder="Reason (optional)"
                    className="field"
                  />
                  <button
                    type="submit"
                    className="btn-ghost"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    CANCEL ORDER
                  </button>
                </form>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span
        className="font-mono text-xs tracking-[0.15em] uppercase"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        {label}
      </span>
      <span
        className={big ? "font-display text-xl font-black" : "font-mono text-sm"}
        style={{ color: big ? "var(--hell-red)" : "var(--bone)" }}
      >
        {value}
      </span>
    </div>
  );
}
