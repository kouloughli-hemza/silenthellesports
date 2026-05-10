"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addVariantAction,
  deleteVariantAction,
  updateVariantAction,
} from "@/lib/admin/actions/products";
import type { ProductVariant } from "@/lib/admin/data/products";

interface VariantsEditorProps {
  productId: string;
  variants: ProductVariant[];
}

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export function VariantsEditor({ productId, variants }: VariantsEditorProps) {
  return (
    <section className="notch mt-8 p-5" style={{ background: "var(--ash-1)" }}>
      <div
        className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// VARIANTS (${variants.length})`}
      </div>
      <p
        className="mb-4 max-w-2xl font-mono text-[11px] tracking-[0.15em]"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        Each variant is a sellable SKU — usually one per size. The size text
        controls what shows on the public size buttons (XS through 5XL sort
        in order; anything else lands at the end). Set stock to 0 to grey
        out a size as &quot;OUT&quot; without deleting it.
      </p>

      {variants.length > 0 ? (
        <div className="space-y-3">
          {variants.map((v) => (
            <ExistingVariantRow key={v.id} productId={productId} variant={v} />
          ))}
        </div>
      ) : (
        <p
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          No variants yet. Add one below — the public &quot;ADD TO CART&quot;
          button only enables when at least one variant exists.
        </p>
      )}

      <div className="mt-6">
        <div
          className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {"// ADD VARIANT"}
        </div>
        <NewVariantRow productId={productId} />
      </div>
    </section>
  );
}

function ExistingVariantRow({
  productId,
  variant,
}: {
  productId: string;
  variant: ProductVariant;
}) {
  const router = useRouter();
  const [sku, setSku] = useState(variant.sku);
  const [size, setSize] = useState(variant.size ?? "");
  const [color, setColor] = useState(variant.color ?? "");
  const [priceOverride, setPriceOverride] = useState(
    variant.price_override === null ? "" : String(variant.price_override),
  );
  const [stock, setStock] = useState(String(variant.stock_quantity));
  const [active, setActive] = useState(variant.is_active);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("product_id", productId);
    fd.set("sku", sku);
    fd.set("size", size);
    fd.set("color", color);
    fd.set("price_override", priceOverride);
    fd.set("stock_quantity", stock);
    if (active) fd.set("is_active", "on");
    return fd;
  }

  function onSave() {
    setError(null);
    startSave(async () => {
      const result = await updateVariantAction(variant.id, buildFormData());
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete variant "${variant.sku}"? This can't be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteVariantAction(variant.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr_0.7fr_0.6fr_auto] md:items-end"
      style={{
        background: "var(--ash-3)",
        border: "1px solid rgba(245,240,232,0.06)",
      }}
    >
      <Field label="SKU">
        <input className="field" value={sku} onChange={(e) => setSku(e.target.value)} />
      </Field>
      <Field label="Size">
        <input
          className="field"
          value={size}
          list={`size-suggestions-${variant.id}`}
          onChange={(e) => setSize(e.target.value.toUpperCase())}
          placeholder="L / XL / 2XL"
        />
        <datalist id={`size-suggestions-${variant.id}`}>
          {SIZE_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <Field label="Color">
        <input
          className="field"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="optional"
        />
      </Field>
      <Field label="Price override (DZD)">
        <input
          className="field"
          inputMode="numeric"
          value={priceOverride}
          onChange={(e) => setPriceOverride(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="empty = base price"
        />
      </Field>
      <Field label="Stock">
        <input
          className="field"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <label className="flex h-[40px] items-center gap-2 font-mono text-[11px] uppercase">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={savePending}
          className="btn-hell"
          style={{ padding: "10px 16px", fontSize: 11 }}
        >
          {savePending ? "…" : savedFlash ? "SAVED" : "SAVE"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deletePending}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{
            color: "var(--hell-red)",
            border: "1px solid var(--hell-red)",
            padding: "9px 12px",
          }}
        >
          {deletePending ? "…" : "DEL"}
        </button>
      </div>
      {error ? (
        <div className="field-error md:col-span-7">{error}</div>
      ) : null}
    </div>
  );
}

function NewVariantRow({ productId }: { productId: string }) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [stock, setStock] = useState("0");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setSku("");
    setSize("");
    setColor("");
    setPriceOverride("");
    setStock("0");
    setActive(true);
  }

  function onAdd() {
    setError(null);
    if (sku.trim().length < 2) {
      setError("SKU must be at least 2 characters.");
      return;
    }
    const fd = new FormData();
    fd.set("product_id", productId);
    fd.set("sku", sku);
    fd.set("size", size);
    fd.set("color", color);
    fd.set("price_override", priceOverride);
    fd.set("stock_quantity", stock || "0");
    if (active) fd.set("is_active", "on");
    startTransition(async () => {
      const result = await addVariantAction(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr_0.7fr_0.6fr_auto] md:items-end"
      style={{
        background: "var(--ash-3)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <Field label="SKU *">
        <input
          className="field"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="JERSEY-2025-XL"
        />
      </Field>
      <Field label="Size">
        <input
          className="field"
          value={size}
          list="new-size-suggestions"
          onChange={(e) => setSize(e.target.value.toUpperCase())}
          placeholder="XL"
        />
        <datalist id="new-size-suggestions">
          {SIZE_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </Field>
      <Field label="Color">
        <input
          className="field"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="optional"
        />
      </Field>
      <Field label="Price override (DZD)">
        <input
          className="field"
          inputMode="numeric"
          value={priceOverride}
          onChange={(e) => setPriceOverride(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="empty = base price"
        />
      </Field>
      <Field label="Stock">
        <input
          className="field"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <label className="flex h-[40px] items-center gap-2 font-mono text-[11px] uppercase">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <button
        type="button"
        onClick={onAdd}
        disabled={pending}
        className="btn-hell"
        style={{ padding: "10px 16px", fontSize: 11 }}
      >
        {pending ? "…" : "+ ADD"}
      </button>
      {error ? (
        <div className="field-error md:col-span-7">{error}</div>
      ) : null}
    </div>
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
