"use client";

// Card-level "ADD TO CART" affordance. Lives inside the wrapping product Link,
// so it must NOT render as a real <button> (nested interactive elements are
// invalid HTML). We use a role="button" span and stop click propagation.

import { useRouter } from "@/lib/i18n/routing";
import { useState, useTransition, type KeyboardEvent, type MouseEvent } from "react";
import { addToCartAction } from "@/lib/cart/actions";
import type { Locale } from "@/types/domain";

interface CardAddToCartProps {
  productId: string;
  variantId: string | null;
  hasSizes: boolean;
  outOfStock: boolean;
  productSlug: string;
  locale: Locale;
  labels: {
    add: string;
    pickSize: string;
    pending: string;
    done: string;
    outOfStock: string;
  };
  arrow: string;
}

export function CardAddToCart({
  productId,
  variantId,
  hasSizes,
  outOfStock,
  productSlug,
  locale,
  labels,
  arrow,
}: CardAddToCartProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    if (outOfStock) return;
    if (hasSizes) {
      // Sized products need size picked — bounce to detail page.
      router.push(`/store/${productSlug}`, { locale });
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addToCartAction(productId, variantId, 1);
      if (res.success) {
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
        window.dispatchEvent(new CustomEvent("cart-changed"));
      } else {
        setError(res.error);
      }
    });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      trigger(e);
    }
  };

  const label = outOfStock
    ? labels.outOfStock
    : pending
      ? labels.pending
      : done
        ? labels.done
        : hasSizes
          ? labels.pickSize
          : labels.add;

  const color = outOfStock ? "rgba(245,240,232,0.4)" : "var(--hell-red)";

  return (
    <span
      role="button"
      tabIndex={outOfStock ? -1 : 0}
      aria-disabled={outOfStock || pending}
      onClick={trigger}
      onKeyDown={onKey}
      className="font-mono interactive flex w-full items-center justify-between text-[10px] tracking-[0.25em] uppercase select-none"
      style={{
        color,
        cursor: outOfStock ? "not-allowed" : "pointer",
        opacity: outOfStock ? 0.6 : 1,
      }}
    >
      <span>{label}</span>
      <span aria-hidden>{arrow}</span>
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
