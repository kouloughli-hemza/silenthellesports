// Cart detail loader — joins cookie cart lines with product + variant data.
// Used by the cart page, checkout page, and the topbar count helper.

import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Product, ProductVariant } from "@/types/domain";
import { readCart, totalQuantity } from "./cookie";
import type { Cart, CartLine } from "./types";

export interface DetailedCartLine {
  line: CartLine;
  product: Product;
  variant: ProductVariant | null;
  unitPrice: number;
  lineTotal: number;
  variantLabel: string | null;
  available: number; // -1 = unknown / no variants tracked
  outOfStock: boolean;
  weightGrams: number;
}

export interface DetailedCart {
  cart: Cart;
  lines: DetailedCartLine[];
  subtotal: number;
  totalWeightGrams: number;
  itemCount: number;
}

export async function readDetailedCart(): Promise<DetailedCart> {
  const cart = await readCart();
  if (cart.lines.length === 0) {
    return { cart, lines: [], subtotal: 0, totalWeightGrams: 0, itemCount: 0 };
  }

  const productIds = Array.from(new Set(cart.lines.map((l) => l.productId)));
  const variantIds = Array.from(
    new Set(cart.lines.map((l) => l.variantId).filter((v): v is string => v !== null)),
  );

  const supabase = createPublicClient();

  const productsRes = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  const variantsRes =
    variantIds.length > 0
      ? await supabase.from("product_variants").select("*").in("id", variantIds)
      : { data: [] as ProductVariant[], error: null as null };

  const products: Product[] =
    productsRes.error || !productsRes.data
      ? []
      : (productsRes.data as unknown as Product[]);
  const variants: ProductVariant[] =
    variantsRes.error || !variantsRes.data
      ? []
      : (variantsRes.data as unknown as ProductVariant[]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const detailed: DetailedCartLine[] = [];
  for (const line of cart.lines) {
    const product = productById.get(line.productId);
    if (!product) continue; // product disappeared / deactivated; skip silently
    const variant = line.variantId ? (variantById.get(line.variantId) ?? null) : null;
    if (line.variantId && !variant) continue; // variant deleted; skip
    const unitPrice =
      variant && variant.price_override !== null ? variant.price_override : product.base_price;
    const lineTotal = unitPrice * line.quantity;
    const available = variant ? variant.stock_quantity : -1;
    const outOfStock = variant ? variant.stock_quantity <= 0 : false;
    const variantLabel = variant
      ? [variant.size, variant.color].filter(Boolean).join(" · ") || null
      : null;
    detailed.push({
      line,
      product,
      variant,
      unitPrice,
      lineTotal,
      variantLabel,
      available,
      outOfStock,
      weightGrams: product.weight_grams * line.quantity,
    });
  }

  const subtotal = detailed.reduce((acc, d) => acc + d.lineTotal, 0);
  const totalWeightGrams = detailed.reduce((acc, d) => acc + d.weightGrams, 0);

  return {
    cart,
    lines: detailed,
    subtotal,
    totalWeightGrams,
    itemCount: totalQuantity(cart),
  };
}

export async function readCartCount(): Promise<number> {
  const cart = await readCart();
  return totalQuantity(cart);
}
