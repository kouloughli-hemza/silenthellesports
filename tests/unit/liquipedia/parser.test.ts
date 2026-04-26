// =============================================================================
// Silent Hell — Liquipedia parser unit tests
// Pure unit tests against a hand-crafted minimal wikitext fixture.
// No network. No Supabase.
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  normalizeCountry,
  normalizeDate,
  parseAchievements,
  parseInfobox,
  parseRoster,
} from "@/services/liquipedia/parser";

const FIXTURE_WIKITEXT = `
{{Infobox team
|name=Silent Hell Esports
|created=2023-11-20
|region=[[MENA]]
|location={{flag|Algeria}} Algeria
|twitter=silenthellgg
|youtube=silenthellesports
}}

== Active Squad ==
{{SquadPerson|id=FaRoK|name=Berima Farouk|flag=Algeria|role=Analyst|join=2024-12-28}}
{{SquadPerson|id=ALA|name=Meharzi Ala Eddine|flag=Algeria|role=IGL|join=2025-02-28}}
{{SquadPerson|id=GBRUTE|name=Gleb Volodin|flag=Russia|role=Sniper|join=2025-05-20}}
{{SquadPerson|id=|name=Ghost|flag=Algeria|role=Sub}}

== Organization ==
{{SquadPerson|id=Nisso|name=Nisso Younes|flag=Algeria|role=Manager|join=2023-11-20}}

== Achievements ==
{{Achievement|date=2024-04-13|place=1st|tournament=[[MENA Cup 2024]]|tier=A-Tier|prize=$5,000}}
{{Achievement|date=2025-10-12|place=2nd|tournament=Algeria Open|tier=B-Tier|prize=$1,200}}
{{Achievement|date=|place=|tournament=}}
`;

describe("normalizeCountry", () => {
  it("maps full names to ISO alpha-2", () => {
    expect(normalizeCountry("Algeria")).toBe("DZ");
    expect(normalizeCountry("Libya")).toBe("LY");
    expect(normalizeCountry("Iraq")).toBe("IQ");
    expect(normalizeCountry("Russia")).toBe("RU");
  });
  it("returns undefined for empty / unknown", () => {
    expect(normalizeCountry(undefined)).toBeUndefined();
    expect(normalizeCountry("")).toBeUndefined();
    expect(normalizeCountry("Atlantis")).toBeUndefined();
  });
  it("strips wiki/template syntax", () => {
    expect(normalizeCountry("{{flag|Algeria}}")).toBe("DZ");
  });
});

describe("normalizeDate", () => {
  it("passes through ISO", () => {
    expect(normalizeDate("2024-04-13")).toBe("2024-04-13");
  });
  it("zero-pads short components", () => {
    expect(normalizeDate("2024-4-3")).toBe("2024-04-03");
  });
  it("parses long-form dates", () => {
    expect(normalizeDate("April 13, 2024")).toBe("2024-04-13");
  });
  it("returns undefined for empty / garbage", () => {
    expect(normalizeDate(undefined)).toBeUndefined();
    expect(normalizeDate("")).toBeUndefined();
    expect(normalizeDate("not-a-date")).toBeUndefined();
  });
});

describe("parseInfobox", () => {
  it("extracts founded date, region, location, and socials", () => {
    const result = parseInfobox(FIXTURE_WIKITEXT);
    expect(result.foundedDate).toBe("2023-11-20");
    expect(result.region).toBe("MENA");
    expect(result.location).toContain("Algeria");
    expect(result.socials.x).toBe("silenthellgg");
    expect(result.socials.youtube).toBe("silenthellesports");
  });

  it("returns empty socials and undefined fields when no infobox is present", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = parseInfobox("== No infobox here ==\nplain text");
    expect(result.foundedDate).toBeUndefined();
    expect(result.region).toBeUndefined();
    expect(result.socials).toEqual({});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("parseRoster", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("parses each SquadPerson row, mapping country and role", () => {
    const roster = parseRoster(FIXTURE_WIKITEXT);
    // 4 valid rows (FaRoK, ALA, GBRUTE, Nisso); the empty-id row is skipped
    expect(roster).toHaveLength(4);

    const farok = roster.find((r) => r.ign === "FaRoK");
    expect(farok).toBeDefined();
    expect(farok?.realName).toBe("Berima Farouk");
    expect(farok?.countryCode).toBe("DZ");
    expect(farok?.role).toBe("Analyst");
    expect(farok?.joinedAt).toBe("2024-12-28");
    expect(farok?.isActive).toBe(true);

    const gbrute = roster.find((r) => r.ign === "GBRUTE");
    expect(gbrute?.countryCode).toBe("RU");
    expect(gbrute?.role).toBe("Sniper");

    const nisso = roster.find((r) => r.ign === "Nisso");
    expect(nisso?.role).toBe("Manager");
  });

  it("skips malformed rows and warns", () => {
    parseRoster(FIXTURE_WIKITEXT);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes("missing IGN"))).toBe(true);
  });

  it("defaults role to Sub when Liquipedia gives no role", () => {
    const wt = `{{SquadPerson|id=NoRole|flag=Algeria}}`;
    const roster = parseRoster(wt);
    expect(roster).toHaveLength(1);
    expect(roster[0]?.role).toBe("Sub");
  });
});

describe("parseAchievements", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("parses each Achievement row with prize as number", () => {
    const trophies = parseAchievements(FIXTURE_WIKITEXT);
    // The empty-fields row should be skipped
    expect(trophies).toHaveLength(2);
    const first = trophies[0];
    expect(first?.tournamentName).toBe("MENA Cup 2024");
    expect(first?.placement).toBe("1st");
    expect(first?.date).toBe("2024-04-13");
    expect(first?.tier).toBe("A-Tier");
    expect(first?.prizeAmount).toBe(5000);
  });

  it("warns and skips rows missing required fields", () => {
    parseAchievements(FIXTURE_WIKITEXT);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("preserves placement strings like '3rd-4th' and '13th'", () => {
    const wt = `{{Achievement|date=2025-01-01|place=3rd-4th|tournament=Demo Cup}}
{{Achievement|date=2025-02-01|place=13th|tournament=Demo Open}}`;
    const trophies = parseAchievements(wt);
    expect(trophies).toHaveLength(2);
    expect(trophies[0]?.placement).toBe("3rd-4th");
    expect(trophies[1]?.placement).toBe("13th");
  });
});
