// =============================================================================
// Silent Hell — Liquipedia wikitext parser
// Pure functions, no I/O. All inputs are raw wikitext strings; outputs are
// strongly-typed plain objects. Defensive: missing fields → undefined; clearly
// malformed rows → console.warn + skip rather than throw.
// =============================================================================

import { z } from "zod";

import type { PlayerSocials } from "@/types/domain";

// ----- MediaWiki API response (validated with Zod before any access) --------

export const MediaWikiParseResponseSchema = z.object({
  parse: z.object({
    title: z.string().optional(),
    pageid: z.number().optional(),
    wikitext: z.object({
      "*": z.string(),
    }),
  }),
});

export type MediaWikiParseResponse = z.infer<typeof MediaWikiParseResponseSchema>;

// ----- Public output shapes --------------------------------------------------

export type PlayerRole =
  | "IGL"
  | "Sniper"
  | "Fragger"
  | "Support"
  | "Coach"
  | "Manager"
  | "Sub"
  | "Analyst"
  | "Assault"
  | "Scout";

export interface InfoboxData {
  foundedDate?: string;
  region?: string;
  location?: string;
  socials: PlayerSocials;
}

export interface RosterEntry {
  ign: string;
  realName?: string;
  countryCode?: string;
  role: PlayerRole;
  joinedAt?: string;
  isActive: boolean;
}

export interface TrophyEntry {
  date: string;
  placement: string;
  tournamentName: string;
  tier?: string;
  prizeAmount?: number;
}

// ----- Internal helpers ------------------------------------------------------

const ALLOWED_ROLES: ReadonlySet<PlayerRole> = new Set<PlayerRole>([
  "IGL",
  "Sniper",
  "Fragger",
  "Support",
  "Coach",
  "Manager",
  "Sub",
  "Analyst",
  "Assault",
  "Scout",
]);

// Liquipedia uses many free-text role labels — normalize them.
const ROLE_ALIASES: Record<string, PlayerRole> = {
  igl: "IGL",
  "in-game leader": "IGL",
  sniper: "Sniper",
  fragger: "Fragger",
  support: "Support",
  coach: "Coach",
  "head coach": "Coach",
  manager: "Manager",
  "team manager": "Manager",
  sub: "Sub",
  substitute: "Sub",
  analyst: "Analyst",
  assault: "Assault",
  scout: "Scout",
};

function normalizeRole(raw: string | undefined): PlayerRole {
  if (!raw) return "Sub";
  const key = raw.trim().toLowerCase();
  const aliased = ROLE_ALIASES[key];
  if (aliased) return aliased;
  // try title-cased exact match
  const titled = key.charAt(0).toUpperCase() + key.slice(1);
  if (ALLOWED_ROLES.has(titled as PlayerRole)) return titled as PlayerRole;
  return "Sub";
}

// ISO 3166-1 alpha-2 mapping for the country names we expect from Liquipedia.
// Liquipedia uses full English names (and sometimes 3-letter codes / flag
// templates) — handle both. Keys are lower-cased.
const COUNTRY_CODE_MAP: Record<string, string> = {
  algeria: "DZ",
  dz: "DZ",
  alg: "DZ",
  dza: "DZ",
  libya: "LY",
  ly: "LY",
  lby: "LY",
  iraq: "IQ",
  iq: "IQ",
  irq: "IQ",
  russia: "RU",
  ru: "RU",
  rus: "RU",
  "russian federation": "RU",
  morocco: "MA",
  mar: "MA",
  ma: "MA",
  tunisia: "TN",
  tun: "TN",
  tn: "TN",
  egypt: "EG",
  egy: "EG",
  eg: "EG",
  "saudi arabia": "SA",
  sa: "SA",
  sau: "SA",
  jordan: "JO",
  jo: "JO",
  jor: "JO",
  syria: "SY",
  sy: "SY",
  syr: "SY",
  lebanon: "LB",
  lb: "LB",
  lbn: "LB",
  palestine: "PS",
  ps: "PS",
  pse: "PS",
  yemen: "YE",
  ye: "YE",
  yem: "YE",
  uae: "AE",
  ae: "AE",
  "united arab emirates": "AE",
  qatar: "QA",
  qa: "QA",
  qat: "QA",
  kuwait: "KW",
  kw: "KW",
  kwt: "KW",
  bahrain: "BH",
  bh: "BH",
  bhr: "BH",
  oman: "OM",
  om: "OM",
  omn: "OM",
};

