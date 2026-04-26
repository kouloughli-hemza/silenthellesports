import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/lib/i18n/routing";
import { isLocale } from "@/lib/i18n/routing";
import { getPageBySlug, getPublishedPageSlugs } from "@/lib/data/pages";
import { formatDateLong } from "@/lib/utils/format";
import { renderMarkdown } from "@/lib/utils/markdown";
import { pickTranslation } from "@/types/domain";

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getPublishedPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageBySlug(slug);
  if (!page) return {};
  const t = await getTranslations({ locale, namespace: "page" });
  const title = pickTranslation(page.title, locale);
  const meta = pickTranslation(page.meta_description, locale);
  return {
    title: t("metaFallback", { title }),
    description: meta || t("metaFallback", { title }),
    alternates: {
      canonical: `/${locale}/${slug}`,
      languages: {
        en: `/en/${slug}`,
        ar: `/ar/${slug}`,
      },
    },
    openGraph: {
      title: t("metaFallback", { title }),
      description: meta || t("metaFallback", { title }),
      type: "article",
    },
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const t = await getTranslations({ locale, namespace: "page" });

  const title = pickTranslation(page.title, locale);
  const body = pickTranslation(page.body, locale);
  const html = renderMarkdown(body);
  const lastUpdated = formatDateLong(page.updated_at, locale);

  return (
    <article>
      {/* Hero band */}
      <header
        className="grain relative overflow-hidden"
        style={{ background: "var(--black)" }}
      >
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 30% 60%, rgba(230,0,19,0.18), transparent 70%), linear-gradient(180deg, var(--black) 0%, transparent 40%, transparent 70%, var(--ash-3) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-12 md:px-10 md:pt-36 md:pb-16">
          <nav
            aria-label={t("breadcrumb")}
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            <Link
              href="/"
              className="transition-colors"
              style={{ color: "var(--hell-red)" }}
            >
              {t("breadcrumb")}
            </Link>{" "}
            <span style={{ color: "rgba(245,240,232,0.3)" }}>/</span>{" "}
            <span>{slug.toUpperCase()}</span>
          </nav>
          <h1
            className="font-display mt-5 text-4xl leading-[0.9] font-black uppercase md:text-6xl"
            style={{ color: "var(--bone)" }}
          >
            {title}
          </h1>
        </div>
      </header>

      {/* Article body */}
      <section
        className="relative py-16 md:py-20"
        style={{ background: "var(--ash-3)" }}
      >
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          {html ? (
            <div
              className="cms-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p
              className="font-mono text-sm tracking-wider"
              style={{ color: "rgba(245,240,232,0.55)" }}
            >
              —
            </p>
          )}

          <footer
            className="mt-16 border-t pt-6 font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{
              borderColor: "rgba(245,240,232,0.1)",
              color: "rgba(245,240,232,0.5)",
            }}
          >
            {t("lastUpdated", { date: lastUpdated })}
          </footer>
        </div>
      </section>
    </article>
  );
}
