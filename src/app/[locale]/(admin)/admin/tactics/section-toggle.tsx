"use client";

import { useState, useTransition } from "react";
import { setTacticsEnabledAction } from "./actions";

export function TacticsSectionToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    const next = !enabled;
    setError(null);
    startTransition(async () => {
      const r = await setTacticsEnabledAction(next);
      if (!r.success) {
        setError(r.error);
        return;
      }
      setEnabled(next);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{
          background: enabled ? "var(--hell-red)" : "transparent",
          color: enabled ? "var(--bone)" : "rgba(245,240,232,0.75)",
          border: `1px solid ${enabled ? "var(--hell-red)" : "rgba(245,240,232,0.25)"}`,
          padding: "10px 16px",
          opacity: pending ? 0.6 : 1,
        }}
        aria-pressed={enabled}
      >
        {pending ? "…" : enabled ? "● SECTION ON" : "○ SECTION OFF"}
      </button>
      <span
        className="font-mono text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        {enabled
          ? "Tactics section is visible on the home page."
          : "Tactics section is hidden from the public site."}
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
