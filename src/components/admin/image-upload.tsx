"use client";

import { useId, useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/lib/admin/upload";
import type { UploadBucket } from "@/lib/admin/upload-types";

// Keep in sync with MAX_BYTES in src/lib/admin/upload.ts and the
// experimental.serverActions.bodySizeLimit in next.config.ts.
// We surface this both as a hint in the dropzone and as a hard pre-flight
// check so the admin gets an instant, friendly error instead of a generic
// server-action body-size crash.
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_LABEL = "5 MB";
const ACCEPTED_LABEL = "PNG · JPG · WEBP · AVIF · GIF";

function describeBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

function checkFile(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_BYTES) {
    return `Image is ${describeBytes(file.size)} — max ${MAX_LABEL}. Resize and try again.`;
  }
  return null;
}

interface SingleProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: UploadBucket;
  label?: string;
}

export function ImageUpload({ value, onChange, bucket, label }: SingleProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeErr = checkFile(file);
    if (sizeErr) {
      setError(sizeErr);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("bucket", bucket);
    startTransition(async () => {
      const result = await uploadImageAction(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.data.url);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div>
      {label ? <span className="field-label">{label}</span> : null}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="sr-only"
        onChange={onFile}
        disabled={pending}
      />
      {value ? (
        <div
          className="flex items-start gap-3"
          style={{ background: "var(--ash-3)", border: "1px solid var(--ash-2)", padding: 8 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            style={{
              width: 96,
              height: 96,
              objectFit: "cover",
              background: "var(--ash-1)",
              border: "1px solid rgba(245,240,232,0.08)",
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              className="font-mono text-[10px] tracking-[0.15em] uppercase truncate"
              style={{ color: "rgba(245,240,232,0.55)" }}
              title={value}
            >
              {value}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={pick}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--bone)",
                  border: "1px solid rgba(245,240,232,0.25)",
                  padding: "6px 10px",
                }}
              >
                {pending ? "…" : "REPLACE"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onChange(null)}
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  color: "var(--hell-red)",
                  border: "1px solid var(--hell-red)",
                  padding: "6px 10px",
                }}
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DropZone onPick={pick} pending={pending} />
      )}
      {error ? <div className="field-error mt-2">{error}</div> : null}
    </div>
  );
}

interface ListProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: UploadBucket;
  max?: number;
  label?: string;
}

export function ImageUploadList({ value, onChange, bucket, max = 10, label }: ListProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const remaining = max - value.length;

  function pick() {
    inputRef.current?.click();
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    if (files.length === 0) return;
    // Pre-flight: reject the whole batch if any single file is over the
    // limit. Cheap to check, much friendlier than half-uploading then dying.
    for (const f of files) {
      const sizeErr = checkFile(f);
      if (sizeErr) {
        setError(`${f.name}: ${sizeErr}`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }
    setError(null);
    startTransition(async () => {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("bucket", bucket);
        const result = await uploadImageAction(fd);
        if (!result.success) {
          setError(result.error);
          break;
        }
        uploaded.push(result.data.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(i, 1);
    if (item == null) return;
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div>
      {label ? (
        <div className="flex items-baseline justify-between mb-2">
          <span className="field-label">{label}</span>
          <span
            className="font-mono text-[10px]"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {value.length}/{max}
          </span>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        multiple
        className="sr-only"
        onChange={onFiles}
        disabled={pending || remaining <= 0}
      />

      {value.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              style={{
                background: "var(--ash-3)",
                border: "1px solid var(--ash-2)",
                padding: 6,
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  background: "var(--ash-1)",
                }}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="font-mono text-[10px]"
                  style={{
                    color: i === 0 ? "rgba(245,240,232,0.25)" : "var(--bone)",
                    border: "1px solid rgba(245,240,232,0.18)",
                    padding: "2px 6px",
                  }}
                  aria-label="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="font-mono text-[10px]"
                  style={{
                    color: i === value.length - 1 ? "rgba(245,240,232,0.25)" : "var(--bone)",
                    border: "1px solid rgba(245,240,232,0.18)",
                    padding: "2px 6px",
                  }}
                  aria-label="Move right"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase ml-auto"
                  style={{
                    color: "var(--hell-red)",
                    border: "1px solid var(--hell-red)",
                    padding: "2px 6px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {remaining > 0 ? (
        <DropZone onPick={pick} pending={pending} multiple />
      ) : (
        <p className="font-mono text-[10px]" style={{ color: "rgba(245,240,232,0.5)" }}>
          Maximum {max} images reached.
        </p>
      )}

      {error ? <div className="field-error mt-2">{error}</div> : null}
    </div>
  );
}

function DropZone({ onPick, pending, multiple = false }: { onPick: () => void; pending: boolean; multiple?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={pending}
      className="w-full font-mono tracking-[0.2em] uppercase"
      style={{
        background: "var(--ash-3)",
        border: "1px dashed rgba(230,0,19,0.4)",
        color: pending ? "var(--ember)" : "rgba(245,240,232,0.7)",
        padding: "20px 16px",
        cursor: pending ? "wait" : "pointer",
        transition: "border-color 150ms",
      }}
    >
      <div className="text-[11px]">
        {pending
          ? "UPLOADING…"
          : multiple
            ? "+ CLICK TO UPLOAD IMAGES"
            : "+ CLICK TO UPLOAD IMAGE"}
      </div>
      {!pending ? (
        <div
          className="mt-2 text-[9px] tracking-[0.15em]"
          style={{ color: "rgba(245,240,232,0.45)" }}
        >
          {ACCEPTED_LABEL} · MAX {MAX_LABEL}
        </div>
      ) : null}
    </button>
  );
}
