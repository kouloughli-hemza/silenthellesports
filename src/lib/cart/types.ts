// Pure cart types (no React, no server-only deps).

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface Cart {
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { lines: [] };

export const CART_COOKIE = "sh_cart";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
