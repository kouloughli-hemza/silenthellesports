"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/i18n/routing";
import type { Result } from "@/types/domain";

interface DeleteButtonProps {
  /** Server action that performs the actual delete. Receives the entity id. */
  action: (id: string) => Promise<Result<{ message?: string }>>;
  id: string;
  /** Where to navigate after a successful delete. Optional. */
  redirectTo?: string;
  /** Visible button label. */
  label: string;
  /** Modal title and copy. */
  title: string;
  body: string;
  /** Small label tokens for the inline form. */
  confirmHint: string;
  confirmPlaceholder: string;
  confirmCta: string;
  cancelCta: string;
  errorFallback: string;
  /** Optional CSS class override for the trigger button. */
  className?: string;
}

/**
 * Reusable "type DELETE to confirm" destructive action button.
 * Renders an inline modal — no portal, keeps RSC ergonomics simple.
 */
export function DeleteButton({
  action,
  id,
  redirectTo,
  label,
  title,
  body,
  confirmHint,
  confirmPlaceholder,
  confirmCta,
  cancelCta,
  errorFallback,
  className,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const ready = text.trim().toUpperCase() === "DELETE";

  const onConfirm = () => {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) {
        setError(result.error || errorFallback);
        return;
      }
      setOpen(false);
      setText("");
      if (redirectTo) {
        router.push(redirectTo as Parameters<typeof router.push>[0]);
      }
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "interactive font-mono text-[10px] tracking-[0.2em] uppercase"
        }
        style={{
          color: "var(--hell-red)",
          border: "1px solid rgba(230,0,19,0.4)",
          padding: "6px 10px",
          background: "transparent",
        }}
      >
        {label}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`del-title-${id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)" }}
        >
          <div
            className="w-full max-w-md p-6"
            style={{ background: "var(--ash-3)", border: "1px solid rgba(230,0,19,0.4)" }}
          >
            <h2
              id={`del-title-${id}`}
              className="font-display text-xl font-black uppercase italic"
              style={{ color: "var(--hell-red)" }}
            >
              {title}
            </h2>
            <p className="mt-3 font-mono text-xs" style={{ color: "rgba(245,240,232,0.75)" }}>
              {body}
            </p>
            <label className="field-label mt-4">{confirmHint}</label>
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={confirmPlaceholder}
              className="field"
              aria-invalid={text.length > 0 && !ready}
            />
            {error ? <div className="field-error">{error}</div> : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setText("");
                  setError(null);
                }}
                disabled={pending}
                className="interactive font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--bone)",
                  border: "1px solid rgba(245,240,232,0.2)",
                  padding: "8px 14px",
                  background: "transparent",
                }}
              >
                {cancelCta}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!ready || pending}
                className="interactive font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--bone)",
                  border: "1px solid var(--hell-red)",
                  padding: "8px 14px",
                  background: ready ? "var(--hell-red)" : "transparent",
                  opacity: ready ? 1 : 0.5,
                }}
              >
                {pending ? "…" : confirmCta}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
