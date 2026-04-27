"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
  type EventInput,
} from "./actions";
import { ImageUpload } from "@/components/admin/image-upload";

interface EventFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: EventInput;
}

const STATUSES = ["upcoming", "open", "closed", "live", "completed", "cancelled"] as const;
const MODES = ["Solo", "Duo", "Squad"] as const;

function isoToInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ mode, id, locale, initial }: EventFormProps) {
  const router = useRouter();
  const [state, setState] = useState<EventInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();

  function set<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "title" | "description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }
  function setRule(idx: number, lang: "en" | "ar", value: string) {
    setState((s) => {
      const next = s.rules.map((r, i) =>
        i === idx ? { ...r, [lang]: value } : r,
      );
      return { ...s, rules: next };
    });
  }
  function addRule() {
    setState((s) => ({ ...s, rules: [...s.rules, { en: "", ar: "" }] }));
  }
  function removeRule(idx: number) {
    setState((s) => ({ ...s, rules: s.rules.filter((_, i) => i !== idx) }));
  }
  function setMap(idx: number, value: string) {
    setState((s) => {
      const next = [...s.maps];
      next[idx] = value;
      return { ...s, maps: next };
    });
  }
  function addMap() {
    setState((s) =>
      s.maps.length >= 5 ? s : { ...s, maps: [...s.maps, ""] },
    );
  }
  function removeMap(idx: number) {
    setState((s) => ({ ...s, maps: s.maps.filter((_, i) => i !== idx) }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEventAction(state)
          : await updateEventAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/events`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm(`Delete event "${state.slug}" permanently? Signups will also be removed.`)) return;
    startDelete(async () => {
      const result = await deleteEventAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/events`);
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
              placeholder="hellfire-cup-march-26"
            />
          </Field>
          <Field label="Status *">
            <select
              className="field"
              value={state.status}
              onChange={(e) => set("status", e.target.value as EventInput["status"])}
            >
              {STATUSES.map((s) => (
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
              rows={4}
              className="field"
              value={state.description.en}
              onChange={(e) => setT("description", "en", e.target.value)}
            />
          </Field>
          <Field label="Description (AR)">
            <textarea
              rows={4}
              className="field"
              dir="rtl"
              value={state.description.ar}
              onChange={(e) => setT("description", "ar", e.target.value)}
            />
          </Field>
          <div className="block">
            <ImageUpload
              value={state.cover_image_url}
              onChange={(url) => set("cover_image_url", url)}
              bucket="events"
              label="Cover image"
            />
          </div>
          <Field label="Tag">
            <input
              className="field"
              value={state.tag ?? ""}
              onChange={(e) => set("tag", e.target.value || null)}
              placeholder="featured / qualifier / friendly"
            />
          </Field>
        </div>
      </Section>

      <Section title="MATCH">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Mode *">
            <select
              className="field"
              value={state.mode}
              onChange={(e) => set("mode", e.target.value as EventInput["mode"])}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Capacity *">
            <input
              type="number"
              min={1}
              className="field"
              value={state.capacity}
              onChange={(e) => set("capacity", Number(e.target.value) || 1)}
            />
          </Field>
        </div>
        <div className="mt-4 space-y-2">
          <div className="field-label">Maps (up to 5)</div>
          {state.maps.length === 0 ? (
            <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
              No maps yet.
            </p>
          ) : null}
          {state.maps.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] tracking-[0.25em] uppercase shrink-0"
                style={{ color: "var(--hell-red)", minWidth: "1.5rem" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                className="field flex-1"
                value={m}
                onChange={(e) => setMap(i, e.target.value)}
                placeholder="Erangel / Miramar / Sanhok / Vikendi / Livik"
              />
              <button
                type="button"
                onClick={() => removeMap(i)}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--hell-red)",
                  border: "1px solid var(--hell-red)",
                  padding: "8px 12px",
                }}
                aria-label={`Remove map ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
          {state.maps.length < 5 ? (
            <button
              type="button"
              onClick={addMap}
              className="btn-ghost"
              style={{ padding: "8px 16px", fontSize: 11 }}
            >
              + ADD MAP
            </button>
          ) : null}
        </div>
      </Section>

      <Section title="MONEY">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Prize pool *">
            <input
              type="number"
              min={0}
              className="field"
              value={state.prize_pool}
              onChange={(e) => set("prize_pool", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Currency">
            <input
              className="field"
              maxLength={3}
              value={state.prize_currency}
              onChange={(e) => set("prize_currency", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Entry fee">
            <input
              type="number"
              min={0}
              className="field"
              value={state.entry_fee}
              onChange={(e) => set("entry_fee", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Section>

      <Section title="WINDOW">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Start *">
            <input
              type="datetime-local"
              className="field"
              required
              value={isoToInput(state.start_at)}
              onChange={(e) => set("start_at", new Date(e.target.value).toISOString())}
            />
          </Field>
          <Field label="Registration closes *">
            <input
              type="datetime-local"
              className="field"
              required
              value={isoToInput(state.registration_closes_at)}
              onChange={(e) =>
                set("registration_closes_at", new Date(e.target.value).toISOString())
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="RULES">
        <div className="space-y-3">
          {state.rules.length === 0 ? (
            <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
              No rules yet.
            </p>
          ) : null}
          {state.rules.map((r, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start">
              <Field label={`Rule ${i + 1} (EN)`}>
                <input
                  className="field"
                  value={r.en}
                  onChange={(e) => setRule(i, "en", e.target.value)}
                />
              </Field>
              <Field label={`Rule ${i + 1} (AR)`}>
                <input
                  className="field"
                  dir="rtl"
                  value={r.ar}
                  onChange={(e) => setRule(i, "ar", e.target.value)}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--hell-red)",
                  border: "1px solid var(--hell-red)",
                  padding: "8px 12px",
                  alignSelf: "end",
                  height: 38,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRule}
            className="btn-ghost"
            style={{ padding: "8px 16px", fontSize: 11 }}
          >
            + ADD RULE
          </button>
        </div>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE EVENT" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/events`)}
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
