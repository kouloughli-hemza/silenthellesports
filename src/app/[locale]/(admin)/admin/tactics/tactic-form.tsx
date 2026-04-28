"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ImageUpload } from "@/components/admin/image-upload";
import {
  createTacticBoardAction,
  deleteTacticBoardAction,
  updateTacticBoardAction,
  type TacticBoardInput,
} from "./actions";

interface TacticFormProps {
  mode: "create" | "edit";
  id?: string;
  locale: string;
  initial: TacticBoardInput;
}

type Tool = "drop" | "rotation";

export function TacticForm({ mode, id, locale, initial }: TacticFormProps) {
  const router = useRouter();
  const [state, setState] = useState<TacticBoardInput>(initial);
  const [tool, setTool] = useState<Tool>("rotation");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingPending, startDelete] = useTransition();
  const overlayRef = useRef<HTMLDivElement | null>(null);

  function set<K extends keyof TacticBoardInput>(key: K, value: TacticBoardInput[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function setT(field: "title" | "description", lang: "en" | "ar", value: string) {
    setState((s) => ({ ...s, [field]: { ...s[field], [lang]: value } }));
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const node = overlayRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (tool === "drop") {
      setState((s) => ({ ...s, drop_x: clampedX, drop_y: clampedY }));
    } else {
      setState((s) => ({
        ...s,
        rotation_points: [...s.rotation_points, { x: clampedX, y: clampedY }],
      }));
    }
  }

  function popRotation() {
    setState((s) => ({
      ...s,
      rotation_points: s.rotation_points.slice(0, -1),
    }));
  }
  function clearRotation() {
    setState((s) => ({ ...s, rotation_points: [] }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTacticBoardAction(state)
          : await updateTacticBoardAction(id as string, state);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/tactics`);
      router.refresh();
    });
  }

  function onDelete() {
    if (!id) return;
    if (!confirm("Delete this tactic board permanently?")) return;
    startDelete(async () => {
      const result = await deleteTacticBoardAction(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/${locale}/admin/tactics`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <Section title="HEADLINE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title (EN) *">
            <input
              className="field"
              required
              value={state.title.en}
              onChange={(e) => setT("title", "en", e.target.value)}
              placeholder="e.g. Erangel · Pochinki rush"
            />
          </Field>
          <Field label="Title (AR) *">
            <input
              className="field"
              required
              dir="rtl"
              value={state.title.ar}
              onChange={(e) => setT("title", "ar", e.target.value)}
            />
          </Field>
          <Field label="Map name *">
            <input
              className="field"
              required
              value={state.map_name}
              onChange={(e) => set("map_name", e.target.value)}
              placeholder="Erangel / Miramar / Sanhok"
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
          <Field label="Description (EN)">
            <textarea
              rows={3}
              className="field"
              value={state.description.en}
              onChange={(e) => setT("description", "en", e.target.value)}
            />
          </Field>
          <Field label="Description (AR)">
            <textarea
              rows={3}
              className="field"
              dir="rtl"
              value={state.description.ar}
              onChange={(e) => setT("description", "ar", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="MAP IMAGE">
        <ImageUpload
          value={state.map_image_url}
          onChange={(url) => set("map_image_url", url)}
          bucket="events"
          label="Upload map image (square works best — Erangel/Miramar style). Optional — without one, a stylized grid placeholder is rendered."
        />
      </Section>

      {true ? (
        <Section title="DROP & ROTATION">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton
                active={tool === "drop"}
                onClick={() => setTool("drop")}
              >
                ▼ DROP POINT
              </ToolButton>
              <ToolButton
                active={tool === "rotation"}
                onClick={() => setTool("rotation")}
              >
                ▷ ROTATION
              </ToolButton>
              <button
                type="button"
                onClick={popRotation}
                disabled={state.rotation_points.length === 0}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  border: "1px solid rgba(245,240,232,0.2)",
                  color: "rgba(245,240,232,0.7)",
                  padding: "8px 12px",
                  opacity: state.rotation_points.length === 0 ? 0.4 : 1,
                }}
              >
                UNDO LAST
              </button>
              <button
                type="button"
                onClick={clearRotation}
                disabled={state.rotation_points.length === 0}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  border: "1px solid rgba(245,240,232,0.2)",
                  color: "rgba(245,240,232,0.7)",
                  padding: "8px 12px",
                  opacity: state.rotation_points.length === 0 ? 0.4 : 1,
                }}
              >
                CLEAR PATH
              </button>
            </div>
            <p
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              Tap the map to {tool === "drop" ? "set the drop point" : "add a rotation point"}.
              Rotation goes drop → first marker → second marker → …
            </p>
            <MapCanvas
              ref={overlayRef}
              imageUrl={state.map_image_url}
              dropX={state.drop_x}
              dropY={state.drop_y}
              rotation={state.rotation_points}
              onClick={handleMapClick}
            />
            <div
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              Drop: {state.drop_x.toFixed(1)}%, {state.drop_y.toFixed(1)}% · Rotation
              points: {state.rotation_points.length}
            </div>
          </div>
        </Section>
      ) : null}

      <Section title="VISIBILITY">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={state.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
          />
          <span
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: "var(--bone)" }}
          >
            Published — show on the public tactics board
          </span>
        </label>
      </Section>

      {error ? <div className="field-error">{error}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-hell" style={{ padding: "12px 24px" }}>
          {pending ? "SAVING…" : mode === "create" ? "CREATE BOARD" : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "12px 24px" }}
          onClick={() => router.push(`/${locale}/admin/tactics`)}
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

const MapCanvas = function MapCanvas({
  ref,
  imageUrl,
  dropX,
  dropY,
  rotation,
  onClick,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  imageUrl: string | null;
  dropX: number;
  dropY: number;
  rotation: { x: number; y: number }[];
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const points = [{ x: dropX, y: dropY }, ...rotation];
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <div
      ref={ref}
      onClick={onClick}
      className="relative w-full overflow-hidden cursor-crosshair"
      style={{
        aspectRatio: "1 / 1",
        background: "var(--ash-3)",
        border: "1px solid rgba(230,0,19,0.3)",
        maxWidth: 720,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Map"
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          style={{ objectFit: "cover", pointerEvents: "none" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,240,232,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,232,0.08) 1px, transparent 1px)",
            backgroundSize: "10% 10%, 10% 10%",
          }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        {rotation.length > 0 ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--hell-red)"
            strokeWidth={0.6}
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {rotation.map((p, i) => (
          <circle
            key={`r-${i}`}
            cx={p.x}
            cy={p.y}
            r={1.2}
            fill="var(--bone)"
            stroke="var(--hell-red)"
            strokeWidth={0.4}
          />
        ))}
        <g>
          <circle cx={dropX} cy={dropY} r={3.5} fill="var(--hell-red)" opacity={0.25} />
          <circle cx={dropX} cy={dropY} r={1.6} fill="var(--hell-red)" />
        </g>
      </svg>
    </div>
  );
};

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[10px] tracking-[0.2em] uppercase"
      style={{
        background: active ? "var(--hell-red)" : "transparent",
        color: active ? "var(--bone)" : "rgba(245,240,232,0.75)",
        border: `1px solid ${active ? "var(--hell-red)" : "rgba(245,240,232,0.2)"}`,
        padding: "8px 14px",
      }}
    >
      {children}
    </button>
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
