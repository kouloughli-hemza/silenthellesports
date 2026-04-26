"use client";

// Single-page checkout form. Server actions back every external interaction:
// commune list, stopdesk list, fee preview, and the final placeOrder call.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { useRouter } from "@/lib/i18n/routing";
import {
  calculateFeeAction,
  getCommunesAction,
  getStopdesksAction,
  placeOrderAction,
} from "@/lib/cart/checkout-actions";
import type { Commune, Stopdesk, Wilaya } from "@/services/yalidine";
import { ALGERIAN_PHONE_RE, formatPrice, type Locale } from "@/types/domain";

interface CheckoutFormProps {
  locale: Locale;
  isAr: boolean;
  wilayas: Wilaya[];
  totalWeightGrams: number;
  subtotal: number;
  labels: CheckoutLabels;
}

export interface CheckoutLabels {
  customerSection: string;
  shippingSection: string;
  deliverySection: string;
  summarySection: string;
  name: string;
  phone: string;
  phoneHint: string;
  email: string;
  emailHint: string;
  wilaya: string;
  wilayaPlaceholder: string;
  commune: string;
  communePlaceholder: string;
  communeLoading: string;
  address: string;
  addressHint: string;
  pickStopdesk: string;
  stopdeskPlaceholder: string;
  stopdeskLoading: string;
  noStopdesks: string;
  home: string;
  stopdesk: string;
  placeOrder: string;
  placing: string;
  feeLoading: string;
  subtotal: string;
  shipping: string;
  total: string;
  codNote: string;
  errorTitle: string;
  errors: {
    nameRequired: string;
    phoneInvalid: string;
    emailInvalid: string;
    wilayaRequired: string;
    communeRequired: string;
    addressRequired: string;
    stopdeskRequired: string;
    cartEmpty: string;
    noShippingTo: string;
    oosVariant: string;
    genericError: string;
  };
}

// Client schema mirrors the server schema. Server is still authoritative.
const ClientSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80),
    phone: z.string().regex(ALGERIAN_PHONE_RE, "phoneInvalid"),
    email: z
      .string()
      .trim()
      .max(254)
      .optional()
      .refine(
        (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        { message: "emailInvalid" },
      ),
    wilayaCode: z.number().int().min(1).max(58),
    communeName: z.string().trim().min(1, "communeRequired"),
    address: z.string().trim().min(5, "addressRequired").max(400),
    isStopdesk: z.boolean(),
    stopdeskId: z.number().int().positive().nullable(),
  })
  .refine((d) => (d.isStopdesk ? d.stopdeskId !== null : true), {
    message: "stopdeskRequired",
    path: ["stopdeskId"],
  });

type FieldErrors = Partial<Record<string, string>>;

