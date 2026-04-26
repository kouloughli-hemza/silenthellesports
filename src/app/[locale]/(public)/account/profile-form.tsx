"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import { ALGERIAN_PHONE_RE } from "@/types/domain";

export interface ProfileFormLabels {
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  save: string;
  saving: string;
  saved: string;
  phoneInvalid: string;
  genericError: string;
}

interface ProfileFormProps {
  initialFullName: string;
  initialPhone: string;
  email: string;
  labels: ProfileFormLabels;
}

export function ProfileForm({
  initialFullName,
  initialPhone,
  email,
  labels,
}: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Lightweight client-side check; server is the source of truth.
    const phone = String(formData.get("phone") ?? "").trim();
    if (phone.length > 0 && !ALGERIAN_PHONE_RE.test(phone)) {
      setError(labels.phoneInvalid);
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.success) {
        setError(result.error || labels.genericError);
        return;
      }
      setSuccess(labels.saved);
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      <div>
        <label htmlFor="profile_email" className="field-label">
          {labels.email}
        </label>
        <input
          id="profile_email"
          name="email_readonly"
          type="email"
          value={email}
          readOnly
          disabled
          className="field"
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        />
      </div>
      <div>
        <label htmlFor="profile_full_name" className="field-label">
          {labels.name}
        </label>
        <input
          id="profile_full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialFullName}
          className="field"
          aria-invalid={Boolean(error)}
        />
      </div>
      <div>
        <label htmlFor="profile_phone" className="field-label">
          {labels.phone}
        </label>
        <input
          id="profile_phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          pattern="0[567][0-9]{8}"
          maxLength={10}
          defaultValue={initialPhone}
          placeholder="0XXXXXXXXX"
          className="field"
          aria-invalid={Boolean(error)}
          aria-describedby="profile_phone_hint"
        />
        <p
          id="profile_phone_hint"
          className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.4)" }}
        >
          {labels.phoneHint}
        </p>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
      {success ? (
        <div
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "var(--ember)" }}
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-hell w-full justify-center"
      >
        {pending ? labels.saving : labels.save}
      </button>
    </form>
  );
}
