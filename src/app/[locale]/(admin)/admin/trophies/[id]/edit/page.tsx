import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getTrophy } from "@/lib/admin/data/trophies";
import { TrophyForm } from "../../trophy-form";
import type { TrophyInput } from "../../actions";

export default async function EditTrophyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const trophy = await getTrophy(id);
  if (!trophy) notFound();

  const title = (trophy.title ?? {}) as { en?: string; ar?: string };
  const initial: TrophyInput = {
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    tournament_name: trophy.tournament_name,
    placement: trophy.placement,
    prize_amount: trophy.prize_amount,
    prize_currency: trophy.prize_currency,
    date: trophy.date,
    logo_url: trophy.logo_url,
    display_order: trophy.display_order,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// TROPHIES / ${trophy.tournament_name.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit Trophy
      </h1>
      <TrophyForm mode="edit" id={trophy.id} locale={locale} initial={initial} />
    </div>
  );
}
