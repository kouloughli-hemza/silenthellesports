"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createStatAction,
  deleteStatAction,
  updateStatAction,
  type StatInput,
} from "./actions";

interface StatFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: StatInput;
}

export function StatForm({ mode, id, locale, initial }: StatFormProps) {
  const router = useRouter();
  const [state, setState] = useState<StatInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingPending, startDelete] = useTransition();

  function set<K extends keyof StatInput>(key: K, value: StatInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setLabel(lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, label: { ...s.label, [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createStatAction(state)
          : await updateStatAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/stats`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm("Delete this stat permanently?")) return;
    startDelete(async () => {
      const result = await deleteStatAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/stats`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="STAT">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Key (slug) *">
            <input
              className="field"
              required
              value={state.key}
              onChange={(e) => set("key", e.target.value.toLowerCase())}
              placeholder="total_kills / events_won / hours_grinded"
              pattern="[a-z0-9_]+"
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              min={0}
              className="field"
              value={state.display_order}
              onChange={(e) => set("display_order", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Label (EN) *">
            <input
              className="field"
              required
              value={state.label.en}
              onChange={(e) => setLabel("en", e.target.value)}
              placeholder="Total kills"
            />
          </Field>
          <Field label="Label (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.label.ar}
              onChange={(e) => setLabel("ar", e.target.value)}
            />
          </Field>
          <Field label="Value *">
            <input
              type="number"
              min={0}
              className="field"
              required
              value={state.value}
              onChange={(e) => set("value", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Suffix (e.g. + / M / h)">
            <input
              className="field"
              maxLength={8}
              value={state.suffix ?? ""}
              onChange={(e) => set("suffix", e.target.value || null)}
            />
          </Field>
        </div>
      </Section>

      <Section title="VISIBILITY">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={state.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
          />
          <span
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: "var(--bone)" }}
          >
            Published — show on the public stats wall
          </span>
        </label>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE STAT" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/stats`)}
        >
          CANCEL
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={deletingPending}
            onClick={onDelete}
            className="font-mono text-[11px] tracking-[0.2em] uppercase ml-auto"
            style={{
              color: "var(--hell-red)",
              border: "1px solid var(--hell-red)",
              padding: "10px 16px",
            }}
          >
            {deletingPending ? "…" : "DELETE"}
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
