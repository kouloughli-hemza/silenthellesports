import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { FooterBlock } from "@/components/layout/footer-block";
import { isLocale } from "@/lib/i18n/routing";
import { getSiteConfig } from "@/lib/site-config";
import { getSessionUser } from "@/lib/auth/session";
import { readCartCount } from "@/lib/cart/detail";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [discordUrl, sessionUser, cartCount] = await Promise.all([
    getSiteConfig("socials.discord_url"),
    getSessionUser(),
    readCartCount(),
  ]);

  return (
    <>
      <TopBar
        discordUrl={discordUrl}
        signedIn={Boolean(sessionUser)}
        cartCount={cartCount}
      />
      {children}
      <FooterBlock locale={locale} />
    </>
  );
}
