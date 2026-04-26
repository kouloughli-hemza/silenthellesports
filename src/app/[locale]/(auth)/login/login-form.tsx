"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/i18n/routing";
import { signInAction } from "@/lib/auth/actions";

interface LoginFormProps {
  labels: {
    email: string;
    password: string;
    submit: string;
    submitting: string;
  };
}

export function LoginForm({ labels }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/account");
      router.refresh();
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
      <div>
        <label htmlFor="password" className="field-label">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="field"
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? <div className="field-error">{error}</div> : null}
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
