"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrophyAction, deleteTrophyAction, updateTrophyAction, type TrophyInput } from "./actions";
import { ImageUpload } from "@/components/admin/image-upload";

interface TrophyFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: TrophyInput;
}

export function TrophyForm({ mode, id, locale, initial }: TrophyFormProps) {
  const router = useRouter();
  const [state, setState] = useState<TrophyInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingPending, startDelete] = useTransition();

  function set<K extends keyof TrophyInput>(key: K, value: TrophyInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setTitle(lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, title: { ...s.title, [lang]: value } }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTrophyAction(state)
          : await updateTrophyAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/trophies`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm("Delete this trophy permanently?")) return;
    startDelete(async () => {
      const result = await deleteTrophyAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/trophies`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="TITLE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title (EN) *">
            <input
              className="field"
              required
              value={state.title.en}
              onChange={(e) => setTitle("en", e.target.value)}
            />
          </Field>
          <Field label="Title (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.title.ar}
              onChange={(e) => setTitle("ar", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="TOURNAMENT">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Tournament name *">
            <input
              className="field"
              required
              value={state.tournament_name}
              onChange={(e) => set("tournament_name", e.target.value)}
            />
          </Field>
          <Field label="Placement *">
            <input
              className="field"
              required
              value={state.placement}
              onChange={(e) => set("placement", e.target.value)}
              placeholder="1st / 2nd / 3rd / Top 8"
            />
          </Field>
          <Field label="Date *">
            <input
              type="date"
              className="field"
              required
              value={state.date.slice(0, 10)}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              min={0}
              className="field"
              value={state.display_order}
              onChange={(e) => set("display_order", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Section>

      <Section title="PRIZE">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Prize amount">
            <input
              type="number"
              className="field"
              value={state.prize_amount ?? ""}
              onChange={(e) =>
                set("prize_amount", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Currency">
            <input
              className="field"
              maxLength={3}
              value={state.prize_currency}
              onChange={(e) => set("prize_currency", e.target.value.toUpperCase())}
            />
          </Field>
          <div className="block">
            <ImageUpload
              value={state.logo_url}
              onChange={(url) => set("logo_url", url)}
              bucket="trophies"
              label="Logo"
            />
          </div>
        </div>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE TROPHY" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/trophies`)}
        >
          CANCEL
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={deletingPending}
            onClick={onDelete}
            className="font-mono text-[11px] tracking-[0.2em] uppercase ml-auto"
            style={{
              color: "var(--hell-red)",
              border: "1px solid var(--hell-red)",
              padding: "10px 16px",
            }}
          >
            {deletingPending ? "…" : "DELETE"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="notch p-5" style={{ background: "var(--ash-1)" }}>
      <div
        className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// ${title}`}
      </div>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
