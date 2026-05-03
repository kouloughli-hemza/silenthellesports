"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createGiveawayAction,
  deleteGiveawayAction,
  updateGiveawayAction,
  type GiveawayInput,
} from "./actions";
import { GIVEAWAY_STATUSES } from "@/lib/admin/data/giveaways-enums";
import { ImageUpload } from "@/components/admin/image-upload";

interface GiveawayFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: GiveawayInput;
}

function isoToInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GiveawayForm({ mode, id, locale, initial }: GiveawayFormProps) {
  const router = useRouter();
  const [state, setState] = useState<GiveawayInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();

  function set<K extends keyof GiveawayInput>(key: K, value: GiveawayInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "title" | "description" | "prize_description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }
  function setMethodSlot(
    type: keyof GiveawayInput["entry_methods"],
    patch: Partial<GiveawayInput["entry_methods"][typeof type]>,
  ) {
    setState((s) => ({
      ...s,
      entry_methods: {
        ...s.entry_methods,
        [type]: { ...s.entry_methods[type], ...patch },
      },
    }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createGiveawayAction(state)
          : await updateGiveawayAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/giveaways`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm(`Delete giveaway "${state.slug}" permanently?`)) return;
    startDelete(async () => {
      const result = await deleteGiveawayAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/giveaways`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="IDENTITY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Slug *">
            <input
              className="field"
              required
              value={state.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="hellfire-headset-drop-3"
            />
          </Field>
          <Field label="Status *">
            <select
              className="field"
              value={state.status}
              onChange={(e) => set("status", e.target.value as GiveawayInput["status"])}
            >
              {GIVEAWAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title (EN) *">
            <input
              className="field"
              required
              value={state.title.en}
              onChange={(e) => setT("title", "en", e.target.value)}
            />
          </Field>
          <Field label="Title (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.title.ar}
              onChange={(e) => setT("title", "ar", e.target.value)}
            />
          </Field>
          <Field label="Description (EN)">
            <textarea
              rows={3}
              className="field"
              value={state.description.en}
              onChange={(e) => setT("description", "en", e.target.value)}
            />
          </Field>
          <Field label="Description (AR)">
            <textarea
              rows={3}
              className="field"
              dir="rtl"
              value={state.description.ar}
              onChange={(e) => setT("description", "ar", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="PRIZE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Prize description (EN) *">
            <input
              className="field"
              required
              value={state.prize_description.en}
              onChange={(e) => setT("prize_description", "en", e.target.value)}
            />
          </Field>
          <Field label="Prize description (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.prize_description.ar}
              onChange={(e) => setT("prize_description", "ar", e.target.value)}
            />
          </Field>
          <div className="block">
            <ImageUpload
              value={state.prize_image_url}
              onChange={(url) => set("prize_image_url", url)}
              bucket="giveaways"
              label="Prize image"
            />
          </div>
          <Field label="Estimated value">
            <input
              className="field"
              value={state.estimated_value ?? ""}
              onChange={(e) => set("estimated_value", e.target.value || null)}
              placeholder="50,000 DZD"
            />
          </Field>
        </div>
      </Section>

      <Section title="WINDOW">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Starts *">
            <input
              type="datetime-local"
              className="field"
              required
              value={isoToInput(state.starts_at)}
              onChange={(e) => set("starts_at", new Date(e.target.value).toISOString())}
            />
          </Field>
          <Field label="Ends *">
            <input
              type="datetime-local"
              className="field"
              required
              value={isoToInput(state.ends_at)}
              onChange={(e) => set("ends_at", new Date(e.target.value).toISOString())}
            />
          </Field>
          <Field label="Drop number">
            <input
              type="number"
              min={1}
              className="field"
              value={state.drop_number ?? ""}
              onChange={(e) =>
                set("drop_number", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="ENTRY METHODS">
        <p
          className="mb-4 font-mono text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          Each enabled row becomes one task on the public giveaway form.
          Paste the link the user is sent to (your X profile, the Discord
          invite, the YouTube channel, or anything for Share).
        </p>
        <div className="space-y-3">
          {([
            { key: "follow_tiktok", label: "Follow on TikTok", placeholder: "https://www.tiktok.com/@silenthell.esports" },
            { key: "join_discord", label: "Join Discord", placeholder: "https://discord.gg/silenthell" },
            { key: "subscribe_youtube", label: "Subscribe on YouTube", placeholder: "https://youtube.com/@SilentHellEsports" },
            { key: "share", label: "Share with squad", placeholder: "https://silenthellesports.com/giveaways" },
          ] as const).map(({ key, label, placeholder }) => {
            const slot = state.entry_methods[key];
            return (
              <div
                key={key}
                className="grid items-center gap-3 md:grid-cols-[200px_1fr]"
                style={{
                  background: "var(--ash-3)",
                  padding: 12,
                  border: "1px solid rgba(245,240,232,0.06)",
                }}
              >
                <label className="flex items-center gap-3 font-mono text-xs uppercase">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) => setMethodSlot(key, { enabled: e.target.checked })}
                  />
                  <span style={{ color: "rgba(245,240,232,0.85)" }}>{label}</span>
                </label>
                <input
                  className="field"
                  type="url"
                  disabled={!slot.enabled}
                  value={slot.url}
                  onChange={(e) => setMethodSlot(key, { url: e.target.value })}
                  placeholder={placeholder}
                  style={{ opacity: slot.enabled ? 1 : 0.45 }}
                />
              </div>
            );
          })}
        </div>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE GIVEAWAY" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/giveaways`)}
        >
          CANCEL
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={delPending}
            onClick={onDelete}
            className="font-mono text-[11px] tracking-[0.2em] uppercase ml-auto"
            style={{
              color: "var(--hell-red)",
              border: "1px solid var(--hell-red)",
              padding: "10px 16px",
            }}
          >
            {delPending ? "…" : "DELETE"}
          </button>
        ) : null}
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
