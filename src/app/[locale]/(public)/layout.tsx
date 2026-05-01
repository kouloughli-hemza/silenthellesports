import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { FooterBlock } from "@/components/layout/footer-block";
import { SpectatorCamTransition } from "@/components/scenes/SpectatorCamTransition";
import { isLocale } from "@/lib/i18n/routing";
import { getSiteConfig } from "@/lib/site-config";

// Layout intentionally avoids reading cookies / per-user data so its render
// output can be cached at Vercel's CDN. The TopBar fills in auth + cart
// state on the client via /api/me.
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

  const discordUrl = await getSiteConfig("socials.discord_url");

  return (
    <>
      <TopBar discordUrl={discordUrl} />
      <SpectatorCamTransition />
      {children}
      <FooterBlock locale={locale} />
    </>
  );
}
