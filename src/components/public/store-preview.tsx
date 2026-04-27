import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { getActiveProducts } from "@/lib/data/products";
import { getSiteConfig } from "@/lib/site-config";
import { ProductCard } from "@/components/public/product-card";
import { FeaturedDrop } from "@/components/public/featured-drop";
import { StoreAirdropCrate } from "@/components/scenes/StoreAirdropCrate";
import type { Locale } from "@/types/domain";

interface StorePreviewProps {
  locale: Locale;
}

export async function StorePreview({ locale }: StorePreviewProps) {
  const t = await getTranslations({ locale, namespace: "store" });
  const isAr = locale === "ar";

  const [drop, endsAt] = await Promise.all([
    getSiteConfig("store.current_drop"),
    getSiteConfig("store.featured_collection_ends_at"),
  ]);

  let products = await getActiveProducts({ limit: 4, featured: true });
  if (products.length === 0) {
    products = await getActiveProducts({ limit: 4 });
  }

  return (
    <section
      id="store"
      className="relative py-24 md:py-32"
      style={{ background: "var(--ash-3)" }}
    >
      <StoreAirdropCrate badgeLabel={t("airdropBadge")} newDropLabel={t("newDrop")} />
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-12 grid items-end gap-8 md:grid-cols-2">
          <SectionHeading
            label={t("label", { drop })}
            title={
              <>
                {t("t1")}
                <br />
                <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
              </>
            }
          />
          <FeaturedDrop
            endsAt={endsAt}
            featuredLabel={t("featured")}
            title={t("featuredTitle")}
            hrsLabel={t("hrs")}
            minLabel={t("min")}
            secLabel={t("sec")}
          />
        </div>

        {products.length === 0 ? (
          <EmptyStore message={t("empty")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} locale={locale} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link href="/store" locale={locale} className="btn-ghost">
            {t("browse")}
            <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function EmptyStore({ message }: { message: string }) {
  return (
    <div
      className="notch p-10 text-center"
      style={{ background: "var(--ash-1)", border: "1px solid rgba(230,0,19,0.25)" }}
    >
      <p
        className="font-display text-2xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
    </div>
  );
}
