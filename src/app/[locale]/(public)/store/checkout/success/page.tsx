import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/brand";
import { Link, isLocale } from "@/lib/i18n/routing";
import { getOrderByNumber } from "@/lib/data/orders";
import { getSiteConfig } from "@/lib/site-config";
import { formatPrice } from "@/types/domain";

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}

export async function generateMetadata({ params }: SuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("success.metaTitle"),
    description: t("success.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const sp = await searchParams;
  const orderParam = typeof sp.order === "string" ? sp.order : "";
  const t = await getTranslations({ locale, namespace: "checkout" });
  const isAr = locale === "ar";

  // Look up the order via the admin client. If we can't find it, render a
  // generic confirmation rather than leaking whether the order exists.
  const order = orderParam ? await getOrderByNumber(orderParam) : null;
  const discordUrl = await getSiteConfig("socials.discord_url");

  return (
    <section
      className="grain relative pt-28 pb-20 md:pt-36 md:pb-28"
      style={{ background: "var(--ash-3)", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-[820px] px-5 md:px-10">
        <SectionHeading
          label={t("success.label")}
          title={
            <>
              {t("success.t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("success.t2")}</span>
            </>
          }
        />

        <div
          className="notch mt-10 flex flex-col gap-5 p-6 md:p-10"
          style={{ background: "var(--ash-1)", border: "1px solid rgba(230,0,19,0.3)" }}
        >
          <div
            className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {t("success.orderRef")}
          </div>
          <div
            className="font-display text-3xl font-black uppercase italic md:text-5xl"
            style={{ color: "var(--bone)", letterSpacing: "0.04em" }}
          >
            {order ? order.order_number : t("success.pending")}
          </div>

          <p
            className="text-sm leading-relaxed md:text-base"
            style={{ color: "rgba(245,240,232,0.85)" }}
          >
            {t("success.body")}
          </p>

          {order ? (
            <div className="flex flex-col gap-2">
              <SummaryRow
                label={t("cart.subtotal")}
                value={formatPrice(order.subtotal, locale)}
              />
              <SummaryRow
                label={t("cart.shipping")}
                value={formatPrice(order.shipping_fee, locale)}
              />
              <div
                className="-mx-1 mt-1 border-t pt-3"
                style={{ borderColor: "rgba(245,240,232,0.1)" }}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className="font-display text-base font-black uppercase italic"
                    style={{ color: "var(--bone)" }}
                  >
                    {t("cart.total")}
                  </span>
                  <span
                    className="font-display text-2xl font-black italic md:text-3xl"
                    style={{ color: "var(--hell-red)" }}
                  >
                    {formatPrice(order.total, locale)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="font-mono mt-2 text-[10px] leading-relaxed tracking-[0.2em] uppercase"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {t("codNote")}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/store" className="btn-ghost">
              {t("success.backToStore")}
              <span aria-hidden style={{ color: "var(--hell-red)" }}>
                {isAr ? "←" : "→"}
              </span>
            </Link>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hell"
            >
              {t("success.joinDiscord")}
              <span aria-hidden>{isAr ? "←" : "→"}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className="font-mono text-xs tracking-[0.2em] uppercase"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-sm tabular-nums"
        style={{ color: "var(--bone)" }}
      >
        {value}
      </span>
    </div>
  );
}
