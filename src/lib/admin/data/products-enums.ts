export const PRODUCT_CATEGORIES = [
  "tee",
  "hoodie",
  "jersey",
  "mousepad",
  "cap",
  "sticker",
  "lanyard",
  "other",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
