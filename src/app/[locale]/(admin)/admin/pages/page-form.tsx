"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPageAction,
  deletePageAction,
  updatePageAction,
  type PageInput,
} from "./actions";

interface PageFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: PageInput;
}

export function PageForm({ mode, id, locale, initial }: PageFormProps) {
  const router = useRouter();
  const [state, setState] = useState<PageInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();

  function set<K extends keyof PageInput>(key: K, value: PageInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "title" | "body" | "meta_description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPageAction(state)
          : await updatePageAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/pages`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm(`Delete page "${state.slug}" permanently?`)) return;
    startDelete(async () => {
      const result = await deletePageAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/pages`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="META">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Slug *">
            <input
              className="field"
              required
              value={state.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="about, privacy, terms"
            />
          </Field>
          <label className="mt-7 flex items-center gap-3 font-mono text-xs uppercase">
            <input
              type="checkbox"
              checked={state.is_published}
              onChange={(e) => set("is_published", e.target.checked)}
            />
            <span style={{ color: "rgba(245,240,232,0.8)" }}>Published</span>
          </label>
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
          <Field label="Meta description (EN)">
            <textarea
              rows={2}
              className="field"
              value={state.meta_description.en}
              onChange={(e) => setT("meta_description", "en", e.target.value)}
            />
          </Field>
          <Field label="Meta description (AR)">
            <textarea
              rows={2}
              className="field"
              dir="rtl"
              value={state.meta_description.ar}
              onChange={(e) => setT("meta_description", "ar", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="BODY (Markdown)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Field label="Body (EN)">
            <textarea
              rows={20}
              className="field"
              value={state.body.en}
              onChange={(e) => setT("body", "en", e.target.value)}
              placeholder="# Heading&#10;&#10;Markdown content..."
              style={{ fontFamily: "var(--font-jetbrains), monospace" }}
            />
          </Field>
          <Field label="Body (AR)">
            <textarea
              rows={20}
              className="field"
              dir="rtl"
              value={state.body.ar}
              onChange={(e) => setT("body", "ar", e.target.value)}
              placeholder="# عنوان&#10;&#10;محتوى ماركداون..."
              style={{ fontFamily: "var(--font-cairo), system-ui" }}
            />
          </Field>
        </div>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE PAGE" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/pages`)}
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
