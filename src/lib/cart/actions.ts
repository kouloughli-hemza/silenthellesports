"use server";

// Server actions for cart mutations. Cookie-backed; all paths revalidate the
// cart page so quantity changes show immediately. Each action returns Result.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createPublicClient } from "@/lib/supabase/public";
import {
  addLine,
  clearCart as clearCartCookie,
  readCart,
  removeLine,
  totalQuantity,
  updateLineQuantity,
  writeCart,
} from "./cookie";
import { fail, ok, type Result } from "@/types/domain";

const Uuid = z.string().uuid();
const NullableUuid = z.string().uuid().nullable();
const Quantity = z.number().int().min(1).max(99);

// Jersey/etc. custom name validator. Empty becomes undefined so the cart
// dedup key stays canonical.
const CUSTOM_NAME_RE = /^[A-Z0-9 ]{1,12}$/;
const OptionalCustomName = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v.toUpperCase() : undefined))
  .refine((v) => v === undefined || CUSTOM_NAME_RE.test(v), {
    message: "Custom name must be 1–12 letters/digits.",
  });

function revalidateCart(): void {
  revalidatePath("/[locale]/store/cart", "page");
  revalidatePath("/[locale]/store/checkout", "page");
}

// Resolve customization rules from the DB so a tampered client can't slap a
// custom name on a product whose admin disabled it.
async function gateCustomName(
  productId: string,
  raw: string | undefined,
): Promise<string | undefined> {
  const cleaned = OptionalCustomName.safeParse(raw);
  if (!cleaned.success) return undefined;
  if (!cleaned.data) return undefined;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("customization_enabled")
    .eq("id", productId)
    .maybeSingle<{ customization_enabled: boolean }>();
  if (!data?.customization_enabled) return undefined;
  return cleaned.data;
}

export async function addToCartAction(
  productId: string,
  variantId: string | null,
  quantity = 1,
  customName?: string,
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    const qty = Quantity.safeParse(quantity);
    if (!pid.success || !vid.success || !qty.success) {
      return fail("Invalid cart input.");
    }
    const safeName = await gateCustomName(pid.data, customName);
    const cart = await readCart();
    const next = addLine(cart, {
      productId: pid.data,
      variantId: vid.data,
      quantity: qty.data,
      ...(safeName ? { customName: safeName } : {}),
    });
    await writeCart(next);
    revalidateCart();
    return ok({ count: totalQuantity(next) });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to add to cart.");
  }
}

export async function updateLineAction(
  productId: string,
  variantId: string | null,
  quantity: number,
  customName?: string,
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    const qty = z.number().int().min(0).max(99).safeParse(quantity);
    if (!pid.success || !vid.success || !qty.success) {
      return fail("Invalid cart input.");
    }
    const cart = await readCart();
    const next = updateLineQuantity(cart, pid.data, vid.data, qty.data, customName);
    await writeCart(next);
    revalidateCart();
    return ok({ count: totalQuantity(next) });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update cart.");
  }
}

export async function removeLineAction(
  productId: string,
  variantId: string | null,
  customName?: string,
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    if (!pid.success || !vid.success) return fail("Invalid cart input.");
    const cart = await readCart();
    const next = removeLine(cart, pid.data, vid.data, customName);
    await writeCart(next);
    revalidateCart();
    return ok({ count: totalQuantity(next) });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to remove line.");
  }
}

export async function clearCartAction(): Promise<Result<{ count: 0 }>> {
  try {
    await clearCartCookie();
    revalidateCart();
    return ok({ count: 0 });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to clear cart.");
  }
}
