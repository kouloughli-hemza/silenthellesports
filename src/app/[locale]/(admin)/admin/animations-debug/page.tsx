import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { requireAdmin } from "@/lib/admin/guard";
import { DebugLab } from "./debug-lab";

export default async function AnimationsDebugPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdmin();

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// ANIMATIONS / DEBUG"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Animation Lab
      </h1>
      <p className="mt-2 font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
        Phase A primitives in isolation. Toggle reduced motion in your OS to verify fallback paths.
      </p>
      <DebugLab />
    </div>
  );
}
