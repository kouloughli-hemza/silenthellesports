import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { listPlayers } from "@/lib/admin/data/players";
import { getProduct } from "@/lib/admin/data/products";
import { ProductForm } from "../../product-form";
import type { ProductInput } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [product, allPlayers] = await Promise.all([getProduct(id), listPlayers()]);
  if (!product) notFound();

  const name = (product.name ?? {}) as { en?: string; ar?: string };
  const description = (product.description ?? {}) as { en?: string; ar?: string };

  const initial: ProductInput = {
    slug: product.slug,
    name: { en: name.en ?? "", ar: name.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    category: product.category,
    base_price: product.base_price,
    worn_by_player_id: product.worn_by_player_id,
    images: product.images ?? [],
    is_active: product.is_active,
    is_featured: product.is_featured,
    customization_enabled: product.customization_enabled,
    weight_grams: product.weight_grams,
    display_order: product.display_order,
  };

  const players = allPlayers.map((p) => ({ id: p.id, ign: p.ign }));

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// PRODUCTS / ${product.slug.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit {name.en || product.slug}
      </h1>
      <ProductForm
        mode="edit"
        id={product.id}
        locale={locale}
        initial={initial}
        players={players}
      />
    </div>
  );
}
