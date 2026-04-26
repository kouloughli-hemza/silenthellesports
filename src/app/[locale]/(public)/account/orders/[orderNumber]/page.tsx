import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, isLocale, redirect } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { formatPrice, type Order, type OrderItem } from "@/types/domain";
import { formatDateLong, formatTime } from "@/lib/utils/format";
import { WILAYAS } from "@/services/yalidine/wilayas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: `${t("orderNumber")} ${orderNumber} · Silent Hell`,
    robots: { index: false, follow: false },
  };
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface OrderDetailProps {
  params: Promise<{ locale: string; orderNumber: string }>;
}

function wilayaName(code: number, locale: "en" | "ar"): string {
  const w = WILAYAS.find((wil) => wil.code === code);
  if (!w) return String(code);
  return locale === "ar" ? w.name_ar : w.name;
}

export default async function OrderDetailPage({ params }: OrderDetailProps) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect({
      href: { pathname: "/login", query: { next: `/account/orders/${orderNumber}` } },
      locale,
    });
    return null;
  }
  // sessionUser is non-null past this guard; RLS scopes the query below to it.
  void sessionUser;

  // Sanity-check the format before hitting the DB.
  if (!/^SH-\d{4}-\d{4,}$/.test(orderNumber)) notFound();

  const supabase = await createClient();
  // RLS scopes to the current user's orders. Wrong order_number → null.
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) notFound();
  const order = data as unknown as OrderWithItems;

  const t = await getTranslations({ locale, namespace: "account" });
  const isAr = locale === "ar";

  const wilaya = wilayaName(order.shipping_wilaya_code, locale);
  const placedDate = formatDateLong(order.created_at, locale);
  const placedTime = formatTime(order.created_at, locale);

  const guidanceKey:
    | "guidancePending"
    | "guidanceConfirmed"
    | "guidanceShipped"
    | "guidanceDelivered"
    | "guidanceCancelled"
    | "guidanceReturned" =
    order.status === "pending"
      ? "guidancePending"
      : order.status === "confirmed"
        ? "guidanceConfirmed"
        : order.status === "shipped"
          ? "guidanceShipped"
          : order.status === "delivered"
            ? "guidanceDelivered"
            : order.status === "returned"
              ? "guidanceReturned"
              : "guidanceCancelled";

  return (
    <article
      className="grain relative pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
    >
      {/* Hero */}
      <header
        className="pt-28 pb-10 md:pt-32 md:pb-14"
        style={{
          background:
            "linear-gradient(180deg, var(--ash-3) 0%, var(--black) 100%)",
          borderBottom: "1px solid rgba(230,0,19,0.25)",
        }}
      >
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] uppercase interactive"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            <span aria-hidden>{isAr ? "→" : "←"}</span>
            {t("backToAccount")}
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div
                className="font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {t("orderNumber")}
              </div>
              <h1
                className="font-display mt-2 text-3xl leading-[0.95] font-black tracking-tight uppercase italic md:text-5xl break-all"
                style={{ color: "var(--bone)" }}
              >
                {order.order_number}
              </h1>
              <p
                className="mt-3 font-mono text-xs tracking-[0.15em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {t("placedOn")}: {placedDate} · {placedTime}
              </p>
            </div>
            <StatusPill
              status={order.status}
              label={t(`orderStatus.${order.status}`)}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1100px] gap-10 px-6 md:mt-12 md:grid-cols-[1fr_360px] md:px-10">
        {/* MAIN */}
        <div className="space-y-10 min-w-0">
          {/* Items */}
          <section aria-labelledby="items-h">
            <SectionLabel id="items-h" label={t("items")} />
            <ul
              className="notch mt-5 divide-y"
              style={{
                background: "var(--ash-1)",
              }}
            >
              {order.items.length === 0 ? (
                <li
                  className="px-5 py-6 font-mono text-xs uppercase tracking-[0.2em]"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {t("noItems")}
                </li>
              ) : (
                order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    style={{
                      borderColor: "rgba(245,240,232,0.06)",
                    }}
                  >
                    <div className="min-w-0">
                      <div
                        className="font-display text-base font-bold uppercase italic"
                        style={{ color: "var(--bone)" }}
                      >
                        {item.product_name_snapshot}
                      </div>
                      {item.variant_label_snapshot ? (
                        <div
                          className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: "rgba(245,240,232,0.5)" }}
                        >
                          {item.variant_label_snapshot}
                        </div>
                      ) : null}
                      <div
                        className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: "rgba(245,240,232,0.4)" }}
                      >
                        × {item.quantity} ·{" "}
                        {formatPrice(item.unit_price, locale, order.currency)}
                      </div>
                    </div>
                    <div
                      className="font-display text-lg font-black italic"
                      style={{ color: "var(--bone)" }}
                    >
                      {formatPrice(item.line_total, locale, order.currency)}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Shipping */}
          <section aria-labelledby="ship-h">
            <SectionLabel id="ship-h" label={t("shippingTo")} />
            <div
              className="notch mt-5 grid gap-4 p-6"
              style={{ background: "var(--ash-1)" }}
            >
              <div>
                <div
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {order.customer_name}
                </div>
                <div
                  className="mt-1 font-display text-lg font-bold uppercase italic"
                  style={{ color: "var(--bone)" }}
                >
                  {order.shipping_address}
                </div>
                <div
                  className="mt-1 font-mono text-xs tracking-[0.15em] uppercase"
                  style={{ color: "rgba(245,240,232,0.6)" }}
                >
                  {order.shipping_commune_name} · {wilaya}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{
                    background: "var(--ash-3)",
                    color: "var(--bone)",
                    border: "1px solid rgba(245,240,232,0.15)",
                  }}
                >
                  {t("via")}:{" "}
                  {order.is_stopdesk
                    ? t("stopdeskPickup")
                    : t("homeDelivery")}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {order.customer_phone}
                </span>
              </div>
            </div>
          </section>

          {/* Tracking + guidance */}
          {order.yalidine_tracking ? (
            <section aria-labelledby="track-h">
              <SectionLabel id="track-h" label={t("tracking")} />
              <div
                className="notch mt-5 flex flex-wrap items-center justify-between gap-4 p-6"
                style={{ background: "var(--ash-1)" }}
              >
                <div className="min-w-0">
                  <div
                    className="font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {t("trackingNumber")}
                  </div>
                  <div
                    className="mt-1 font-display text-xl font-black uppercase italic break-all"
                    style={{ color: "var(--bone)" }}
                  >
                    {order.yalidine_tracking}
                  </div>
                  {order.yalidine_status ? (
                    <div
                      className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--ember)" }}
                    >
                      {order.yalidine_status}
                    </div>
                  ) : null}
                </div>
                <span
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{
                    background: "var(--ash-3)",
                    color: "rgba(245,240,232,0.5)",
                    border: "1px solid rgba(245,240,232,0.15)",
                    padding: "10px 18px",
                  }}
                  aria-disabled="true"
                  title={t("trackComingSoon")}
                >
                  {t("track")}
                </span>
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="guide-h"
            className="notch p-6"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(255,69,0,0.25)",
            }}
          >
            <div
              id="guide-h"
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--ember)" }}
            >
              {t("statusGuidance")}
            </div>
            <p
              className="mt-2 font-display text-lg font-bold uppercase italic"
              style={{ color: "var(--bone)" }}
            >
              {t(guidanceKey)}
            </p>
            <p
              className="mt-3 font-mono text-[11px] leading-relaxed tracking-[0.1em] uppercase"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              {t("codReminder")}
            </p>
          </section>
        </div>

        {/* TOTALS */}
        <aside className="space-y-4">
          <div
            className="notch p-6"
            style={{ background: "var(--ash-1)" }}
          >
            <SectionLabel label={t("summary")} />
            <dl className="mt-5 space-y-3 font-mono text-xs tracking-[0.1em] uppercase">
              <Row
                label={t("subtotal")}
                value={formatPrice(order.subtotal, locale, order.currency)}
              />
              <Row
                label={t("shippingFee")}
                value={formatPrice(order.shipping_fee, locale, order.currency)}
              />
              <div
                className="my-3 h-px"
                style={{ background: "rgba(230,0,19,0.3)" }}
                aria-hidden
              />
              <div className="flex items-center justify-between gap-3">
                <span
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: "rgba(245,240,232,0.6)" }}
                >
                  {t("total")}
                </span>
                <span
                  className="font-display text-2xl font-black italic"
                  style={{ color: "var(--hell-red)" }}
                >
                  {formatPrice(order.total, locale, order.currency)}
                </span>
              </div>
            </dl>
          </div>

          <Link
            href="/account"
            className="font-mono text-[11px] tracking-[0.25em] uppercase interactive block text-center"
            style={{
              background: "var(--ash-3)",
              color: "var(--bone)",
              border: "1px solid rgba(245,240,232,0.15)",
              padding: "12px 18px",
            }}
          >
            {t("backToAccount")}
          </Link>
        </aside>
      </div>
    </article>
  );
}

