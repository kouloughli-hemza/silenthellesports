"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlayerAction, updatePlayerAction, type PlayerInput } from "./actions";
import { PLAYER_ROLES } from "@/lib/admin/data/players-enums";
import { ImageUpload } from "@/components/admin/image-upload";

interface PlayerFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: PlayerInput;
}

export function PlayerForm({ mode, id, locale, initial }: PlayerFormProps) {
  const router = useRouter();
  const [state, setState] = useState<PlayerInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof PlayerInput>(key: K, value: PlayerInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setBio(lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, bio: { ...s.bio, [lang]: value } }));
  }
  function setStat(field: "kd" | "headshot" | "matches" | "chicken_dinners", value: number | undefined) {
    setState((s) => ({ ...s, stats: { ...s.stats, [field]: value } }));
  }
  function setSocial(field: "tiktok" | "liquipedia" | "instagram", value: string) {
    setState((s) => ({
      ...s,
      socials: { ...s.socials, [field]: value === "" ? undefined : value },
    }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPlayerAction(state)
          : await updatePlayerAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/roster`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="IDENTITY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="In-game name *">
            <input
              className="field"
              required
              value={state.ign}
              onChange={(e) => set("ign", e.target.value)}
            />
          </Field>
          <Field label="Real name">
            <input
              className="field"
              value={state.real_name ?? ""}
              onChange={(e) => set("real_name", e.target.value || null)}
            />
          </Field>
          <Field label="Role *">
            <select
              className="field"
              value={state.role}
              onChange={(e) => set("role", e.target.value as PlayerInput["role"])}
            >
              {PLAYER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country (ISO 2)">
            <input
              className="field"
              maxLength={2}
              value={state.country_code ?? ""}
              onChange={(e) => set("country_code", (e.target.value || null) as string | null)}
              placeholder="DZ"
            />
          </Field>
          <div className="block">
            <ImageUpload
              value={state.photo_url}
              onChange={(url) => set("photo_url", url)}
              bucket="players"
              label="Photo"
            />
          </div>
          <Field label="Signature loadout">
            <input
              className="field"
              value={state.signature_loadout ?? ""}
              onChange={(e) => set("signature_loadout", e.target.value || null)}
              placeholder="M416 + Kar98k"
            />
          </Field>
          <Field label="Highlight URL (YouTube or TikTok)">
            <input
              className="field"
              type="url"
              value={state.highlight_url ?? ""}
              onChange={(e) => set("highlight_url", e.target.value || null)}
              placeholder="https://www.youtube.com/watch?v=… or https://www.tiktok.com/@user/video/…"
            />
          </Field>
        </div>
      </Section>

      <Section title="BIO">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Bio (EN)">
            <textarea
              rows={4}
              className="field"
              value={state.bio.en}
              onChange={(e) => setBio("en", e.target.value)}
            />
          </Field>
          <Field label="Bio (AR)">
            <textarea
              rows={4}
              className="field"
              dir="rtl"
              value={state.bio.ar}
              onChange={(e) => setBio("ar", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="STATS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="K/D">
            <input
              type="number"
              step="0.01"
              className="field"
              value={state.stats.kd ?? ""}
              onChange={(e) => setStat("kd", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </Field>
          <Field label="Headshot %">
            <input
              type="number"
              className="field"
              value={state.stats.headshot ?? ""}
              onChange={(e) =>
                setStat("headshot", e.target.value === "" ? undefined : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Matches">
            <input
              type="number"
              className="field"
              value={state.stats.matches ?? ""}
              onChange={(e) =>
                setStat("matches", e.target.value === "" ? undefined : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Chicken dinners">
            <input
              type="number"
              className="field"
              value={state.stats.chicken_dinners ?? ""}
              onChange={(e) =>
                setStat(
                  "chicken_dinners",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="SOCIALS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="TikTok">
            <input
              className="field"
              placeholder="https://www.tiktok.com/@handle"
              value={state.socials.tiktok ?? ""}
              onChange={(e) => setSocial("tiktok", e.target.value)}
            />
          </Field>
          <Field label="Liquipedia">
            <input
              className="field"
              placeholder="https://liquipedia.net/pubgmobile/Player_Page"
              value={state.socials.liquipedia ?? ""}
              onChange={(e) => setSocial("liquipedia", e.target.value)}
            />
          </Field>
          <Field label="Instagram">
            <input
              className="field"
              placeholder="https://www.instagram.com/handle"
              value={state.socials.instagram ?? ""}
              onChange={(e) => setSocial("instagram", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="STATUS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Display order">
            <input
              type="number"
              min={0}
              className="field"
              value={state.display_order}
              onChange={(e) => set("display_order", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Joined">
            <input
              type="date"
              className="field"
              value={(state.joined_at ?? "").slice(0, 10)}
              onChange={(e) => set("joined_at", e.target.value || null)}
            />
          </Field>
          <Field label="Left">
            <input
              type="date"
              className="field"
              value={(state.left_at ?? "").slice(0, 10)}
              onChange={(e) => set("left_at", e.target.value || null)}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-3 font-mono text-xs uppercase">
          <input
            type="checkbox"
            checked={state.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
          />
          <span style={{ color: "rgba(245,240,232,0.8)" }}>Active in roster</span>
        </label>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE PLAYER" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/roster`)}
        >
          CANCEL
        </button>
      </div>
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
