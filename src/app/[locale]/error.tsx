"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { SkullIcon } from "@/components/brand";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations("errors");

  useEffect(() => {
    // TODO Phase 5: Sentry.captureException(error)
    console.error("[silent-hell] route error:", error);
  }, [error]);

  return (
    <div
      className="grain relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--black)" }}
    >
      <SkullIcon size={56} title="Silent Hell" />
      <h1
        className="font-display mt-6 text-5xl font-black tracking-tight uppercase md:text-7xl"
        style={{ color: "var(--hell-red)" }}
      >
        {t("title")}
      </h1>
      <p
        className="mt-4 max-w-md text-sm md:text-base"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {t("subtitle")}
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-[10px] tracking-[0.25em] uppercase opacity-50">
          REF · {error.digest}
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button onClick={reset} className="btn-hell">
          {t("tryAgain")}
        </button>
        <Link href="/" className="btn-ghost">
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
