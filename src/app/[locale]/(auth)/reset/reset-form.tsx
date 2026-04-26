"use client";

import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/lib/auth/actions";

interface ResetFormProps {
  labels: { email: string; submit: string; submitting: string };
}

export function ResetForm({ labels }: ResetFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (!result.success) setError(result.error);
      else setSuccess(result.data.message);
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="field-label">
          {labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? <div className="field-error">{error}</div> : null}
      {success ? (
        <div
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "var(--ember)" }}
        >
          {success}
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="btn-hell w-full justify-center">
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