export function normalizeCountry(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // If the input is a flag template, prefer the country argument inside it.
  const flagInner = extractFlagCountry(raw);
  const candidate = flagInner ?? raw;
  const cleaned = candidate
    .trim()
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/[{}\[\]|]/g, "")
    .trim()
    .toLowerCase();
  if (cleaned.length === 0) return undefined;
  const mapped = COUNTRY_CODE_MAP[cleaned];
  if (mapped) return mapped;
  // 2-letter unknown — accept upper-cased as fallback (best-effort)
  if (/^[a-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();
  return undefined;
}

// Convert a date string in any of the common Liquipedia formats to ISO YYYY-MM-DD.
// Returns undefined if it can't be confidently parsed.
export function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s.length === 0) return undefined;
  // Already ISO-ish
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    if (y && m && d) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // 2024/04/13 or 2024.04.13
  const slash = s.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/);
  if (slash) {
    const [, y, m, d] = slash;
    if (y && m && d) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Liquipedia date templates often look like: April 13, 2024 / 13 April 2024
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return undefined;
}

// Strip wiki link syntax: [[Foo|Bar]] -> Bar, [[Foo]] -> Foo.
function stripWikiLinks(s: string): string {
  return s
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");
}

// Strip a leading flag template like {{flag|Algeria}} or {{flagicon|DZ}}.
function extractFlagCountry(s: string): string | undefined {
  const m = s.match(/\{\{(?:flag|flagicon|flag\/[a-z]+)\|([^}|]+)/i);
  return m?.[1]?.trim();
}

// Pull a single template invocation out of wikitext, balancing braces.
// Returns the contents between the outer {{ and }} (excluding the braces).
export function extractTemplate(wikitext: string, templateName: string): string | undefined {
  const re = new RegExp(`\\{\\{\\s*${escapeRegex(templateName)}\\b`, "i");
  const startMatch = re.exec(wikitext);
  if (!startMatch) return undefined;
  const start = startMatch.index;
  let depth = 0;
  for (let i = start; i < wikitext.length; i++) {
    if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
      depth++;
      i++;
    } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
      depth--;
      i++;
      if (depth === 0) {
        // contents between the outer braces
        return wikitext.slice(start + 2, i - 1);
      }
    }
  }
  return undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Parse a template body's pipe-separated args into a key/value map (named only)
// and a positional array. Respects nested template braces.
export function parseTemplateArgs(body: string): {
  named: Record<string, string>;
  positional: string[];
} {
  const named: Record<string, string> = {};
  const positional: string[] = [];
  const parts = splitTopLevel(body, "|");
  // first part is the template name itself
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined) continue;
    const eq = findTopLevelEq(part);
    if (eq === -1) {
      positional.push(part.trim());
    } else {
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (key.length > 0) named[key] = value;
    }
  }
  return { named, positional };
}

function findTopLevelEq(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (ch === "{" && next === "{") {
      depth++;
      i++;
    } else if (ch === "}" && next === "}") {
      depth--;
      i++;
    } else if (ch === "[" && next === "[") {
      depth++;
      i++;
    } else if (ch === "]" && next === "]") {
      depth--;
      i++;
    } else if (ch === "=" && depth === 0) {
      return i;
    }
  }
  return -1;
}

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];
    if (ch === "{" && next === "{") {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === "}" && next === "}") {
      depth--;
      buf += ch;
      continue;
    }
    if (ch === "[" && next === "[") {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === "]" && next === "]") {
      depth--;
      buf += ch;
      continue;
    }
    if (ch === sep && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch ?? "";
  }
  out.push(buf);
  return out;
}

// ----- Public parsers --------------------------------------------------------

