import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Chronicle } from "@/components/public/chronicle";
import { StatsWall } from "@/components/public/stats-wall";
import { isLocale } from "@/lib/i18n/routing";
import type { Locale } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "history" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/history`,
      languages: { en: "/en/history", ar: "/ar/history" },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "article",
    },
  };
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <StatsWall locale={locale as Locale} />
      <Chronicle locale={locale as Locale} variant="page" />
    </>
  );
}
