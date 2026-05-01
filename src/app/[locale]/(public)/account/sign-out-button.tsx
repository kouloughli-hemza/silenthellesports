"use client";

import { useTransition } from "react";
import { signOutAction } from "@/lib/auth/actions";

interface SignOutButtonProps {
  label: string;
}

export function SignOutButton({ label }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          window.dispatchEvent(new CustomEvent("auth-changed"));
        })
      }
      disabled={pending}
      className="font-mono text-[11px] tracking-[0.25em] uppercase transition-colors interactive"
      style={{
        background: "var(--ash-3)",
        color: "var(--bone)",
        border: "1px solid rgba(230,0,19,0.4)",
        padding: "10px 18px",
      }}
    >
      {label}
    </button>
  );
}
