// Server-side cart in a signed-ish base64 cookie.
// Phase 3 ships the cookie cart for guests. When users authenticate,
// later phases can persist server-side carts; for now both states share
// the same cookie shape.

import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";
import { CART_COOKIE, CART_COOKIE_MAX_AGE, EMPTY_CART, type Cart, type CartLine } from "./types";

const CartSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
      quantity: z.number().int().min(1).max(99),
    }),
  ),
});

function encode(cart: Cart): string {
  return Buffer.from(JSON.stringify(cart), "utf8").toString("base64url");
}

function decode(raw: string): Cart {
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    const parsed = CartSchema.safeParse(json);
    return parsed.success ? parsed.data : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export async function readCart(): Promise<Cart> {
  const store = await cookies();
  const c = store.get(CART_COOKIE);
  if (!c) return EMPTY_CART;
  return decode(c.value);
}

export async function writeCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, encode(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

// ----- pure operations on the Cart object -----

export function addLine(cart: Cart, line: CartLine): Cart {
  const existing = cart.lines.find(
    (l) => l.productId === line.productId && l.variantId === line.variantId,
  );
  if (existing) {
    return {
      lines: cart.lines.map((l) =>
        l === existing
          ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) }
          : l,
      ),
    };
  }
  return { lines: [...cart.lines, line] };
}

export function removeLine(cart: Cart, productId: string, variantId: string | null): Cart {
  return {
    lines: cart.lines.filter(
      (l) => !(l.productId === productId && l.variantId === variantId),
    ),
  };
}

export function updateLineQuantity(
  cart: Cart,
  productId: string,
  variantId: string | null,
  quantity: number,
): Cart {
  if (quantity <= 0) return removeLine(cart, productId, variantId);
  return {
    lines: cart.lines.map((l) =>
      l.productId === productId && l.variantId === variantId
        ? { ...l, quantity: Math.min(99, quantity) }
        : l,
    ),
  };
}

export function totalQuantity(cart: Cart): number {
  return cart.lines.reduce((acc, l) => acc + l.quantity, 0);
}