export function CheckoutForm({
  locale,
  isAr,
  wilayas,
  totalWeightGrams,
  subtotal,
  labels,
}: CheckoutFormProps) {
  const router = useRouter();
  const fmt = (n: number) => formatPrice(n, locale);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wilayaCode, setWilayaCode] = useState<number | null>(null);
  const [communeName, setCommuneName] = useState("");
  const [address, setAddress] = useState("");
  const [isStopdesk, setIsStopdesk] = useState(false);
  const [stopdeskId, setStopdeskId] = useState<number | null>(null);

  const [communes, setCommunes] = useState<Commune[]>([]);
  const [communesLoading, setCommunesLoading] = useState(false);
  const [stopdesks, setStopdesks] = useState<Stopdesk[]>([]);
  const [stopdesksLoading, setStopdesksLoading] = useState(false);

  const [fee, setFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const sortedWilayas = useMemo(
    () =>
      [...wilayas].sort((a, b) =>
        isAr ? a.name_ar.localeCompare(b.name_ar) : a.name.localeCompare(b.name),
      ),
    [wilayas, isAr],
  );

  // Load communes when wilaya changes.
  const wilayaReqRef = useRef(0);
  useEffect(() => {
    setCommuneName("");
    setStopdeskId(null);
    setStopdesks([]);
    if (wilayaCode === null) {
      setCommunes([]);
      return;
    }
    const reqId = ++wilayaReqRef.current;
    setCommunesLoading(true);
    setStopdesksLoading(true);
    void (async () => {
      const [communesRes, stopdesksRes] = await Promise.all([
        getCommunesAction(wilayaCode),
        getStopdesksAction(wilayaCode),
      ]);
      if (reqId !== wilayaReqRef.current) return; // a newer request superseded this
      if (communesRes.success) {
        setCommunes(communesRes.data.communes);
      } else {
        setCommunes([]);
      }
      setCommunesLoading(false);
      if (stopdesksRes.success) {
        setStopdesks(stopdesksRes.data.stopdesks);
      } else {
        setStopdesks([]);
      }
      setStopdesksLoading(false);
    })();
  }, [wilayaCode]);

  // Recalculate the fee whenever wilaya or delivery method changes.
  const feeReqRef = useRef(0);
  useEffect(() => {
    if (wilayaCode === null || totalWeightGrams <= 0) {
      setFee(null);
      return;
    }
    const reqId = ++feeReqRef.current;
    setFeeLoading(true);
    setFeeError(null);
    void (async () => {
      const res = await calculateFeeAction({
        toWilayaCode: wilayaCode,
        weightGrams: totalWeightGrams,
        isStopdesk,
      });
      if (reqId !== feeReqRef.current) return;
      setFeeLoading(false);
      if (res.success) {
        setFee(res.data.fee);
      } else {
        setFee(null);
        setFeeError(labels.errors.noShippingTo);
      }
    })();
  }, [wilayaCode, isStopdesk, totalWeightGrams, labels.errors.noShippingTo]);

  const total = fee !== null ? subtotal + fee : subtotal;

  const validate = (): boolean => {
    const parsed = ClientSchema.safeParse({
      name,
      phone,
      email: email || undefined,
      wilayaCode: wilayaCode ?? -1,
      communeName,
      address,
      isStopdesk,
      stopdeskId: isStopdesk ? stopdeskId : null,
    });
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const next: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string") {
        next[path] = mapErrorMessage(issue.message, labels.errors);
      }
    }
    if (wilayaCode === null) next["wilayaCode"] = labels.errors.wilayaRequired;
    setErrors(next);
    return false;
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTopError(null);
    if (!validate()) {
      setTopError(labels.errorTitle);
      return;
    }
    if (wilayaCode === null) return; // already caught
    startSubmit(async () => {
      const res = await placeOrderAction({
        locale,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        wilayaCode,
        communeName: communeName.trim(),
        address: address.trim(),
        isStopdesk,
        stopdeskId: isStopdesk ? stopdeskId : null,
      });
      if (res.success) {
        router.push(`/store/checkout/success?order=${res.data.orderNumber}`);
      } else {
        setTopError(mapErrorMessage(res.error, labels.errors));
      }
    });
  };

  const arrow = isAr ? "←" : "→";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-8">
        <Section heading={labels.customerSection}>
          <Field label={labels.name} error={errors["name"]} required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="field"
              required
              maxLength={80}
            />
          </Field>
          <Field label={labels.phone} hint={labels.phoneHint} error={errors["phone"]} required>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="0XXXXXXXXX"
              className="field"
              required
            />
          </Field>
          <Field label={labels.email} hint={labels.emailHint} error={errors["email"]}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="field"
              maxLength={254}
            />
          </Field>
        </Section>

        <Section heading={labels.shippingSection}>
          <Field label={labels.wilaya} error={errors["wilayaCode"]} required>
            <select
              value={wilayaCode ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setWilayaCode(v ? Number(v) : null);
              }}
              className="field"
              required
            >
              <option value="">{labels.wilayaPlaceholder}</option>
              {sortedWilayas.map((w) => (
                <option key={w.code} value={w.code}>
                  {String(w.code).padStart(2, "0")} · {isAr ? w.name_ar : w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={labels.commune} error={errors["communeName"]} required>
            <select
              value={communeName}
              onChange={(e) => setCommuneName(e.target.value)}
              disabled={wilayaCode === null || communesLoading}
              className="field"
              required
            >
              <option value="">
                {wilayaCode === null
                  ? labels.communePlaceholder
                  : communesLoading
                    ? labels.communeLoading
                    : labels.communePlaceholder}
              </option>
              {communes.map((c) => (
                <option key={c.id} value={c.name}>
                  {isAr ? c.name_ar : c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={labels.address} hint={labels.addressHint} error={errors["address"]} required>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              className="field"
              rows={3}
              maxLength={400}
              required
            />
          </Field>
        </Section>

        <Section heading={labels.deliverySection}>
          <div className="grid grid-cols-2 gap-3">
            <DeliveryRadio
              checked={!isStopdesk}
              onChange={() => setIsStopdesk(false)}
              label={labels.home}
            />
            <DeliveryRadio
              checked={isStopdesk}
              onChange={() => setIsStopdesk(true)}
              label={labels.stopdesk}
            />
          </div>
          {isStopdesk ? (
            <Field
              label={labels.pickStopdesk}
              error={errors["stopdeskId"]}
              required
              className="mt-2"
            >
              <select
                value={stopdeskId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setStopdeskId(v ? Number(v) : null);
                }}
                disabled={wilayaCode === null || stopdesksLoading}
                className="field"
                required
              >
                <option value="">
                  {wilayaCode === null
                    ? labels.stopdeskPlaceholder
                    : stopdesksLoading
                      ? labels.stopdeskLoading
                      : stopdesks.length === 0
                        ? labels.noStopdesks
                        : labels.stopdeskPlaceholder}
                </option>
                {stopdesks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.commune_name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </Section>
      </div>

      <aside
        className="notch flex h-fit flex-col gap-3 p-5 md:p-6 lg:sticky lg:top-24"
        style={{ background: "var(--ash-1)", border: "1px solid rgba(230,0,19,0.3)" }}
      >
        <div
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {labels.summarySection}
        </div>
        <SummaryRow label={labels.subtotal} value={fmt(subtotal)} />
        <SummaryRow
          label={labels.shipping}
          value={
            wilayaCode === null
              ? "—"
              : feeLoading
                ? labels.feeLoading
                : feeError
                  ? feeError
                  : fee !== null
                    ? fmt(fee)
                    : "—"
          }
          valueColor={feeError ? "var(--hell-red)" : undefined}
        />
        <div
          className="-mx-1 mt-1 border-t pt-3"
          style={{ borderColor: "rgba(245,240,232,0.1)" }}
        >
          <div className="flex items-baseline justify-between">
            <span
              className="font-display text-base font-black uppercase italic"
              style={{ color: "var(--bone)" }}
            >
              {labels.total}
            </span>
            <span
              className="font-display text-2xl font-black italic md:text-3xl"
              style={{ color: "var(--hell-red)" }}
            >
              {fee !== null ? fmt(total) : fmt(subtotal)}
            </span>
          </div>
        </div>
        <div
          className="font-mono text-[10px] leading-relaxed tracking-[0.2em] uppercase"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          {labels.codNote}
        </div>

        {topError ? (
          <div
            role="alert"
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{
              color: "var(--hell-red)",
              border: "1px solid rgba(230,0,19,0.5)",
              padding: "10px",
              background: "rgba(230,0,19,0.08)",
            }}
          >
            {topError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="btn-hell mt-2 w-full justify-center"
          style={submitting ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
        >
          <span>{submitting ? labels.placing : labels.placeOrder}</span>
          <span aria-hidden>{arrow}</span>
        </button>
      </aside>
    </form>
  );
}

function mapErrorMessage(message: string, errors: CheckoutLabels["errors"]): string {
  switch (message) {
    case "phoneInvalid":
      return errors.phoneInvalid;
    case "nameRequired":
      return errors.nameRequired;
    case "emailInvalid":
      return errors.emailInvalid;
    case "wilayaRequired":
      return errors.wilayaRequired;
    case "communeRequired":
      return errors.communeRequired;
    case "addressRequired":
      return errors.addressRequired;
    case "stopdeskRequired":
      return errors.stopdeskRequired;
    case "cartEmpty":
      return errors.cartEmpty;
    case "noShippingTo":
      return errors.noShippingTo;
    case "oosVariant":
      return errors.oosVariant;
    case "genericError":
      return errors.genericError;
    default:
      return message || errors.genericError;
  }
}

interface SectionProps {
  heading: string;
  children: React.ReactNode;
}

function Section({ heading, children }: SectionProps) {
  return (
    <section
      className="notch flex flex-col gap-4 p-5 md:p-6"
      style={{ background: "var(--ash-1)", border: "1px solid rgba(245,240,232,0.06)" }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {heading}
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, hint, error, required, className, children }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {label}
        {required ? <span style={{ color: "var(--hell-red)" }}> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span
          className="font-mono text-[10px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.4)" }}
        >
          {hint}
        </span>
      ) : null}
      {error ? (
        <span
          role="alert"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface DeliveryRadioProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

function DeliveryRadio({ checked, onChange, label }: DeliveryRadioProps) {
  return (
    <label
      className="font-mono inline-flex cursor-pointer items-center justify-center px-3 py-3 text-xs tracking-[0.2em] uppercase select-none"
      style={{
        background: checked ? "var(--hell-red)" : "var(--ash-3)",
        color: checked ? "var(--bone)" : "rgba(245,240,232,0.7)",
        border:
          "1px solid " + (checked ? "var(--hell-red)" : "rgba(230,0,19,0.3)"),
      }}
    >
      <input
        type="radio"
        name="delivery"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function SummaryRow({ label, value, valueColor }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className="font-mono text-xs tracking-[0.2em] uppercase"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-sm tabular-nums"
        style={{ color: valueColor ?? "var(--bone)" }}
      >
        {value}
      </span>
    </div>
  );
}
