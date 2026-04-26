"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { drawWinnerAction } from "./actions";

export function DrawWinnerButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [winner, setWinner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onDraw() {
    if (!confirm("Pick a random winner now? This marks the giveaway completed.")) return;
    setError(null);
    setWinner(null);
    startTransition(async () => {
      const result = await drawWinnerAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setWinner(result.data.winnerEmail);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={onDraw}
        className="btn-hell"
        style={{ padding: "10px 18px", fontSize: 12 }}
      >
        {pending ? "DRAWING…" : "DRAW WINNER"}
      </button>
      {winner ? (
        <div className="mt-3 font-mono text-xs" style={{ color: "var(--ember)" }}>
          Winner: {winner}
        </div>
      ) : null}
      {error ? <div className="mt-3 field-error">{error}</div> : null}
    </div>
  );
}
