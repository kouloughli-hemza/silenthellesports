"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ImageUpload } from "@/components/admin/image-upload";
import {
  createGalleryImageAction,
  deleteGalleryImageAction,
  updateGalleryImageAction,
  type GalleryImageInput,
} from "./actions";

interface GalleryFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: GalleryImageInput;
}

export function GalleryForm({ mode, id, locale, initial }: GalleryFormProps) {
  const router = useRouter();
  const [state, setState] = useState<GalleryImageInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingPending, startDelete] = useTransition();

  function set<K extends keyof GalleryImageInput>(key: K, value: GalleryImageInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "caption" | "meta", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createGalleryImageAction(state)
          : await updateGalleryImageAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/gallery`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm("Delete this gallery image permanently?")) return;
    startDelete(async () => {
      const result = await deleteGalleryImageAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/gallery`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="PHOTO">
        <ImageUpload
          value={state.image_url || null}
          onChange={(url) => set("image_url", url ?? "")}
          bucket="gallery"
          label="Photo (4:5 portrait works best — fills the cinematic frame)"
        />
      </Section>

      <Section title="CAPTION">
        <p
          className="mb-3 font-mono text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          Big bold line shown at the bottom of the frame. Short — 1–3 words.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Caption (EN)">
            <input
              className="field"
              value={state.caption.en}
              onChange={(e) => setT("caption", "en", e.target.value)}
              placeholder="MAIN STAGE"
            />
          </Field>
          <Field label="Caption (AR)">
            <input
              className="field"
              dir="rtl"
              value={state.caption.ar}
              onChange={(e) => setT("caption", "ar", e.target.value)}
              placeholder="المسرح الرئيسي"
            />
          </Field>
        </div>
      </Section>

      <Section title="SUB-LINE">
        <p
          className="mb-3 font-mono text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          Small mono line above the caption — event tag, date, location.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Sub-line (EN)">
            <input
              className="field"
              value={state.meta.en}
              onChange={(e) => setT("meta", "en", e.target.value)}
              placeholder="PMGC FINAL · ALGIERS · 2025"
            />
          </Field>
          <Field label="Sub-line (AR)">
            <input
              className="field"
              dir="rtl"
              value={state.meta.ar}
              onChange={(e) => setT("meta", "ar", e.target.value)}
              placeholder="نهائي PMGC · الجزائر · ٢٠٢٥"
            />
          </Field>
        </div>
      </Section>

      <Section title="HUD STRIP (OPTIONAL)">
        <p
          className="mb-3 font-mono text-[11px] tracking-[0.15em]"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          Combat-HUD style strip above the caption. Leave any field blank
          and the frame falls back to a dash for that slot.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Heading">
            <input
              className="field"
              value={state.hud_heading ?? ""}
              onChange={(e) => set("hud_heading", e.target.value || null)}
              placeholder="047°"
            />
          </Field>
          <Field label="Zone">
            <input
              className="field"
              value={state.hud_zone ?? ""}
              onChange={(e) => set("hud_zone", e.target.value || null)}
              placeholder="ZONE 3"
            />
          </Field>
          <Field label="Signal">
            <input
              className="field"
              value={state.hud_signal ?? ""}
              onChange={(e) => set("hud_signal", e.target.value || null)}
              placeholder="98%"
            />
          </Field>
        </div>
      </Section>

      <Section title="ORDERING & VISIBILITY">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Display order">
            <input
              type="number"
              min={0}
              className="field"
              value={state.display_order}
              onChange={(e) => set("display_order", Number(e.target.value) || 0)}
            />
          </Field>
          <label className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              checked={state.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
            />
            <span
              className="font-mono text-[11px] tracking-[0.2em] uppercase"
              style={{ color: "var(--bone)" }}
            >
              Active — show in the hero gallery
            </span>
          </label>
        </div>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "ADD PHOTO" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/gallery`)}
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
