import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { TrophyForm } from "../trophy-form";
import type { TrophyInput } from "../actions";

const EMPTY: TrophyInput = {
  title: { en: "", ar: "" },
  tournament_name: "",
  placement: "1st",
  prize_amount: null,
  prize_currency: "DZD",
  date: new Date().toISOString().slice(0, 10),
  logo_url: null,
  display_order: 0,
};

export default async function NewTrophyPage({
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
        {"// TROPHIES / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Trophy
      </h1>
      <TrophyForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
