import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getMilestone } from "@/lib/admin/data/team";
import { MilestoneForm } from "../../milestone-form";
import type { MilestoneInput } from "../../actions";

export default async function EditMilestonePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const m = await getMilestone(id);
  if (!m) notFound();

  const title = (m.title ?? {}) as { en?: string; ar?: string };
  const description = (m.description ?? {}) as { en?: string; ar?: string };

  const initial: MilestoneInput = {
    occurred_on: m.occurred_on.slice(0, 10),
    category: m.category,
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    image_url: m.image_url,
    display_order: m.display_order,
    is_published: m.is_published,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// CHRONICLE / ${m.category.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit milestone
      </h1>
      <MilestoneForm mode="edit" id={m.id} locale={locale} initial={initial} />
    </div>
  );
}
