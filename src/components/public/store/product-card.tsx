import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PlaceholderImage } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { formatPrice, pickTranslation, type Locale, type Product, type ProductVariant } from "@/types/domain";
import type { Player } from "@/types/domain";
import { CardAddToCart } from "./card-add-to-cart";

interface ProductCardProps {
  product: Product;
  index: number;
  locale: Locale;
  drop: number;
  wornByPlayer?: Player | undefined;
}

async function getCardVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true);
  if (error || !data) return [];
  return data as unknown as ProductVariant[];
}

export async function ProductCard({
  product,
  index,
  locale,
  drop,
  wornByPlayer,
}: ProductCardProps) {
  const t = await getTranslations({ locale, namespace: "store" });
  const isAr = locale === "ar";
  const variants = await getCardVariants(product.id);
  const sizedVariants = variants.filter((v) => v.size && v.size.length > 0);
  const oneSizeVariant = sizedVariants.length === 0
    ? variants.find((v) => v.is_active) ?? null
    : null;
  const totalStock = variants.reduce((s, v) => s + v.stock_quantity, 0);
  const outOfStock = variants.length > 0 && totalStock <= 0;

  const name = pickTranslation(product.name, locale) || product.slug.toUpperCase();
  const tier = t("tier", {
    category: t(`filters.${categoryKey(product.category)}`).toUpperCase(),
    drop: String(drop).padStart(2, "0"),
  });
  const price = formatPrice(product.base_price, locale);
  const number = String(index + 1).padStart(2, "0");

  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] ?? primaryImage;
  const altLabel = wornByPlayer ? wornByPlayer.ign.toUpperCase() : "BACK";

  return (
    <Link
      href={`/store/${product.slug}`}
      locale={locale}
      className="flip-card card-bite interactive group relative block aspect-[4/5] focus:outline-none"
      aria-label={`${name} — ${price}`}
    >
      <div className="flip-inner h-full w-full">
        {/* FRONT */}
        <div
          className="flip-front notch overflow-hidden"
          style={{ background: "var(--ash-1)" }}
        >
          <div className="relative flex h-full flex-col">
            <div className="relative flex-1 overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <PlaceholderImage label={`PRODUCT ${number}`} aspect="4/5" />
              )}
            </div>
            {product.is_featured ? (
              <div
                className="absolute top-3 left-3 px-2 py-1 font-mono text-[9px] tracking-[0.25em] uppercase"
                style={{ background: "var(--hell-red)", color: "var(--bone)" }}
              >
                {t("featured").split(" · ")[0]}
              </div>
            ) : null}
            <div
              className="absolute top-3 right-3 px-2 py-1 font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ background: "rgba(10,10,10,0.7)", color: "var(--bone)" }}
            >
              {number}
            </div>
            <div
              className="border-t p-4"
              style={{
                borderColor: "rgba(230,0,19,0.25)",
                background: "var(--ash-1)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className="font-mono text-[9px] tracking-[0.25em] uppercase"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {tier}
                  </div>
                  <div className="font-display glitch-target mt-1 text-sm leading-tight font-black uppercase italic">
                    {name}
                  </div>
                </div>
                <div
                  className="font-display text-lg font-black whitespace-nowrap italic"
                  style={{ color: "var(--hell-red)" }}
                >
                  {price}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="flip-back notch overflow-hidden"
          style={{ background: "var(--ash-3)" }}
        >
          <div className="relative flex h-full flex-col">
            <div
              className="relative flex-1 overflow-hidden"
              style={{ filter: "hue-rotate(20deg) brightness(0.9)" }}
            >
              {secondaryImage ? (
                <Image
                  src={secondaryImage}
                  alt={`${name} — ${altLabel}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <PlaceholderImage label={`${altLabel} VIEW`} aspect="4/5" />
              )}
            </div>
            <div
              className="absolute top-3 left-3 px-2 py-1 font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{ background: "var(--ember)", color: "var(--black)" }}
            >
              {altLabel}
            </div>
            <div
              className="border-t p-4"
              style={{
                borderColor: "rgba(230,0,19,0.25)",
                background: "var(--ash-3)",
              }}
            >
              {wornByPlayer ? (
                <>
                  <div
                    className="font-mono text-[9px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--ember)" }}
                  >
                    {t("wornBy")}
                  </div>
                  <div className="font-display mt-1 text-base font-black uppercase italic">
                    {wornByPlayer.ign}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="font-mono text-[9px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--ember)" }}
                  >
                    {t("essential")}
                  </div>
                  <div className="font-display mt-1 text-base font-black uppercase italic">
                    {t("addLoadout")}
                  </div>
                </>
              )}
              <div className="mt-2">
                <CardAddToCart
                  productId={product.id}
                  variantId={oneSizeVariant ? oneSizeVariant.id : null}
                  hasSizes={sizedVariants.length > 0}
                  outOfStock={outOfStock}
                  productSlug={product.slug}
                  locale={locale}
                  labels={{
                    add: t("add"),
                    pickSize: t("pickSizeFirst"),
                    pending: t("addPending"),
                    done: t("addDone"),
                    outOfStock: t("stockGone"),
                  }}
                  arrow={isAr ? "←" : "→"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
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
