"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import type { Locale } from "@/lib/i18n/routing";

const LABELS: Record<Locale, string> = { en: "EN", ar: "ع" };
const LOCALES: Locale[] = ["en", "ar"];

export function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  const switchTo = (target: Locale) => {
    if (target === current || pending) return;
    startTransition(() => {
      router.replace(pathname, { locale: target });
    });
  };

  return (
    <div
      className="flex items-center"
      style={{
        background: "rgba(245,240,232,0.06)",
        border: "1px solid rgba(230,0,19,0.3)",
      }}
      role="group"
      aria-label="Language switcher"
    >
      {LOCALES.map((l) => {
        const active = l === current;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={pending}
            aria-pressed={active}
            aria-label={`Switch to ${l === "en" ? "English" : "Arabic"}`}
            className="font-mono text-[11px] tracking-[0.15em] uppercase transition-colors px-3 py-1.5"
            style={{
              background: active ? "var(--hell-red)" : "transparent",
              color: active ? "var(--bone)" : "rgba(245,240,232,0.6)",
              fontWeight: 700,
              cursor: pending ? "wait" : undefined,
            }}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
