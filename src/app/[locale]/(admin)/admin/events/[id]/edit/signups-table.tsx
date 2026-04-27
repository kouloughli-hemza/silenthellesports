"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteSignupAction,
  updateSignupPaymentAction,
  updateSignupSquadAction,
  updateSignupStatusAction,
} from "../../actions";

type PaymentStatus = "pending" | "paid" | "waived" | "refunded";
type SignupStatus = "registered" | "checked_in" | "disqualified" | "withdrawn";

interface SquadMember {
  ign: string;
  pubg_uid: string;
}

export interface SignupRow {
  id: string;
  confirmation_code: string;
  ign: string;
  pubg_uid: string;
  contact_phone: string;
  discord_tag: string;
  payment_status: PaymentStatus;
  status: SignupStatus;
  created_at_label: string;
  squad_members: SquadMember[];
}

const PAYMENT_OPTIONS: PaymentStatus[] = ["pending", "paid", "waived", "refunded"];
const STATUS_OPTIONS: SignupStatus[] = [
  "registered",
  "checked_in",
  "disqualified",
  "withdrawn",
];

const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  pending: "var(--ember)",
  paid: "var(--hell-red)",
  waived: "rgba(245,240,232,0.6)",
  refunded: "rgba(245,240,232,0.4)",
};

const STATUS_COLOR: Record<SignupStatus, string> = {
  registered: "rgba(245,240,232,0.85)",
  checked_in: "var(--hell-red)",
  disqualified: "rgba(245,240,232,0.4)",
  withdrawn: "rgba(245,240,232,0.4)",
};

export interface SignupsTableProps {
  signups: SignupRow[];
  capacity: number;
}

