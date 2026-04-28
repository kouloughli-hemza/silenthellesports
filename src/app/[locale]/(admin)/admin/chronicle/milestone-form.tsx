"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ImageUpload } from "@/components/admin/image-upload";
import {
  createMilestoneAction,
  deleteMilestoneAction,
  updateMilestoneAction,
  type MilestoneInput,
} from "./actions";

const CATEGORIES: MilestoneInput["category"][] = [
  "founding",
  "tournament_win",
  "roster",
  "milestone",
  "release",
  "partnership",
  "other",
];

interface MilestoneFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: MilestoneInput;
}

export function MilestoneForm({ mode, id, locale, initial }: MilestoneFormProps) {
  const router = useRouter();
  const [state, setState] = useState<MilestoneInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingPending, startDelete] = useTransition();

  function set<K extends keyof MilestoneInput>(key: K, value: MilestoneInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "title" | "description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMilestoneAction(state)
          : await updateMilestoneAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/chronicle`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm("Delete this milestone permanently?")) return;
    startDelete(async () => {
      const result = await deleteMilestoneAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/chronicle`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="WHEN & WHAT">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Date *">
            <input
              type="date"
              className="field"
              required
              value={state.occurred_on.slice(0, 10)}
              onChange={(e) => set("occurred_on", e.target.value)}
            />
          </Field>
          <Field label="Category *">
            <select
              className="field"
              value={state.category}
              onChange={(e) =>
                set("category", e.target.value as MilestoneInput["category"])
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
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
        </div>
      </Section>

      <Section title="HEADLINE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title (EN) *">
            <input
              className="field"
              required
              maxLength={100}
              value={state.title.en}
              onChange={(e) => setT("title", "en", e.target.value)}
              placeholder="e.g. Lifted the Algerian Cup"
            />
          </Field>
          <Field label="Title (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              maxLength={100}
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
              placeholder="One short paragraph that paints the moment."
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

      <Section title="VISUAL">
        <ImageUpload
          value={state.image_url}
          onChange={(url) => set("image_url", url)}
          bucket="trophies"
          label="Image (optional)"
        />
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
            Published — show on the public chronicle
          </span>
        </label>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE MILESTONE" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/chronicle`)}
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
