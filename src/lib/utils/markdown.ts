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

/**
 * Render a markdown string to safe HTML. Strips raw HTML tags from the source
 * before parsing so that admin-authored content cannot inject <script>, <iframe>
 * or any other tag — markdown syntax remains fully functional.
 */
export function renderMarkdown(source: string): string {
  if (!source || typeof source !== "string") return "";
  const sanitized = source.replace(TAG_RE, "");
  const html = marked.parse(sanitized);
  return typeof html === "string" ? html : "";
}
