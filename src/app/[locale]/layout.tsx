import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { fontVariables } from "@/lib/fonts";
import { dirFor, isLocale, routing } from "@/lib/i18n/routing";
import { CustomCursor } from "@/components/brand";
import { NavProgress } from "@/components/layout/nav-progress";
import { getPublicEnv } from "@/lib/env";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const env = getPublicEnv();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      siteName: "Silent Hell Esports",
      locale: locale === "ar" ? "ar_DZ" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={dirFor(locale)} className={fontVariables}>
      <body>
        <a href="#main" className="skip-link">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NavProgress />
          <CustomCursor />
          <main id="main">{children}</main>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
