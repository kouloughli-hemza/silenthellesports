import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Hero } from "@/components/public/hero";
import { RosterStrip } from "@/components/public/roster-strip";
import { TrophyCase } from "@/components/public/trophy-case";
import { SocialsBlock } from "@/components/public/socials-block";
import { EventsPreview } from "@/components/public/events-preview";
import { StorePreview } from "@/components/public/store-preview";
import { GiveawayHero } from "@/components/public/giveaway-hero";
import { isLocale } from "@/lib/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <Hero locale={locale} />
      <RosterStrip locale={locale} />
      <TrophyCase locale={locale} />
      <SocialsBlock locale={locale} />
      <EventsPreview locale={locale} />
      <StorePreview locale={locale} />
      <GiveawayHero locale={locale} />
    </>
  );
}
