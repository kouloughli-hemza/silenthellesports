"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createUcPackageAction,
  deleteUcPackageAction,
  updateUcPackageAction,
} from "@/lib/admin/actions/uc-packages";
import type { UcPackage } from "@/lib/admin/data/uc-packages";

interface Props {
  packages: UcPackage[];
}

export function UcPackagesEditor({ packages }: Props) {
  return (
    <section className="notch mt-2 p-5" style={{ background: "var(--ash-1)" }}>
      <div
        className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// PACKAGES (${packages.length})`}
      </div>
      <p
        className="mb-4 max-w-2xl font-mono text-[11px] tracking-[0.15em]"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        Tier the customer can pick on the public UC recharge page. Set bonus UC
        for promo packs (e.g. 60 + 0, 325 + 25). Inactive packages are hidden
        from the public picker but kept for historical request lookup.
      </p>

      {packages.length > 0 ? (
        <div className="space-y-3">
          {packages.map((p) => (
            <ExistingRow key={p.id} pkg={p} />
          ))}
        </div>
      ) : (
        <p
          className="font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "rgba(245,240,232,0.55)" }}
        >
          No packages yet — add one below.
        </p>
      )}

      <div className="mt-6">
        <div
          className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {"// ADD PACKAGE"}
        </div>
        <NewRow />
      </div>
    </section>
  );
}

function ExistingRow({ pkg }: { pkg: UcPackage }) {
  const router = useRouter();
  const [ucAmount, setUcAmount] = useState(String(pkg.uc_amount));
  const [bonusUc, setBonusUc] = useState(String(pkg.bonus_uc));
  const [priceDzd, setPriceDzd] = useState(String(pkg.price_dzd));
  const [label, setLabel] = useState(pkg.label ?? "");
  const [active, setActive] = useState(pkg.is_active);
  const [order, setOrder] = useState(String(pkg.display_order));
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("uc_amount", ucAmount);
    fd.set("bonus_uc", bonusUc);
    fd.set("price_dzd", priceDzd);
    fd.set("label", label);
    fd.set("display_order", order);
    if (active) fd.set("is_active", "on");
    return fd;
  }

  function onSave() {
    setError(null);
    startSave(async () => {
      const result = await updateUcPackageAction(pkg.id, buildFormData());
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete the ${pkg.uc_amount} UC package? This can't be undone.`)) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteUcPackageAction(pkg.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[0.8fr_0.8fr_0.9fr_1fr_0.6fr_0.6fr_auto] md:items-end"
      style={{
        background: "var(--ash-3)",
        border: "1px solid rgba(245,240,232,0.06)",
      }}
    >
      <Field label="UC amount">
        <input
          className="field"
          inputMode="numeric"
          value={ucAmount}
          onChange={(e) => setUcAmount(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <Field label="Bonus UC">
        <input
          className="field"
          inputMode="numeric"
          value={bonusUc}
          onChange={(e) => setBonusUc(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <Field label="Price (DZD)">
        <input
          className="field"
          inputMode="numeric"
          value={priceDzd}
          onChange={(e) => setPriceDzd(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <Field label="Label (optional)">
        <input
          className="field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. BEST VALUE"
          maxLength={40}
        />
      </Field>
      <Field label="Order">
        <input
          className="field"
          inputMode="numeric"
          value={order}
          onChange={(e) => setOrder(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <label className="flex h-[40px] items-center gap-2 font-mono text-[11px] uppercase">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={savePending}
          className="btn-hell"
          style={{ padding: "10px 16px", fontSize: 11 }}
        >
          {savePending ? "…" : savedFlash ? "SAVED" : "SAVE"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deletePending}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{
            color: "var(--hell-red)",
            border: "1px solid var(--hell-red)",
            padding: "9px 12px",
          }}
        >
          {deletePending ? "…" : "DEL"}
        </button>
      </div>
      {error ? <div className="field-error md:col-span-7">{error}</div> : null}
    </div>
  );
}

function NewRow() {
  const router = useRouter();
  const [ucAmount, setUcAmount] = useState("");
  const [bonusUc, setBonusUc] = useState("0");
  const [priceDzd, setPriceDzd] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setUcAmount("");
    setBonusUc("0");
    setPriceDzd("");
    setLabel("");
    setActive(true);
    setOrder("0");
  }

  function onAdd() {
    setError(null);
    if (!ucAmount || Number(ucAmount) <= 0) {
      setError("UC amount required.");
      return;
    }
    if (!priceDzd || Number(priceDzd) <= 0) {
      setError("Price required.");
      return;
    }
    const fd = new FormData();
    fd.set("uc_amount", ucAmount);
    fd.set("bonus_uc", bonusUc || "0");
    fd.set("price_dzd", priceDzd);
    fd.set("label", label);
    fd.set("display_order", order || "0");
    if (active) fd.set("is_active", "on");
    startTransition(async () => {
      const result = await createUcPackageAction(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  return (
    <div
      className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[0.8fr_0.8fr_0.9fr_1fr_0.6fr_0.6fr_auto] md:items-end"
      style={{
        background: "var(--ash-3)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <Field label="UC amount *">
        <input
          className="field"
          inputMode="numeric"
          value={ucAmount}
          onChange={(e) => setUcAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="660"
        />
      </Field>
      <Field label="Bonus UC">
        <input
          className="field"
          inputMode="numeric"
          value={bonusUc}
          onChange={(e) => setBonusUc(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <Field label="Price (DZD) *">
        <input
          className="field"
          inputMode="numeric"
          value={priceDzd}
          onChange={(e) => setPriceDzd(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="2000"
        />
      </Field>
      <Field label="Label (optional)">
        <input
          className="field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. BEST VALUE"
          maxLength={40}
        />
      </Field>
      <Field label="Order">
        <input
          className="field"
          inputMode="numeric"
          value={order}
          onChange={(e) => setOrder(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <label className="flex h-[40px] items-center gap-2 font-mono text-[11px] uppercase">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>
      <button
        type="button"
        onClick={onAdd}
        disabled={pending}
        className="btn-hell"
        style={{ padding: "10px 16px", fontSize: 11 }}
      >
        {pending ? "…" : "+ ADD"}
      </button>
      {error ? <div className="field-error md:col-span-7">{error}</div> : null}
    </div>
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
