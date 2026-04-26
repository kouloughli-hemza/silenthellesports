// Tiny ASCII slugify — used by admin event/giveaway forms to derive a URL slug
// from an English title. Lowercase, dash-separated, ASCII-folded, no diacritics.

const DIACRITIC_RE = /[̀-ͯ]/g;
const NON_ALNUM_RE = /[^a-z0-9]+/g;
const TRIM_DASH_RE = /^-+|-+$/g;

export function slugify(input: string): string {
  if (!input) return "";
  // Normalize accents/diacritics, drop them, then lowercase, then dasherize.
  return input
    .normalize("NFKD")
    .replace(DIACRITIC_RE, "")
    .toLowerCase()
    .replace(NON_ALNUM_RE, "-")
    .replace(TRIM_DASH_RE, "")
    .slice(0, 64);
}
