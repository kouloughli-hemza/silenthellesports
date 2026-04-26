import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getPage } from "@/lib/admin/data/pages";
import { PageForm } from "../../page-form";
import type { PageInput } from "../../actions";

export default async function EditCmsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const page = await getPage(id);
  if (!page) notFound();

  const title = (page.title ?? {}) as { en?: string; ar?: string };
  const body = (page.body ?? {}) as { en?: string; ar?: string };
  const meta = (page.meta_description ?? {}) as { en?: string; ar?: string };

  const initial: PageInput = {
    slug: page.slug,
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    body: { en: body.en ?? "", ar: body.ar ?? "" },
    meta_description: { en: meta.en ?? "", ar: meta.ar ?? "" },
    is_published: page.is_published,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// PAGES / ${page.slug.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit /{page.slug}
      </h1>
      <PageForm mode="edit" id={page.id} locale={locale} initial={initial} />
    </div>
  );
}
