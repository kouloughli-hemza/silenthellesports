// =============================================================================
// Silent Hell — Liquipedia MediaWiki API fetcher
// Respects Liquipedia's TOS: identifying User-Agent + 1 req/2s rate limit.
// All callers receive a Result<string> envelope; throws are converted to fail().
// =============================================================================

import { gunzipSync } from "node:zlib";
import { request } from "node:https";

import { fail, ok, type Result } from "@/types/domain";

import { MediaWikiParseResponseSchema } from "@/services/liquipedia/parser";

const LIQUIPEDIA_API_BASE = "https://liquipedia.net/pubgmobile/api.php";
const RATE_LIMIT_MS = 2000;
const USER_AGENT =
  "SilentHellSeeder/1.0 (+https://silenthellesports.com; admin@silenthellesports.com)";

let lastRequestAt = 0;

async function rateLimitGate(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  const wait = RATE_LIMIT_MS - elapsed;
  if (wait > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

// Liquipedia's API rejects requests that don't accept gzip (HTTP 406).
// Node's undici fetch silently drops a manually-set Accept-Encoding header,
// so we use the lower-level https module to guarantee gzip is requested
// and we manually decompress the response.
function fetchGzip(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Accept-Encoding": "gzip",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const isGzip = res.headers["content-encoding"] === "gzip";
          try {
            const body = isGzip ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
            resolve({ status: res.statusCode ?? 0, body });
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}

export async function fetchTeamWikitext(pageName: string): Promise<Result<string>> {
  if (!pageName || pageName.trim().length === 0) {
    return fail("pageName is required");
  }

  await rateLimitGate();

  const url = new URL(LIQUIPEDIA_API_BASE);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", pageName);
  url.searchParams.set("format", "json");
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("redirects", "1");

  let response: { status: number; body: string };
  try {
    response = await fetchGzip(url.toString());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Network error fetching ${pageName}: ${message}`);
  }

  if (response.status < 200 || response.status >= 300) {
    return fail(`Liquipedia API returned HTTP ${response.status} for ${pageName}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Failed to parse Liquipedia JSON response: ${message}`);
  }

  // The API returns { error: { code, info } } when a page is missing — surface
  // that as a failure rather than letting Zod throw a confusing message.
  if (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error: unknown }).error === "object"
  ) {
    const errObj = (json as { error: { info?: unknown; code?: unknown } }).error;
    const info = typeof errObj.info === "string" ? errObj.info : "unknown error";
    return fail(`Liquipedia API error: ${info}`);
  }

  const parsed = MediaWikiParseResponseSchema.safeParse(json);
  if (!parsed.success) {
    return fail(`Liquipedia response failed schema validation: ${parsed.error.message}`);
  }

  const wikitext = parsed.data.parse.wikitext["*"];
  if (!wikitext || wikitext.trim().length === 0) {
    return fail(`Liquipedia returned empty wikitext for ${pageName}`);
  }

  return ok(wikitext);
}