export function parseInfobox(wikitext: string): InfoboxData {
  const socials: PlayerSocials = {};
  const result: InfoboxData = { socials };

  const body =
    extractTemplate(wikitext, "Infobox team") ?? extractTemplate(wikitext, "Infobox_team");
  if (!body) {
    console.warn("[liquipedia.parser] Infobox team template not found");
    return result;
  }

  const { named } = parseTemplateArgs(body);

  const founded = named["created"] ?? named["founded"] ?? named["foundeddate"];
  const foundedNorm = normalizeDate(founded);
  if (foundedNorm) result.foundedDate = foundedNorm;

  const region = named["region"];
  if (region) result.region = stripWikiLinks(region).trim() || undefined;

  const location = named["location"] ?? named["country"];
  if (location) {
    const stripped = stripWikiLinks(location).trim();
    if (stripped.length > 0) result.location = stripped;
  }

  // We only surface tiktok / liquipedia / instagram on the public profile,
  // so other handles parsed from the wikitext are intentionally dropped.
  const tiktok = named["tiktok"];
  const instagram = named["instagram"];
  if (tiktok) socials.tiktok = tiktok.trim();
  if (instagram) socials.instagram = instagram.trim();

  return result;
}

// ----- Roster --------------------------------------------------------------
//
// Liquipedia rosters typically use either:
//   {{TeamCard ... }} containing many {{Player|id=...|...}} sub-templates,
// or an explicit {{SquadPerson|id=...|name=...|flag=...|role=...|join=...}} list.
// We handle both shapes by scanning for both Player and SquadPerson templates.

export function parseRoster(wikitext: string): RosterEntry[] {
  const entries: RosterEntry[] = [];
  const seen = new Set<string>();

  const templates = findAllTemplates(wikitext, ["SquadPerson", "Player", "TeamRosterPlayer"]);
  for (const tpl of templates) {
    const { named } = parseTemplateArgs(tpl.body);
    const ign = (named["id"] ?? named["ign"] ?? named["player"] ?? "").trim();
    if (!ign) {
      console.warn("[liquipedia.parser] Roster row missing IGN, skipping");
      continue;
    }

    const realName =
      [named["name"], named["realname"], named["realName"]]
        .find((v): v is string => typeof v === "string" && v.trim().length > 0)
        ?.trim() || undefined;

    const flagRaw = named["flag"] ?? named["country"] ?? named["nationality"];
    const flagFromTemplate = flagRaw ? extractFlagCountry(flagRaw) ?? flagRaw : undefined;
    const countryCode = normalizeCountry(flagFromTemplate);

    const role = normalizeRole(named["role"] ?? named["position"]);

    const joinRaw = named["join"] ?? named["joindate"] ?? named["joined"];
    const joinedAt = normalizeDate(joinRaw);

    const leaveRaw = named["leave"] ?? named["leavedate"] ?? named["left"];
    const isActive = !leaveRaw || leaveRaw.trim().length === 0;

    const dedupeKey = ign.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const entry: RosterEntry = { ign, role, isActive };
    if (realName) entry.realName = realName;
    if (countryCode) entry.countryCode = countryCode;
    if (joinedAt) entry.joinedAt = joinedAt;
    entries.push(entry);
  }

  return entries;
}

// ----- Achievements --------------------------------------------------------
//
// Most Liquipedia team pages show achievements via a transcluded results table.
// In raw wikitext, the achievements section is usually built from per-row
// templates like {{Achievement|date=...|place=1st|tournament=Foo|prize=$1000}}
// or via a wikitable with pipe-delimited rows. We support both.

export function parseAchievements(wikitext: string): TrophyEntry[] {
  const entries: TrophyEntry[] = [];

  // 1) Template-based rows
  const templates = findAllTemplates(wikitext, ["Achievement", "AchievementsRow", "ResultRow"]);
  for (const tpl of templates) {
    const { named } = parseTemplateArgs(tpl.body);
    const dateRaw = named["date"];
    const date = normalizeDate(dateRaw);
    const placement = (named["place"] ?? named["placement"] ?? "").trim();
    const tournamentName = stripWikiLinks(
      (named["tournament"] ?? named["event"] ?? named["name"] ?? "").trim(),
    );
    if (!date || !placement || !tournamentName) {
      console.warn(
        `[liquipedia.parser] Achievement row missing required fields, skipping: ${JSON.stringify(named).slice(0, 120)}`,
      );
      continue;
    }
    const tier = named["tier"]?.trim();
    const prizeAmount = parsePrize(named["prize"] ?? named["prizepool"]);
    const entry: TrophyEntry = { date, placement, tournamentName };
    if (tier) entry.tier = tier;
    if (prizeAmount !== undefined) entry.prizeAmount = prizeAmount;
    entries.push(entry);
  }

  // 2) Wikitable rows (fallback for pages that render achievements as tables)
  const tableEntries = parseAchievementsTable(wikitext);
  for (const e of tableEntries) {
    // Avoid duplicating template-sourced rows
    const dup = entries.some(
      (existing) => existing.date === e.date && existing.tournamentName === e.tournamentName,
    );
    if (!dup) entries.push(e);
  }

  return entries;
}

