"use client";

import { useState, useTransition } from "react";

import { sendContactMessageAction, type ContactInput } from "@/lib/contact/actions";

export interface ContactFormI18n {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  required: string;
  tooShort: string;
  invalidEmail: string;
  error: string;
}

interface ContactFormProps {
  i18n: ContactFormI18n;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ i18n }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function validate(): string | null {
    if (!name.trim()) return i18n.required;
    if (!EMAIL_RE.test(email)) return i18n.invalidEmail;
    if (subject.trim().length < 2) return i18n.required;
    if (message.trim().length < 10) return i18n.tooShort;
    return null;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    const payload: ContactInput = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      website,
    };
    startTransition(async () => {
      const result = await sendContactMessageAction(payload);
      if (!result.success) {
        setError(result.error || i18n.error);
        return;
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            {i18n.nameLabel}
          </label>
          <input
            id="contact-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            placeholder={i18n.namePlaceholder}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">
            {i18n.emailLabel}
          </label>
          <input
            id="contact-email"
            className="field"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder={i18n.emailPlaceholder}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="field-label">
          {i18n.subjectLabel}
        </label>
        <input
          id="contact-subject"
          className="field"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder={i18n.subjectPlaceholder}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          {i18n.messageLabel}
        </label>
        <textarea
          id="contact-message"
          className="field"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder={i18n.messagePlaceholder}
        />
      </div>

      {/* Honeypot — hidden from users, attractive to bots. */}
      <div aria-hidden style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error ? (
        <div className="field-error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: "var(--ember)" }}
          role="status"
        >
          {i18n.success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-hell w-full justify-center"
        style={{ opacity: pending ? 0.6 : 1, cursor: pending ? "not-allowed" : "pointer" }}
      >
        {pending ? i18n.submitting : i18n.submit}
      </button>
    </form>
  );
}
