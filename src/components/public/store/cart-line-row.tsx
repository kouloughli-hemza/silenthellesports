"use client";

// Quantity controls + remove for a single cart line. Calls server actions
// directly. Pending state disables the controls so we don't double-fire.

import Image from "next/image";
import { useTransition } from "react";
import { removeLineAction, updateLineAction } from "@/lib/cart/actions";

interface CartLineRowProps {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  unitPriceLabel: string;
  lineTotalLabel: string;
  imageUrl: string | null;
  quantity: number;
  available: number; // -1 = unknown
  outOfStock: boolean;
  lowStockLabel: string | null;
  isAr: boolean;
  labels: {
    qty: string;
    remove: string;
    decrement: string;
    increment: string;
    oosInline: string;
  };
  hrefDetail: string;
}

export function CartLineRow({
  productId,
  variantId,
  productName,
  variantLabel,
  unitPriceLabel,
  lineTotalLabel,
  imageUrl,
  quantity,
  available,
  outOfStock,
  lowStockLabel,
  isAr,
  labels,
  hrefDetail,
}: CartLineRowProps) {
  const [pending, startTransition] = useTransition();

  const update = (next: number) => {
    if (pending) return;
    startTransition(async () => {
      await updateLineAction(productId, variantId, next);
      window.dispatchEvent(new CustomEvent("cart-changed"));
    });
  };

  const remove = () => {
    if (pending) return;
    startTransition(async () => {
      await removeLineAction(productId, variantId);
      window.dispatchEvent(new CustomEvent("cart-changed"));
    });
  };

  const maxReached = available > -1 && quantity >= available;

  return (
    <div
      className="grid grid-cols-[64px_1fr] items-start gap-4 p-4 sm:grid-cols-[88px_1fr_auto] sm:p-5"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(230,0,19,0.2)",
        opacity: pending ? 0.7 : 1,
        transition: "opacity 150ms",
      }}
    >
      <a
        href={hrefDetail}
        className="relative block aspect-square overflow-hidden"
        style={{ background: "var(--ash-3)", border: "1px solid rgba(245,240,232,0.06)" }}
        aria-label={productName}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={productName} fill sizes="88px" className="object-cover" />
        ) : (
          <div
            className="font-mono flex h-full w-full items-center justify-center text-[9px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.3)" }}
          >
            SH
          </div>
        )}
      </a>

      <div className="min-w-0 flex-1">
        <a
          href={hrefDetail}
          className="font-display block text-sm font-black uppercase italic sm:text-base"
          style={{ color: "var(--bone)", letterSpacing: "0.02em" }}
        >
          {productName}
        </a>
        {variantLabel ? (
          <div
            className="font-mono mt-1 text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {variantLabel}
          </div>
        ) : null}
        <div
          className="font-mono mt-1 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          {unitPriceLabel}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={labels.qty}
            className="inline-flex items-center"
            style={{ border: "1px solid rgba(230,0,19,0.4)", background: "var(--ash-3)" }}
          >
            <button
              type="button"
              onClick={() => update(quantity - 1)}
              disabled={pending || quantity <= 1}
              aria-label={labels.decrement}
              className="font-mono inline-flex h-9 w-9 items-center justify-center text-base"
              style={{
                color: "var(--bone)",
                cursor: pending || quantity <= 1 ? "not-allowed" : "pointer",
                opacity: quantity <= 1 ? 0.4 : 1,
              }}
            >
              {isAr ? "+" : "−"}
            </button>
            <span
              className="font-mono inline-flex h-9 min-w-[2.5rem] items-center justify-center text-sm tabular-nums"
              style={{ color: "var(--bone)" }}
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => update(quantity + 1)}
              disabled={pending || maxReached}
              aria-label={labels.increment}
              className="font-mono inline-flex h-9 w-9 items-center justify-center text-base"
              style={{
                color: "var(--bone)",
                cursor: pending || maxReached ? "not-allowed" : "pointer",
                opacity: maxReached ? 0.4 : 1,
              }}
            >
              {isAr ? "−" : "+"}
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
            style={{
              color: "rgba(245,240,232,0.55)",
              cursor: pending ? "not-allowed" : "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {labels.remove}
          </button>
          {outOfStock ? (
            <span
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {labels.oosInline}
            </span>
          ) : lowStockLabel ? (
            <span
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "var(--ember)" }}
            >
              {lowStockLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="font-display col-start-2 mt-2 text-lg font-black italic sm:col-start-3 sm:mt-0 sm:text-2xl"
        style={{ color: "var(--hell-red)", textAlign: isAr ? "left" : "right" }}
      >
        {lineTotalLabel}
      </div>
    </div>
  );
}