function SectionLabel({ id, label }: { id?: string; label: string }) {
  return (
    <div className="flex items-center gap-3" id={id}>
      <div
        className="h-px w-8"
        style={{ background: "var(--hell-red)" }}
        aria-hidden
      />
      <span
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {label}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: "rgba(245,240,232,0.5)" }}>{label}</span>
      <span style={{ color: "var(--bone)" }}>{value}</span>
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: Order["status"];
  label: string;
}) {
  const styleMap: Record<
    Order["status"],
    { background: string; color: string; border?: string }
  > = {
    pending: {
      background: "var(--ash-3)",
      color: "var(--ember)",
      border: "1px solid rgba(255,69,0,0.4)",
    },
    confirmed: { background: "var(--hell-red)", color: "var(--bone)" },
    shipped: { background: "var(--ember)", color: "var(--black)" },
    delivered: {
      background: "var(--ash-3)",
      color: "var(--bone)",
      border: "1px solid rgba(245,240,232,0.4)",
    },
    cancelled: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
    returned: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
  };
  const s = styleMap[status];
  return (
    <span
      className="inline-flex items-center px-4 py-2 font-mono text-[11px] tracking-[0.3em] uppercase whitespace-nowrap"
      style={s}
    >
      {label}
    </span>
  );
}
