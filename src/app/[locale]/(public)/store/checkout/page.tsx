import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { SectionHeading } from "@/components/brand";
import { CheckoutForm } from "@/components/public/store/checkout-form";
import { isLocale } from "@/lib/i18n/routing";
import { readDetailedCart } from "@/lib/cart/detail";
import { yalidine } from "@/services/yalidine";
import { formatPrice, pickTranslation } from "@/types/domain";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const detailed = await readDetailedCart();
  if (detailed.lines.length === 0) {
    redirect(`/${locale}/store/cart`);
  }

  const t = await getTranslations({ locale, namespace: "checkout" });
  const isAr = locale === "ar";

  // Yalidine wilaya list — server-only call. The mock service returns instantly;
  // the real one is cached at the service layer.
  const wilayas = await yalidine.getWilayas();

  const fmt = (n: number) => formatPrice(n, locale);

  return (
    <section
      className="grain relative pt-28 pb-20 md:pt-36 md:pb-28"
      style={{ background: "var(--ash-3)", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <SectionHeading
          label={t("label")}
          title={
            <>
              {t("t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </>
          }
        />

        <div className="mt-6 mb-8">
          <ItemsPreview
            lines={detailed.lines.map((dl) => ({
              key: `${dl.line.productId}:${dl.line.variantId ?? "none"}`,
              name: pickTranslation(dl.product.name, locale) || dl.product.slug,
              variantLabel: dl.variantLabel,
              quantity: dl.line.quantity,
              lineTotalLabel: fmt(dl.lineTotal),
            }))}
            label={t("yourOrder")}
          />
        </div>

        <CheckoutForm
          locale={locale}
          isAr={isAr}
          wilayas={wilayas}
          totalWeightGrams={detailed.totalWeightGrams}
          subtotal={detailed.subtotal}
          labels={{
            customerSection: t("customerSection"),
            shippingSection: t("shippingSection"),
            deliverySection: t("deliverySection"),
            summarySection: t("summarySection"),
            name: t("fields.name"),
            phone: t("fields.phone"),
            phoneHint: t("fields.phoneHint"),
            email: t("fields.email"),
            emailHint: t("fields.emailHint"),
            wilaya: t("fields.wilaya"),
            wilayaPlaceholder: t("fields.wilayaPlaceholder"),
            commune: t("fields.commune"),
            communePlaceholder: t("fields.communePlaceholder"),
            communeLoading: t("fields.communeLoading"),
            address: t("fields.address"),
            addressHint: t("fields.addressHint"),
            pickStopdesk: t("fields.pickStopdesk"),
            stopdeskPlaceholder: t("fields.stopdeskPlaceholder"),
            stopdeskLoading: t("fields.stopdeskLoading"),
            noStopdesks: t("fields.noStopdesks"),
            home: t("home"),
            stopdesk: t("stopdesk"),
            placeOrder: t("placeOrder"),
            placing: t("placing"),
            feeLoading: t("feeLoading"),
            subtotal: t("cart.subtotal"),
            shipping: t("cart.shipping"),
            total: t("cart.total"),
            codNote: t("codNote"),
            errorTitle: t("errors.title"),
            errors: {
              nameRequired: t("errors.nameRequired"),
              phoneInvalid: t("errors.phoneInvalid"),
              emailInvalid: t("errors.emailInvalid"),
              wilayaRequired: t("errors.wilayaRequired"),
              communeRequired: t("errors.communeRequired"),
              addressRequired: t("errors.addressRequired"),
              stopdeskRequired: t("errors.stopdeskRequired"),
              cartEmpty: t("errors.cartEmpty"),
              noShippingTo: t("errors.noShippingTo"),
              oosVariant: t("errors.oosVariant"),
              genericError: t("errors.genericError"),
            },
          }}
        />
      </div>
    </section>
  );
}

interface ItemsPreviewProps {
  lines: Array<{
    key: string;
    name: string;
    variantLabel: string | null;
    quantity: number;
    lineTotalLabel: string;
  }>;
  label: string;
}

function ItemsPreview({ lines, label }: ItemsPreviewProps) {
  return (
    <div
      className="notch flex flex-col gap-3 p-4 md:p-5"
      style={{ background: "var(--ash-1)", border: "1px solid rgba(245,240,232,0.06)" }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {label}
      </div>
      <ul className="flex flex-col gap-2">
        {lines.map((l) => (
          <li
            key={l.key}
            className="font-mono flex items-baseline justify-between gap-3 text-xs tracking-[0.05em]"
            style={{ color: "rgba(245,240,232,0.8)" }}
          >
            <span className="min-w-0 truncate">
              {l.name}
              {l.variantLabel ? ` · ${l.variantLabel}` : ""}{" "}
              <span style={{ color: "rgba(245,240,232,0.5)" }}>×{l.quantity}</span>
            </span>
            <span className="tabular-nums" style={{ color: "var(--bone)" }}>
              {l.lineTotalLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
