import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { StatForm } from "../stat-form";
import type { StatInput } from "../actions";

const EMPTY: StatInput = {
  key: "",
  label: { en: "", ar: "" },
  value: 0,
  suffix: null,
  display_order: 0,
  is_published: true,
};

export default async function NewStatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// STATS / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New stat
      </h1>
      <StatForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