function parsePrize(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  // Strip currency symbols, commas, and any wiki templates
  const cleaned = raw
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/[$,€£]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (cleaned.length === 0) return undefined;
  const num = Number(cleaned);
  if (Number.isFinite(num)) return num;
  // Try to extract a numeric run
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (m && m[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseAchievementsTable(wikitext: string): TrophyEntry[] {
  const out: TrophyEntry[] = [];
  // Look for a wikitable that contains the words "Date" and "Tournament" in
  // its header — best-effort heuristic.
  const tableRe = /\{\|[^\n]*class="?[^"\n]*wikitable[^"\n]*"?[\s\S]*?\n\|\}/g;
  const tables = wikitext.match(tableRe);
  if (!tables) return out;
  for (const table of tables) {
    if (!/\bDate\b/i.test(table) || !/\bTournament\b/i.test(table)) continue;
    // Split into rows on |- delimiters
    const rows = table.split(/\n\|-/);
    for (const row of rows) {
      // Skip header rows (lines starting with !)
      const trimmed = row.trim();
      if (trimmed.startsWith("!") || trimmed.length === 0) continue;
      // Cell separator: each cell is on its own line starting with | or separated by ||
      const cellLines = trimmed
        .split("\n")
        .filter((l) => l.startsWith("|") && !l.startsWith("|}") && !l.startsWith("|-"));
      if (cellLines.length === 0) continue;
      const cells: string[] = [];
      for (const line of cellLines) {
        const stripped = line.replace(/^\|+/, "");
        for (const piece of stripped.split("||")) cells.push(piece.trim());
      }
      if (cells.length < 3) continue;
      // Heuristic ordering: date, place, tournament, [tier], [prize]
      const [dateRaw, placeRaw, tournamentRaw, tierRaw, prizeRaw] = cells;
      const date = normalizeDate(dateRaw);
      const placement = placeRaw?.trim();
      const tournamentName = tournamentRaw ? stripWikiLinks(tournamentRaw).trim() : "";
      if (!date || !placement || !tournamentName) {
        console.warn(
          `[liquipedia.parser] Achievement table row malformed, skipping: ${cells.slice(0, 4).join(" | ")}`,
        );
        continue;
      }
      const entry: TrophyEntry = { date, placement, tournamentName };
      const tier = tierRaw?.trim();
      if (tier) entry.tier = tier;
      const prize = parsePrize(prizeRaw);
      if (prize !== undefined) entry.prizeAmount = prize;
      out.push(entry);
    }
  }
  return out;
}

interface FoundTemplate {
  name: string;
  body: string; // includes the name as the first pipe-separated segment
  start: number;
}

function findAllTemplates(wikitext: string, names: ReadonlyArray<string>): FoundTemplate[] {
  const out: FoundTemplate[] = [];
  const lower = wikitext;
  for (let i = 0; i < lower.length; i++) {
    if (lower[i] === "{" && lower[i + 1] === "{") {
      // determine the name starting at i+2 up to the next | or }} or whitespace
      const rest = lower.slice(i + 2);
      const m = rest.match(/^\s*([A-Za-z0-9_/-]+)/);
      if (!m) continue;
      const name = m[1];
      if (!name) continue;
      const matched = names.find((n) => n.toLowerCase() === name.toLowerCase());
      if (!matched) continue;
      // walk to the matching }}
      let depth = 0;
      for (let j = i; j < lower.length; j++) {
        if (lower[j] === "{" && lower[j + 1] === "{") {
          depth++;
          j++;
        } else if (lower[j] === "}" && lower[j + 1] === "}") {
          depth--;
          j++;
          if (depth === 0) {
            out.push({ name: matched, body: lower.slice(i + 2, j - 1), start: i });
            i = j;
            break;
          }
        }
      }
    }
  }
  return out;
}
