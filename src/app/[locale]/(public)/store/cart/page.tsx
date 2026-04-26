import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/brand";
import { CartLineRow } from "@/components/public/store/cart-line-row";
import { Link, isLocale } from "@/lib/i18n/routing";
import { readDetailedCart } from "@/lib/cart/detail";
import { formatPrice, pickTranslation } from "@/types/domain";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("cart.metaTitle"),
    description: t("cart.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "checkout" });
  const tStore = await getTranslations({ locale, namespace: "store" });
  const isAr = locale === "ar";

  const detailed = await readDetailedCart();
  const subtotal = detailed.subtotal;

  return (
    <section
      className="grain relative pt-28 pb-20 md:pt-36 md:pb-28"
      style={{ background: "var(--ash-3)", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-[1100px] px-5 md:px-10">
        <SectionHeading
          label={t("cart.label", { count: detailed.itemCount })}
          title={
            <>
              {t("cart.t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("cart.t2")}</span>
            </>
          }
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-3">
            {detailed.lines.length === 0 ? (
              <EmptyCart
                title={t("cart.empty")}
                sub={t("cart.emptySub")}
                cta={tStore("browse")}
                arrow={isAr ? "←" : "→"}
              />
            ) : (
              detailed.lines.map((dl) => {
                const name =
                  pickTranslation(dl.product.name, locale) || dl.product.slug.toUpperCase();
                const imageUrl = dl.product.images[0] ?? null;
                const lowStockLabel =
                  dl.available > 0 && dl.available <= 5
                    ? tStore("stockLast", { count: dl.available })
                    : null;
                return (
                  <CartLineRow
                    key={`${dl.line.productId}:${dl.line.variantId ?? "none"}`}
                    productId={dl.line.productId}
                    variantId={dl.line.variantId}
                    productName={name}
                    variantLabel={dl.variantLabel}
                    unitPriceLabel={formatPrice(dl.unitPrice, locale)}
                    lineTotalLabel={formatPrice(dl.lineTotal, locale)}
                    imageUrl={imageUrl}
                    quantity={dl.line.quantity}
                    available={dl.available}
                    outOfStock={dl.outOfStock}
                    lowStockLabel={lowStockLabel}
                    isAr={isAr}
                    hrefDetail={`/${locale}/store/${dl.product.slug}`}
                    labels={{
                      qty: t("fields.qty"),
                      remove: t("cart.remove"),
                      decrement: t("cart.decrement"),
                      increment: t("cart.increment"),
                      oosInline: t("errors.oosVariant"),
                    }}
                  />
                );
              })
            )}
          </div>

          <aside
            className="notch flex h-fit flex-col gap-4 p-5 md:p-6 lg:sticky lg:top-24"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.3)",
            }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {t("cart.summary")}
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.6)" }}
              >
                {t("cart.subtotal")}
              </span>
              <span
                className="font-display text-xl font-black italic"
                style={{ color: "var(--bone)" }}
              >
                {formatPrice(subtotal, locale)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.6)" }}
              >
                {t("cart.shipping")}
              </span>
              <span
                className="font-mono text-[11px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {t("cart.shippingAtCheckout")}
              </span>
            </div>
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
                  {formatPrice(subtotal, locale)}
                </span>
              </div>
              <div
                className="font-mono mt-1 text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(245,240,232,0.4)" }}
              >
                {t("cart.totalNote")}
              </div>
            </div>

            {detailed.lines.length > 0 ? (
              <Link href="/store/checkout" className="btn-hell mt-2 w-full justify-center">
                {t("cart.proceed")}
                <span aria-hidden>{isAr ? "←" : "→"}</span>
              </Link>
            ) : (
              <span
                role="button"
                aria-disabled
                className="btn-hell mt-2 w-full justify-center"
                style={{ opacity: 0.4, cursor: "not-allowed" }}
              >
                {t("cart.proceed")}
                <span aria-hidden>{isAr ? "←" : "→"}</span>
              </span>
            )}

            <Link
              href="/store"
              className="font-mono mt-2 text-center text-[10px] tracking-[0.25em] uppercase transition-colors"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              {tStore("browse")} {isAr ? "←" : "→"}
            </Link>

            <div
              className="font-mono mt-2 text-[10px] leading-relaxed tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {t("codNote")}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

interface EmptyCartProps {
  title: string;
  sub: string;
  cta: string;
  arrow: string;
}

function EmptyCart({ title, sub, cta, arrow }: EmptyCartProps) {
  return (
    <div
      className="notch flex flex-col items-center gap-4 p-10 text-center md:p-16"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// EMPTY · STAND BY"}
      </div>
      <p
        className="font-display text-2xl font-black uppercase italic md:text-3xl"
        style={{ color: "var(--bone)" }}
      >
        {title}
      </p>
      <p
        className="max-w-md text-sm leading-relaxed"
        style={{ color: "rgba(245,240,232,0.65)" }}
      >
        {sub}
      </p>
      <Link href="/store" className="btn-hell mt-2">
        {cta}
        <span aria-hidden>{arrow}</span>
      </Link>
    </div>
  );
}
