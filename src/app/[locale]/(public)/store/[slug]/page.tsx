import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlaceholderImage } from "@/components/brand";
import { ProductPurchase } from "@/components/public/store/product-purchase";
import { Link, isLocale, routing } from "@/lib/i18n/routing";
import { getActiveProducts, getProductBySlug } from "@/lib/data/products";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteConfig } from "@/lib/site-config";
import {
  formatPrice,
  pickTranslation,
  type Player,
  type ProductVariant,
} from "@/types/domain";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<{ locale: string; slug: string }[]> {
  const products = await getActiveProducts();
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const product of products) {
      out.push({ locale, slug: product.slug });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "store" });
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: t("metaTitle"), description: t("metaDescription") };
  }
  const name = pickTranslation(product.name, locale) || slug;
  const description =
    pickTranslation(product.description, locale) ||
    t("productMetaDescriptionFallback", { name });
  return {
    title: t("productMetaTitle", { name }),
    description,
    alternates: {
      canonical: `/${locale}/store/${slug}`,
      languages: {
        en: `/en/store/${slug}`,
        ar: `/ar/store/${slug}`,
      },
    },
    openGraph: {
      title: t("productMetaTitle", { name }),
      description,
      type: "website",
      ...(product.images[0] ? { images: [{ url: product.images[0] }] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: "store" });
  const drop = await getSiteConfig("store.current_drop");

  const name = pickTranslation(product.name, locale) || slug.toUpperCase();
  const description = pickTranslation(product.description, locale);
  const price = formatPrice(product.base_price, locale);
  const isAr = locale === "ar";

  const activeVariants: ProductVariant[] = product.variants.filter((v) => v.is_active);
  const totalStock = activeVariants.reduce((sum, v) => sum + v.stock_quantity, 0);

  const wornByPlayer = await loadWornByPlayer(product.worn_by_player_id);

  const categoryKeyValue = categoryKey(product.category);
  const tier = t("tier", {
    category: t(`filters.${categoryKeyValue}`).toUpperCase(),
    drop: String(drop).padStart(2, "0"),
  });

  const primaryImage = product.images[0];
  const galleryImages = product.images.slice(1, 4);
  const stockLine = stockMessage(totalStock, t);

  return (
    <section
      className="grain relative py-16 md:py-24"
      style={{ background: "var(--ash-3)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <Link
          href="/store"
          locale={locale}
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
          style={{ color: "var(--hell-red)" }}
        >
          <span>{isAr ? "→" : "←"}</span>
          <span>{t("back")}</span>
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <div
              className="notch relative aspect-[4/5] w-full overflow-hidden"
              style={{
                background: "var(--ash-1)",
                border: "1px solid rgba(230,0,19,0.25)",
              }}
            >
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 56vw"
                  className="object-cover"
                />
              ) : (
                <PlaceholderImage label={name} aspect="4/5" />
              )}
              <div
                className="absolute top-4 left-4 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ background: "rgba(10,10,10,0.7)", color: "var(--bone)" }}
              >
                {tier}
              </div>
              {product.is_featured ? (
                <div
                  className="absolute top-4 right-4 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ background: "var(--hell-red)", color: "var(--bone)" }}
                >
                  {t("featured").split(" · ")[0]}
                </div>
              ) : null}
            </div>

            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((src, i) => (
                  <div
                    key={src + i}
                    className="notch-sm relative aspect-square overflow-hidden"
                    style={{
                      background: "var(--ash-1)",
                      border: "1px solid rgba(245,240,232,0.06)",
                    }}
                  >
                    <Image
                      src={src}
                      alt={`${name} — ${i + 2}`}
                      fill
                      sizes="(max-width: 1024px) 33vw, 18vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Detail panel */}
          <div className="flex flex-col gap-6">
            <div>
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {tier}
              </div>
              <h1
                className="font-display mt-3 text-4xl leading-[0.95] font-black tracking-tight uppercase italic md:text-6xl"
                style={{ color: "var(--bone)" }}
              >
                {name}
              </h1>
              <div className="mt-4 flex items-baseline gap-4">
                <div
                  className="font-display text-3xl font-black italic md:text-4xl"
                  style={{ color: "var(--hell-red)" }}
                >
                  {price}
                </div>
                <div
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: stockLine.color }}
                >
                  {stockLine.label}
                </div>
              </div>
            </div>

            {wornByPlayer ? (
              <Link
                href={`/roster/${wornByPlayer.ign}`}
                locale={locale}
                className="font-mono text-[11px] tracking-[0.25em] uppercase transition-colors"
                style={{ color: "var(--ember)" }}
              >
                {t("wornByLine", { ign: wornByPlayer.ign })}
              </Link>
            ) : null}

            <div
              className="space-y-3 text-sm leading-relaxed md:text-base"
              style={{ color: "rgba(245,240,232,0.78)" }}
            >
              {(description || t("descEmpty"))
                .split(/\n+/)
                .filter((p) => p.trim().length > 0)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>

            <ProductPurchase
              productId={product.id}
              variants={activeVariants}
              isAr={isAr}
              labels={{
                selectSize: t("selectSize"),
                noSizes: t("noSizes"),
                add: t("add"),
                pending: t("addPending"),
                done: t("addDone"),
                pickSizeFirst: t("pickSizeFirst"),
                outOfStock: t("stockGone"),
                addError: t("addError"),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

async function loadWornByPlayer(playerId: string | null): Promise<Player | null> {
  if (!playerId) return null;
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as Player;
  } catch {
    return null;
  }
}

type CategoryKey =
  | "tee"
  | "hoodie"
  | "jersey"
  | "mousepad"
  | "cap"
  | "sticker"
  | "lanyard"
  | "other";

function categoryKey(category: string): CategoryKey {
  switch (category) {
    case "tee":
    case "hoodie":
    case "jersey":
    case "mousepad":
    case "cap":
    case "sticker":
    case "lanyard":
      return category;
    default:
      return "other";
  }
}

function stockMessage(
  total: number,
  t: (key: string, values?: Record<string, string | number>) => string,
): { label: string; color: string } {
  if (total <= 0) {
    return { label: t("stockGone"), color: "var(--hell-red)" };
  }
  if (total <= 5) {
    return { label: t("stockLast", { count: total }), color: "var(--ember)" };
  }
  return {
    label: t("stockIn", { count: total }),
    color: "rgba(245,240,232,0.6)",
  };
}
