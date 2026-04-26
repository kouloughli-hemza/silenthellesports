"use server";

// Server actions for cart mutations. Cookie-backed; all paths revalidate the
// cart page so quantity changes show immediately. Each action returns Result.

import { revalidatePath } from "next/cache";
import { z } from "zod";

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

function revalidateCart(): void {
  revalidatePath("/[locale]/store/cart", "page");
  revalidatePath("/[locale]/store/checkout", "page");
}

export async function addToCartAction(
  productId: string,
  variantId: string | null,
  quantity = 1,
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    const qty = Quantity.safeParse(quantity);
    if (!pid.success || !vid.success || !qty.success) {
      return fail("Invalid cart input.");
    }
    const cart = await readCart();
    const next = addLine(cart, {
      productId: pid.data,
      variantId: vid.data,
      quantity: qty.data,
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
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    const qty = z.number().int().min(0).max(99).safeParse(quantity);
    if (!pid.success || !vid.success || !qty.success) {
      return fail("Invalid cart input.");
    }
    const cart = await readCart();
    const next = updateLineQuantity(cart, pid.data, vid.data, qty.data);
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
): Promise<Result<{ count: number }>> {
  try {
    const pid = Uuid.safeParse(productId);
    const vid = NullableUuid.safeParse(variantId);
    if (!pid.success || !vid.success) return fail("Invalid cart input.");
    const cart = await readCart();
    const next = removeLine(cart, pid.data, vid.data);
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
