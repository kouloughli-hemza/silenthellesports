import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { MilestoneForm } from "../milestone-form";
import type { MilestoneInput } from "../actions";

const EMPTY: MilestoneInput = {
  occurred_on: new Date().toISOString().slice(0, 10),
  category: "milestone",
  title: { en: "", ar: "" },
  description: { en: "", ar: "" },
  image_url: null,
  display_order: 0,
  is_published: true,
};

export default async function NewMilestonePage({
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
        {"// CHRONICLE / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New milestone
      </h1>
      <MilestoneForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
