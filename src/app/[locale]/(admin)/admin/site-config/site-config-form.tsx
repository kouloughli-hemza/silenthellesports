"use client";

import { useState, useTransition } from "react";
import { saveSiteConfigAction, type SaveInput } from "./actions";

type T = { en: string; ar: string };
interface Initial {
  headline: { l1: T; l2: T; l3: T; l4: T };
  tagline: { en: string; ar: string };
  stats: { enemies: number; tournaments: number; kd: number; headshot: number };
  season: { en: string; ar: string };
  discordUrl: string;
  discordCount: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  drop: number;
  giveDrop: number;
  sponsors: string[];
  fromWilaya: number;
  featuredEnds: string;
  ucAccounts: {
    baridimob: { account_number: string; account_name: string; extra: string };
    ccp: {
      account_number: string;
      account_name: string;
      rip_key: string;
      extra: string;
    };
  };
}

export function SiteConfigForm({ initial }: { initial: Initial }) {
  const [state, setState] = useState<Initial>(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setStat(field: keyof Initial["stats"], value: number) {
    setState((s) => ({ ...s, stats: { ...s.stats, [field]: value } }));
  }

  function setT(field: "tagline" | "season", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function setHeadline(line: "l1" | "l2" | "l3" | "l4", lang: "en" | "ar", value: string) {
    setState((s) => ({
      ...s,
      headline: { ...s.headline, [line]: { ...s.headline[line], [lang]: value } },
    }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const input: SaveInput = state;
    startTransition(async () => {
      const result = await saveSiteConfigAction(input);
      if (!result.success) setError(result.error);
      else setSuccess(`Saved ${result.data.saved} keys.`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <Section title="HERO HEADLINE">
        <p
          className="mb-3 font-mono text-[10px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          {`// 4 lines stacked. Line 2 paints in red. Line 4 renders italic.`}
        </p>
        {(["l1", "l2", "l3", "l4"] as const).map((line, i) => (
          <div key={line} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label={`Line ${i + 1} (EN)`}>
              <input
                className="field"
                value={state.headline[line].en}
                onChange={(e) => setHeadline(line, "en", e.target.value)}
              />
            </Field>
            <Field label={`Line ${i + 1} (AR)`}>
              <input
                className="field"
                dir="rtl"
                value={state.headline[line].ar}
                onChange={(e) => setHeadline(line, "ar", e.target.value)}
              />
            </Field>
          </div>
        ))}
      </Section>

      <Section title="HERO">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Tagline (EN)">
            <input
              className="field"
              value={state.tagline.en}
              onChange={(e) => setT("tagline", "en", e.target.value)}
            />
          </Field>
          <Field label="Tagline (AR)">
            <input
              className="field"
              dir="rtl"
              value={state.tagline.ar}
              onChange={(e) => setT("tagline", "ar", e.target.value)}
            />
          </Field>
          <Field label="Season (EN)">
            <input
              className="field"
              value={state.season.en}
              onChange={(e) => setT("season", "en", e.target.value)}
            />
          </Field>
          <Field label="Season (AR)">
            <input
              className="field"
              dir="rtl"
              value={state.season.ar}
              onChange={(e) => setT("season", "ar", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Enemies">
            <input
              type="number"
              className="field"
              value={state.stats.enemies}
              onChange={(e) => setStat("enemies", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Tournaments">
            <input
              type="number"
              className="field"
              value={state.stats.tournaments}
              onChange={(e) => setStat("tournaments", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="K/D">
            <input
              type="number"
              step="0.01"
              className="field"
              value={state.stats.kd}
              onChange={(e) => setStat("kd", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Headshot %">
            <input
              type="number"
              className="field"
              value={state.stats.headshot}
              onChange={(e) => setStat("headshot", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Section>

      <Section title="SOCIALS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Discord URL">
            <input
              className="field"
              type="url"
              value={state.discordUrl}
              onChange={(e) => set("discordUrl", e.target.value)}
            />
          </Field>
          <Field label="Discord member count">
            <input
              className="field"
              value={state.discordCount}
              onChange={(e) => set("discordCount", e.target.value)}
            />
          </Field>
          <Field label="YouTube channel">
            <input
              className="field"
              value={state.youtube}
              onChange={(e) => set("youtube", e.target.value)}
            />
          </Field>
          <Field label="Instagram handle">
            <input
              className="field"
              value={state.instagram}
              onChange={(e) => set("instagram", e.target.value)}
            />
          </Field>
          <Field label="TikTok handle">
            <input
              className="field"
              value={state.tiktok}
              onChange={(e) => set("tiktok", e.target.value)}
              placeholder="@silenthell.esports"
            />
          </Field>
        </div>
      </Section>

      <Section title="STORE & GIVEAWAY">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Store drop number">
            <input
              type="number"
              className="field"
              value={state.drop}
              onChange={(e) => set("drop", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Giveaway drop number">
            <input
              type="number"
              className="field"
              value={state.giveDrop}
              onChange={(e) => set("giveDrop", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Featured ends (ISO)">
            <input
              className="field"
              value={state.featuredEnds}
              onChange={(e) => set("featuredEnds", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="SHIPPING">
        <Field label="From wilaya (1–58)">
          <input
            type="number"
            min={1}
            max={58}
            className="field"
            style={{ width: 120 }}
            value={state.fromWilaya}
            onChange={(e) => set("fromWilaya", Number(e.target.value) || 16)}
          />
        </Field>
      </Section>

      <Section title="UC PAYMENT ACCOUNTS">
        <p
          className="mb-3 font-mono text-[10px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          {`// Shown on /uc-recharge so customers know where to send the money.`}
        </p>
        <div className="space-y-4">
          <div>
            <div
              className="mb-2 font-mono text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "var(--ember)" }}
            >
              BARIDIMOB
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Account number / phone">
                <input
                  className="field"
                  value={state.ucAccounts.baridimob.account_number}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ucAccounts: {
                        ...s.ucAccounts,
                        baridimob: {
                          ...s.ucAccounts.baridimob,
                          account_number: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="00799999 0123456789"
                />
              </Field>
              <Field label="Account holder name">
                <input
                  className="field"
                  value={state.ucAccounts.baridimob.account_name}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ucAccounts: {
                        ...s.ucAccounts,
                        baridimob: {
                          ...s.ucAccounts.baridimob,
                          account_name: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="SILENT HELL ESPORTS"
                />
              </Field>
            </div>
            <Field label="Notes / extra (optional)">
              <input
                className="field"
                value={state.ucAccounts.baridimob.extra}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    ucAccounts: {
                      ...s.ucAccounts,
                      baridimob: {
                        ...s.ucAccounts.baridimob,
                        extra: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="anything else customers should know"
              />
            </Field>
          </div>

          <div>
            <div
              className="mb-2 font-mono text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "var(--ember)" }}
            >
              CCP / POSTAL
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="CCP number">
                <input
                  className="field"
                  value={state.ucAccounts.ccp.account_number}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ucAccounts: {
                        ...s.ucAccounts,
                        ccp: {
                          ...s.ucAccounts.ccp,
                          account_number: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="1234567 89"
                />
              </Field>
              <Field label="Clé (RIP key)">
                <input
                  className="field"
                  value={state.ucAccounts.ccp.rip_key}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ucAccounts: {
                        ...s.ucAccounts,
                        ccp: { ...s.ucAccounts.ccp, rip_key: e.target.value },
                      },
                    }))
                  }
                  placeholder="12"
                />
              </Field>
              <Field label="Account holder name">
                <input
                  className="field"
                  value={state.ucAccounts.ccp.account_name}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ucAccounts: {
                        ...s.ucAccounts,
                        ccp: {
                          ...s.ucAccounts.ccp,
                          account_name: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="SILENT HELL ESPORTS"
                />
              </Field>
            </div>
            <Field label="Notes / extra (optional)">
              <input
                className="field"
                value={state.ucAccounts.ccp.extra}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    ucAccounts: {
                      ...s.ucAccounts,
                      ccp: { ...s.ucAccounts.ccp, extra: e.target.value },
                    },
                  }))
                }
                placeholder="anything else customers should know"
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="SPONSORS">
        <Field label="One per line">
          <textarea
            rows={6}
            className="field"
            value={state.sponsors.join("\n")}
            onChange={(e) =>
              set(
                "sponsors",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}
      {success ? (
        <div
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "var(--ember)" }}
        >
          {success}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
        {pending ? "SAVING…" : "SAVE ALL"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="notch p-5" style={{ background: "var(--ash-1)" }}>
      <div
        className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// ${title}`}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
