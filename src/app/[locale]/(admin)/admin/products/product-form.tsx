"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type ProductInput,
} from "./actions";
import { PRODUCT_CATEGORIES } from "@/lib/admin/data/products-enums";
import { ImageUploadList } from "@/components/admin/image-upload";

interface PlayerOption {
  id: string;
  ign: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: ProductInput;
  players: PlayerOption[];
}

export function ProductForm({ mode, id, locale, initial, players }: ProductFormProps) {
  const router = useRouter();
  const [state, setState] = useState<ProductInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "name" | "description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProductAction(state)
          : await updateProductAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/products`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm(`Delete product "${state.slug}" permanently?`)) return;
    startDelete(async () => {
      const result = await deleteProductAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/products`);
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
              placeholder="hellfire-tee-2026"
            />
          </Field>
          <Field label="Category *">
            <select
              className="field"
              value={state.category}
              onChange={(e) => set("category", e.target.value as ProductInput["category"])}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name (EN) *">
            <input
              className="field"
              required
              value={state.name.en}
              onChange={(e) => setT("name", "en", e.target.value)}
            />
          </Field>
          <Field label="Name (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.name.ar}
              onChange={(e) => setT("name", "ar", e.target.value)}
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
        </div>
      </Section>

      <Section title="PRICE & SHIPPING">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Base price (DZD) *">
            <input
              type="number"
              min={0}
              className="field"
              value={state.base_price}
              onChange={(e) => set("base_price", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Weight (grams) *">
            <input
              type="number"
              min={1}
              className="field"
              value={state.weight_grams}
              onChange={(e) => set("weight_grams", Number(e.target.value) || 1)}
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
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Worn by player">
            <select
              className="field"
              value={state.worn_by_player_id ?? ""}
              onChange={(e) => set("worn_by_player_id", e.target.value || null)}
            >
              <option value="">— none —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ign}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end gap-6 pl-1">
            <label className="flex items-center gap-3 font-mono text-xs uppercase">
              <input
                type="checkbox"
                checked={state.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              <span style={{ color: "rgba(245,240,232,0.8)" }}>Active</span>
            </label>
            <label className="flex items-center gap-3 font-mono text-xs uppercase">
              <input
                type="checkbox"
                checked={state.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
              />
              <span style={{ color: "rgba(245,240,232,0.8)" }}>Featured</span>
            </label>
          </div>
        </div>
      </Section>

      <Section title="IMAGES">
        <ImageUploadList
          value={state.images}
          onChange={(urls) => set("images", urls)}
          bucket="products"
          max={10}
          label="Drag-order with arrows. Max 10."
        />
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE PRODUCT" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/products`)}
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
