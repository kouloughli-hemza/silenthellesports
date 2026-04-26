import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/brand";
import { ProductCard } from "@/components/public/store/product-card";
import {
  StoreFilters,
  isCategoryKey,
} from "@/components/public/store/store-filters";
import { Link, isLocale } from "@/lib/i18n/routing";
import { getActivePlayers } from "@/lib/data/players";
import { getActiveProducts } from "@/lib/data/products";
import { getSiteConfig } from "@/lib/site-config";
import type { Player } from "@/types/domain";

interface StorePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; player?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "store" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/store`,
      languages: { en: "/en/store", ar: "/ar/store" },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const sp = await searchParams;
  const activeCategory = isCategoryKey(sp.category) ? sp.category : undefined;
  const activePlayerId = typeof sp.player === "string" && sp.player.length > 0 ? sp.player : undefined;

  const [t, drop, players, products] = await Promise.all([
    getTranslations({ locale, namespace: "store" }),
    getSiteConfig("store.current_drop"),
    getActivePlayers(),
    getActiveProducts({
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(activePlayerId ? { wornByPlayerId: activePlayerId } : {}),
    }),
  ]);

  const playerById = new Map<string, Player>(players.map((p) => [p.id, p]));
  const dropLabel = String(drop).padStart(2, "0");
  const isAr = locale === "ar";
  const hasFilter = Boolean(activeCategory) || Boolean(activePlayerId);

  return (
    <section
      id="store"
      className="grain relative py-20 md:py-28"
      style={{ background: "var(--ash-3)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            label={t("label", { drop: dropLabel })}
            title={
              <>
                {t("t1")}
                <br />
                <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
              </>
            }
          />
          <div
            className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {t("results", { count: products.length })}
          </div>
        </div>

        <StoreFilters
          locale={locale}
          players={players}
          activeCategory={activeCategory}
          activePlayerId={activePlayerId}
        />

        {products.length === 0 ? (
          <EmptyState
            message={hasFilter ? t("filterEmpty") : t("empty")}
            showClear={hasFilter}
            clearLabel={t("clearFilters")}
            isAr={isAr}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => {
              const wornByPlayer = product.worn_by_player_id
                ? playerById.get(product.worn_by_player_id)
                : undefined;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  locale={locale}
                  drop={drop}
                  wornByPlayer={wornByPlayer}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

interface EmptyStateProps {
  message: string;
  showClear: boolean;
  clearLabel: string;
  isAr: boolean;
}

function EmptyState({ message, showClear, clearLabel, isAr }: EmptyStateProps) {
  return (
    <div
      className="notch flex flex-col items-center gap-4 p-10 text-center md:p-16"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <p
        className="font-display text-2xl font-black uppercase italic md:text-3xl"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
      {showClear ? (
        <Link href="/store" className="btn-ghost">
          {clearLabel}
          <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
        </Link>
      ) : null}
    </div>
  );
}
