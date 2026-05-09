import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { listPlayers } from "@/lib/admin/data/players";
import { ProductForm } from "../product-form";
import type { ProductInput } from "../actions";

const EMPTY: ProductInput = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  category: "tee",
  base_price: 0,
  worn_by_player_id: null,
  images: [],
  is_active: true,
  is_featured: false,
  customization_enabled: false,
  weight_grams: 250,
  display_order: 0,
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const players = (await listPlayers()).map((p) => ({ id: p.id, ign: p.ign }));

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// PRODUCTS / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Product
      </h1>
      <ProductForm mode="create" locale={locale} initial={EMPTY} players={players} />
    </div>
  );
}