export function SignupsTable({ signups, capacity }: SignupsTableProps) {
  const filled = signups.filter(
    (s) => s.status !== "disqualified" && s.status !== "withdrawn",
  ).length;

  return (
    <section className="notch mt-8 p-5" style={{ background: "var(--ash-1)" }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// SIGNUPS (${filled} / ${capacity})`}
        </div>
      </div>

      {signups.length === 0 ? (
        <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
          No signups yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(245,240,232,0.1)" }}>
                <Th>Code</Th>
                <Th>Captain</Th>
                <Th>Phone</Th>
                <Th>Discord</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {signups.slice(0, 200).map((s) => (
                <SignupRowItem key={s.id} signup={s} />
              ))}
            </tbody>
          </table>
          {signups.length > 200 ? (
            <p
              className="mt-3 font-mono text-[10px]"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              Showing 200 of {signups.length} signups.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SignupRowItem({ signup }: { signup: SignupRow }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPaymentChange(value: PaymentStatus) {
    setError(null);
    startTransition(async () => {
      const r = await updateSignupPaymentAction(signup.id, value);
      if (!r.success) setError(r.error);
      else router.refresh();
    });
  }

  function onStatusChange(value: SignupStatus) {
    setError(null);
    startTransition(async () => {
      const r = await updateSignupStatusAction(signup.id, value);
      if (!r.success) setError(r.error);
      else router.refresh();
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const r = await deleteSignupAction(signup.id);
      if (!r.success) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  const dimmed =
    signup.status === "disqualified" || signup.status === "withdrawn";

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid rgba(245,240,232,0.06)",
          opacity: dimmed ? 0.55 : 1,
        }}
      >
        <td className="px-3 py-2 font-mono text-[11px]">
          SH-{signup.confirmation_code}
        </td>
        <td className="px-3 py-2">
          <div className="font-display font-bold italic">{signup.ign}</div>
          <div
            className="font-mono text-[10px]"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            UID {signup.pubg_uid}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {expanded ? "▾" : "▸"} Roster ({signup.squad_members.length})
          </button>
        </td>
        <td className="px-3 py-2 font-mono text-xs">{signup.contact_phone}</td>
        <td className="px-3 py-2 font-mono text-xs">{signup.discord_tag}</td>
        <td className="px-3 py-2">
          <Pill
            value={signup.payment_status}
            options={PAYMENT_OPTIONS}
            color={PAYMENT_COLOR[signup.payment_status]}
            disabled={pending}
            onChange={(v) => onPaymentChange(v as PaymentStatus)}
          />
        </td>
        <td className="px-3 py-2">
          <Pill
            value={signup.status}
            options={STATUS_OPTIONS}
            color={STATUS_COLOR[signup.status]}
            disabled={pending}
            onChange={(v) => onStatusChange(v as SignupStatus)}
          />
        </td>
        <td className="px-3 py-2 font-mono text-[11px]">
          {signup.created_at_label}
        </td>
        <td className="px-3 py-2 text-right">
          {confirmingDelete ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={onDelete}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--bone)",
                  background: "var(--hell-red)",
                  padding: "5px 10px",
                }}
              >
                {pending ? "…" : "CONFIRM"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingDelete(false)}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "rgba(245,240,232,0.7)",
                  border: "1px solid rgba(245,240,232,0.2)",
                  padding: "5px 10px",
                }}
              >
                CANCEL
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{
                color: "var(--hell-red)",
                border: "1px solid var(--hell-red)",
                padding: "5px 10px",
              }}
            >
              DELETE
            </button>
          )}
        </td>
      </tr>

      {expanded ? (
        <tr style={{ background: "rgba(0,0,0,0.25)" }}>
          <td colSpan={8} className="px-3 py-3">
            <RosterEditor
              signupId={signup.id}
              initial={signup.squad_members}
              onSaved={() => router.refresh()}
            />
          </td>
        </tr>
      ) : null}

      {error ? (
        <tr>
          <td colSpan={8} className="px-3 pb-2">
            <span className="field-error">{error}</span>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Pill({
  value,
  options,
  color,
  disabled,
  onChange,
}: {
  value: string;
  options: readonly string[];
  color: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{
        background: "transparent",
        color,
        border: "1px solid rgba(245,240,232,0.15)",
        padding: "4px 8px",
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {options.map((o) => (
        <option
          key={o}
          value={o}
          style={{ background: "var(--ash-3)", color: "var(--bone)" }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{ color: "rgba(245,240,232,0.55)" }}
    >
      {children}
    </th>
  );
}

function RosterEditor({
  signupId,
  initial,
  onSaved,
}: {
  signupId: string;
  initial: SquadMember[];
  onSaved: () => void;
}) {
  const [members, setMembers] = useState<SquadMember[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setField(idx: number, key: keyof SquadMember, value: string) {
    setMembers((prev) =>
      prev.map((m, i) =>
        i === idx
          ? {
              ...m,
              [key]: key === "pubg_uid" ? value.replace(/\D+/g, "") : value,
            }
          : m,
      ),
    );
  }
  function addRow() {
    setMembers((prev) =>
      prev.length >= 5 ? prev : [...prev, { ign: "", pubg_uid: "" }],
    );
  }
  function removeRow(idx: number) {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }
  function onSave() {
    setError(null);
    startTransition(async () => {
      const cleaned = members
        .map((m) => ({ ign: m.ign.trim(), pubg_uid: m.pubg_uid.trim() }))
        .filter((m) => m.ign.length > 0 || m.pubg_uid.length > 0);
      const r = await updateSignupSquadAction(signupId, cleaned);
      if (!r.success) {
        setError(r.error);
        return;
      }
      onSaved();
    });
  }
  function onReset() {
    setMembers(initial);
    setError(null);
  }

  const dirty = JSON.stringify(members) !== JSON.stringify(initial);

  return (
    <div className="space-y-3">
      <div
        className="font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        Roster
      </div>
      {members.length === 0 ? (
        <p
          className="font-mono text-xs"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          No players on the roster yet.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span
                className="shrink-0 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--hell-red)",
                  minWidth: 28,
                  fontWeight: 700,
                }}
              >
                #{i + 1}
              </span>
              <input
                className="field"
                style={{ flex: "1 1 140px", minWidth: 140 }}
                value={m.ign}
                placeholder="IGN"
                onChange={(e) => setField(i, "ign", e.target.value)}
                maxLength={32}
              />
              <input
                className="field"
                style={{ flex: "1 1 140px", minWidth: 140 }}
                value={m.pubg_uid}
                placeholder="UID"
                inputMode="numeric"
                onChange={(e) => setField(i, "pubg_uid", e.target.value)}
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Remove player ${i + 1}`}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--hell-red)",
                  border: "1px solid var(--hell-red)",
                  padding: "6px 10px",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {members.length < 5 ? (
          <button
            type="button"
            onClick={addRow}
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 11 }}
          >
            + ADD PLAYER
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={onSave}
          className="btn-hell"
          style={{
            padding: "6px 14px",
            fontSize: 11,
            opacity: pending || !dirty ? 0.5 : 1,
          }}
        >
          {pending ? "SAVING…" : "SAVE ROSTER"}
        </button>
        {dirty ? (
          <button
            type="button"
            onClick={onReset}
            disabled={pending}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{
              color: "rgba(245,240,232,0.7)",
              border: "1px solid rgba(245,240,232,0.2)",
              padding: "6px 10px",
            }}
          >
            REVERT
          </button>
        ) : null}
        {error ? (
          <span className="field-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
