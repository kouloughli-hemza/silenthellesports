import "server-only";
import { Marked } from "marked";

// Single Marked instance per process. Configured to:
// - GitHub-flavoured-ish defaults (gfm: true)
// - Disable autolink mangling (deprecated default we want off)
// - Treat raw HTML as plain text — pages come from admin but we treat as
//   untrusted input regardless. Anything that looks like a tag is escaped.
const marked = new Marked({
  gfm: true,
  breaks: false,
  async: false,
});

const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;

// Hrefs we permit in rendered output. javascript:, data:, vbscript: are
// blocked because they execute in the browser when the link is clicked.
// Anchor and relative paths are allowed for in-page nav.
const SAFE_HREF_RE = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

const SAFE_SRC_RE = /^(https?:\/\/|\/)/i;

// Strip onclick / onerror / onload etc. attributes (defence in depth — TAG_RE
// already removes raw HTML before marked parses, but markdown image syntax
// emits <img ...> via marked itself).
const EVENT_HANDLER_RE = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

function sanitizeHrefs(html: string): string {
  // Anchor tags
  let out = html.replace(/<a([^>]*?)href=("|')(.*?)\2([^>]*)>/gi, (_match, pre, q, href, post) => {
    const trimmed = String(href).trim();
    if (SAFE_HREF_RE.test(trimmed)) {
      return `<a${pre}href=${q}${trimmed}${q}${post} rel="noopener noreferrer">`;
    }
    return `<a${pre}${post}>`;
  });
  // Image src
  out = out.replace(/<img([^>]*?)src=("|')(.*?)\2([^>]*)>/gi, (_match, pre, q, src, post) => {
    const trimmed = String(src).trim();
    if (SAFE_SRC_RE.test(trimmed)) {
      return `<img${pre}src=${q}${trimmed}${q}${post}>`;
    }
    return `<img${pre}${post}>`;
  });
  return out.replace(EVENT_HANDLER_RE, "");
}

/**
 * Render a markdown string to safe HTML. Strips raw HTML tags from the source
 * before parsing, then sanitizes anchor/image URLs in the marked output so
 * javascript:/data: schemes never reach the browser. Inline event handlers
 * are stripped as defence in depth.
 */
export function renderMarkdown(source: string): string {
  if (!source || typeof source !== "string") return "";
  const sanitized = source.replace(TAG_RE, "");
  const html = marked.parse(sanitized);
  if (typeof html !== "string") return "";
  return sanitizeHrefs(html);
}
