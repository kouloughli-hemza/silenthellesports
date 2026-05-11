"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitUcRechargeAction } from "@/lib/uc/actions";
import type { UcPackagePublic } from "@/lib/uc/data";

interface I18n {
  pickPackage: string;
  bonusBadge: string;
  pubgIdLabel: string;
  pubgIdHelp: string;
  ignLabel: string;
  paymentMethodLabel: string;
  baridimob: string;
  ccp: string;
  paymentInstructions: string;
  transferCodeLabel: string;
  transferCodeHelp: string;
  whatsappLabel: string;
  whatsappHelp: string;
  emailLabel: string;
  emailHelp: string;
  proofLabel: string;
  proofHelp: string;
  submit: string;
  submitting: string;
  errorGeneric: string;
}

interface Props {
  packages: UcPackagePublic[];
  locale: "en" | "ar";
  i18n: I18n;
}

export function UcRechargeForm({ packages, locale, i18n }: Props) {
  const router = useRouter();
  const [packageId, setPackageId] = useState<string | null>(
    packages.length > 0 ? packages[0]!.id : null,
  );
  const [pubgId, setPubgId] = useState("");
  const [ign, setIgn] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"baridimob" | "ccp">("baridimob");
  const [transferCode, setTransferCode] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [email, setEmail] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!packageId) {
      setError(i18n.pickPackage);
      return;
    }
    if (!proofFile) {
      setError(i18n.proofLabel);
      return;
    }
    const fd = new FormData();
    fd.set("package_id", packageId);
    fd.set("pubg_id", pubgId);
    fd.set("ign", ign);
    fd.set("payment_method", paymentMethod);
    fd.set("transfer_code", transferCode);
    fd.set("whatsapp_phone", whatsappPhone);
    fd.set("email", email);
    fd.set("locale", locale);
    fd.set("proof", proofFile);

    startTransition(async () => {
      const result = await submitUcRechargeAction(fd);
      if (!result.success) {
        setError(result.error || i18n.errorGeneric);
        return;
      }
      const localePrefix = locale === "ar" ? "/ar" : "/en";
      router.push(`${localePrefix}/uc-recharge/${result.data.request_number}`);
    });
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section>
        <div
          className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// ${i18n.pickPackage}`}
        </div>
        {packages.length === 0 ? (
          <p
            className="font-mono text-[11px] tracking-[0.15em] uppercase"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            No packages available right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {packages.map((p) => {
              const active = packageId === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPackageId(p.id)}
                  className="text-left transition-colors"
                  style={{
                    background: active ? "var(--hell-red)" : "var(--ash-1)",
                    color: "var(--bone)",
                    border:
                      "1px solid " +
                      (active ? "var(--hell-red)" : "rgba(230,0,19,0.35)"),
                    padding: "14px 14px",
                  }}
                >
                  <div
                    className="font-display text-2xl font-black uppercase italic"
                    style={{ color: active ? "var(--bone)" : "var(--bone)" }}
                  >
                    {p.uc_amount} UC
                  </div>
                  {p.bonus_uc > 0 ? (
                    <div
                      className="font-mono text-[10px] tracking-[0.2em] uppercase"
                      style={{
                        color: active ? "rgba(255,255,255,0.85)" : "var(--ember)",
                      }}
                    >
                      + {p.bonus_uc} {i18n.bonusBadge}
                    </div>
                  ) : null}
                  <div
                    className="mt-2 font-mono text-sm"
                    style={{
                      color: active ? "var(--bone)" : "rgba(245,240,232,0.85)",
                    }}
                  >
                    {Number(p.price_dzd).toLocaleString()} DZD
                  </div>
                  {p.label ? (
                    <div
                      className="mt-1 font-mono text-[9px] tracking-[0.2em] uppercase"
                      style={{
                        color: active ? "rgba(255,255,255,0.85)" : "var(--ember)",
                      }}
                    >
                      {p.label}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label={i18n.pubgIdLabel} help={i18n.pubgIdHelp}>
          <input
            className="field"
            inputMode="numeric"
            value={pubgId}
            onChange={(e) => setPubgId(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="5xxxxxxxxx"
            required
          />
        </Field>
        <Field label={i18n.ignLabel}>
          <input
            className="field"
            value={ign}
            onChange={(e) => setIgn(e.target.value)}
            maxLength={32}
            required
          />
        </Field>
      </section>

      <section>
        <div
          className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// ${i18n.paymentMethodLabel}`}
        </div>
        <div className="flex flex-wrap gap-3">
          {(["baridimob", "ccp"] as const).map((m) => {
            const active = paymentMethod === m;
            return (
              <button
                type="button"
                key={m}
                onClick={() => setPaymentMethod(m)}
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{
                  background: active ? "var(--hell-red)" : "var(--ash-1)",
                  color: "var(--bone)",
                  border:
                    "1px solid " +
                    (active ? "var(--hell-red)" : "rgba(230,0,19,0.35)"),
                  padding: "10px 18px",
                }}
              >
                {m === "baridimob" ? i18n.baridimob : i18n.ccp}
              </button>
            );
          })}
        </div>
        <p
          className="mt-3 font-mono text-[11px] leading-relaxed"
          style={{ color: "rgba(245,240,232,0.6)" }}
        >
          {i18n.paymentInstructions}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label={i18n.transferCodeLabel} help={i18n.transferCodeHelp}>
          <input
            className="field"
            value={transferCode}
            onChange={(e) => setTransferCode(e.target.value)}
            maxLength={64}
          />
        </Field>
        <Field label={i18n.whatsappLabel} help={i18n.whatsappHelp}>
          <input
            className="field"
            type="tel"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="+213 555 12 34 56"
            required
          />
        </Field>
      </section>

      <section>
        <Field label={i18n.emailLabel} help={i18n.emailHelp}>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="optional"
          />
        </Field>
      </section>

      <section>
        <Field label={i18n.proofLabel} help={i18n.proofHelp}>
          <input
            className="field"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            required
          />
        </Field>
      </section>

      {error ? (
        <div
          role="alert"
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-hell w-full justify-center"
        style={pending ? { opacity: 0.6 } : undefined}
      >
        {pending ? i18n.submitting : i18n.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {help ? (
        <span
          className="mt-1 block font-mono text-[10px]"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          {help}
        </span>
      ) : null}
    </label>
  );
}
