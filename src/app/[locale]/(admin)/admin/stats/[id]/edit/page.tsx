import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getStat } from "@/lib/admin/data/team";
import { StatForm } from "../../stat-form";
import type { StatInput } from "../../actions";

export default async function EditStatPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const s = await getStat(id);
  if (!s) notFound();

  const label = (s.label ?? {}) as { en?: string; ar?: string };

  const initial: StatInput = {
    key: s.key,
    label: { en: label.en ?? "", ar: label.ar ?? "" },
    value: Number(s.value) || 0,
    suffix: s.suffix,
    display_order: s.display_order,
    is_published: s.is_published,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// STATS / ${s.key.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit stat
      </h1>
      <StatForm mode="edit" id={s.id} locale={locale} initial={initial} />
    </div>
  );
}
