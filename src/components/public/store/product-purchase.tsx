"use client";

// Product detail purchase block — owns the selected-variant state and wires
// "ADD TO CART" to the server action via AddToCartButton.

import { useMemo, useState, useTransition } from "react";
import { addToCartAction } from "@/lib/cart/actions";
import type { ProductVariant } from "@/types/domain";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

function sizeRank(size: string | null): number {
  if (!size) return 99;
  const idx = SIZE_ORDER.indexOf(size.toUpperCase());
  return idx === -1 ? 50 : idx;
}

export interface ProductPurchaseProps {
  productId: string;
  variants: ProductVariant[];
  isAr: boolean;
  labels: {
    selectSize: string;
    noSizes: string;
    add: string;
    pending: string;
    done: string;
    pickSizeFirst: string;
    outOfStock: string;
    addError: string;
  };
}

export function ProductPurchase({
  productId,
  variants,
  isAr,
  labels,
}: ProductPurchaseProps) {
  const sortedSized = useMemo(
    () =>
      variants
        .filter((v) => v.is_active && v.size && v.size.length > 0)
        .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
    [variants],
  );
  const oneSizeVariant = useMemo(() => {
    if (sortedSized.length > 0) return null;
    return variants.find((v) => v.is_active) ?? null;
  }, [variants, sortedSized.length]);

  const [selectedId, setSelectedId] = useState<string | null>(
    oneSizeVariant ? oneSizeVariant.id : null,
  );
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const requiresSize = sortedSized.length > 0;
  const noSelection = requiresSize && selected === null;
  const outOfStock = selected ? selected.stock_quantity <= 0 : false;
  const disabled = noSelection || outOfStock || pending;

  const arrow = isAr ? "←" : "→";
  const buttonLabel = pending
    ? labels.pending
    : done
      ? labels.done
      : outOfStock
        ? labels.outOfStock
        : noSelection
          ? labels.pickSizeFirst
          : labels.add;

  const handleClick = () => {
    if (disabled) return;
    setError(null);
    startTransition(async () => {
      const variantId = selected ? selected.id : null;
      const res = await addToCartAction(productId, variantId, 1);
      if (res.success) {
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
        window.dispatchEvent(new CustomEvent("cart-changed"));
      } else {
        setError(res.error || labels.addError);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          {requiresSize ? labels.selectSize : labels.noSizes}
        </div>
        {requiresSize ? (
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={labels.selectSize}>
            {sortedSized.map((variant) => {
              const out = variant.stock_quantity <= 0;
              const active = selectedId === variant.id;
              const interactive = !out;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={out}
                  onClick={() => {
                    if (interactive) setSelectedId(variant.id);
                  }}
                  className="font-mono inline-flex min-w-[3rem] cursor-pointer items-center justify-center px-4 py-2 text-xs tracking-[0.2em] uppercase transition-colors select-none"
                  style={{
                    background: active
                      ? "var(--hell-red)"
                      : out
                        ? "var(--ash-3)"
                        : "var(--ash-1)",
                    color: out
                      ? "rgba(245,240,232,0.35)"
                      : active
                        ? "var(--bone)"
                        : "var(--bone)",
                    border:
                      "1px solid " +
                      (active
                        ? "var(--hell-red)"
                        : out
                          ? "rgba(245,240,232,0.08)"
                          : "rgba(230,0,19,0.4)"),
                    textDecoration: out ? "line-through" : "none",
                    cursor: out ? "not-allowed" : "pointer",
                  }}
                >
                  {variant.size ?? "—"}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
        className="btn-hell w-full justify-center"
        style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
      >
        <span>{buttonLabel}</span>
        <span aria-hidden>{arrow}</span>
      </button>

      {error ? (
        <div
          role="alert"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
