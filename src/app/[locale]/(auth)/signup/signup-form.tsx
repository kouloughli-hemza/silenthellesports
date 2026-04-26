"use client";

import { useState, useTransition } from "react";
import { signUpAction } from "@/lib/auth/actions";

interface SignupFormProps {
  labels: {
    name: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
  };
}

export function SignupForm({ labels }: SignupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.data.message);
      form.reset();
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="full_name" className="field-label">
          {labels.name}
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          minLength={2}
          maxLength={80}
          className="field"
        />
      </div>
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
      <div>
        <label htmlFor="password" className="field-label">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
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
      <button
        type="submit"
        disabled={pending}
        className="btn-hell w-full justify-center"
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
