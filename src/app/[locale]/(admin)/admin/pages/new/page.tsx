import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { PageForm } from "../page-form";
import type { PageInput } from "../actions";

const EMPTY: PageInput = {
  slug: "",
  title: { en: "", ar: "" },
  body: { en: "", ar: "" },
  meta_description: { en: "", ar: "" },
  is_published: false,
};

export default async function NewCmsPage({
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
        {"// PAGES / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Page
      </h1>
      <PageForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
