import { PlaceholderImage } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import {
  formatPrice,
  pickTranslation,
  type Locale,
  type Product,
} from "@/types/domain";

interface ProductCardProps {
  product: Product;
  index: number;
  locale: Locale;
  size?: "lg" | "sm";
}

export function ProductCard({ product, index, locale, size = "lg" }: ProductCardProps) {
  const aspect = size === "sm" ? "1/1" : "4/5";
  const name = pickTranslation(product.name, locale) || product.slug.toUpperCase();
  const tier = `${product.category.toUpperCase()} · ${
    product.is_featured ? "FEATURED" : "DROP"
  }`;
  const price = formatPrice(product.base_price, locale, "DZD");
  const tag = product.is_featured ? "NEW" : null;

  return (
    <Link
      href={`/store/${product.slug}`}
      locale={locale}
      className="card-bite notch relative block overflow-hidden focus-visible:outline-none"
      style={{ background: "var(--ash-1)", aspectRatio: aspect }}
      aria-label={name}
    >
      <div className="relative flex h-full flex-col">
        <div className="relative flex-1 overflow-hidden">
          <PlaceholderImage
            label={`PRODUCT ${String(index + 1).padStart(2, "0")}`}
            aspect={aspect}
          />
        </div>
        {tag ? (
          <div
            className="absolute top-3 left-3 px-2 py-1 font-mono text-[9px] tracking-[0.25em] uppercase"
            style={{ background: "var(--hell-red)" }}
          >
            {tag}
          </div>
        ) : null}
        <div
          className="absolute top-3 right-3 px-2 py-1 font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ background: "rgba(10,10,10,0.7)" }}
        >
          {String(index + 1).padStart(2, "0")}
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
    </Link>
  );
}
