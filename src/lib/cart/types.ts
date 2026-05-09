// Pure cart types (no React, no server-only deps).

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
  // Optional jersey/etc. custom name. Locked at add-to-cart and used as
  // part of the dedup key — same product+size+different name = separate
  // lines so each prints its own text. Old cookies without this field
  // parse fine (treated as undefined).
  customName?: string;
}

// Normalize undefined/empty to a single canonical "no customization" key
// so dedup stays stable.
export function customNameKey(value: string | undefined | null): string {
  return value && value.trim().length > 0 ? value.trim() : "";
}

export interface Cart {
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { lines: [] };

export const CART_COOKIE = "sh_cart";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
