// Parses a player highlight URL into a platform + ID we can embed.
// Returns null when the URL doesn't match a supported platform or is malformed —
// callers should treat that as "no embed" and skip rendering.

export type HighlightPlatform = "youtube" | "tiktok";

export interface ParsedHighlight {
  platform: HighlightPlatform;
  id: string;
}

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const TT_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
]);

const YT_ID_RE = /^[A-Za-z0-9_-]{6,15}$/;
const TT_ID_RE = /^\d{6,25}$/;

export function parseHighlightUrl(raw: string | null | undefined): ParsedHighlight | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
      return id && YT_ID_RE.test(id) ? { platform: "youtube", id } : null;
    }
    const v = url.searchParams.get("v");
    if (v && YT_ID_RE.test(v)) return { platform: "youtube", id: v };
    const shorts = /^\/shorts\/([^/?#]+)/u.exec(url.pathname);
    const shortsId = shorts?.[1];
    if (shortsId && YT_ID_RE.test(shortsId)) return { platform: "youtube", id: shortsId };
    const embed = /^\/embed\/([^/?#]+)/u.exec(url.pathname);
    const embedId = embed?.[1];
    if (embedId && YT_ID_RE.test(embedId)) return { platform: "youtube", id: embedId };
    return null;
  }

  if (TT_HOSTS.has(host)) {
    const m = /\/video\/(\d+)/u.exec(url.pathname);
    const id = m?.[1];
    if (id && TT_ID_RE.test(id)) return { platform: "tiktok", id };
    return null;
  }

  return null;
}

export function highlightEmbedSrc(parsed: ParsedHighlight): string {
  if (parsed.platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?modestbranding=1&rel=0&playsinline=1`;
  }
  return `https://www.tiktok.com/embed/v2/${parsed.id}`;
}
