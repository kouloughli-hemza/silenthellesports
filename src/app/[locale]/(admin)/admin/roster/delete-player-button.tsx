"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlayerAction } from "./actions";

interface DeletePlayerButtonProps {
  id: string;
  ign: string;
  locale: string;
}

export function DeletePlayerButton({ id, ign, locale }: DeletePlayerButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deletePlayerAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/roster`);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="font-mono text-[10px] tracking-[0.2em] uppercase"
        style={{
          color: "var(--hell-red)",
          border: "1px solid var(--hell-red)",
          padding: "8px 14px",
        }}
        onClick={() => setConfirming(true)}
      >
        DELETE
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px]" style={{ color: "var(--bone)" }}>
        Delete <strong>{ign}</strong>?
      </span>
      <button
        type="button"
        disabled={pending}
        className="btn-hell"
        style={{ padding: "6px 14px", fontSize: 11 }}
        onClick={onDelete}
      >
        {pending ? "…" : "CONFIRM"}
      </button>
      <button
        type="button"
        className="btn-ghost"
        style={{ padding: "6px 14px", fontSize: 11 }}
        onClick={() => setConfirming(false)}
      >
        CANCEL
      </button>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
