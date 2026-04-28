import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Hero } from "@/components/public/hero";
import { RosterStrip } from "@/components/public/roster-strip";
import { TrophyCase } from "@/components/public/trophy-case";
import { StatsWall } from "@/components/public/stats-wall";
import { CareerMap } from "@/components/public/career-map";
import { TacticsBoard } from "@/components/public/tactics-board";
import { SocialsBlock } from "@/components/public/socials-block";
import { EventsPreview } from "@/components/public/events-preview";
import { StorePreview } from "@/components/public/store-preview";
import { GiveawayHero } from "@/components/public/giveaway-hero";
import { HeroOverlayMount } from "@/components/scenes/HeroOverlayMount";
import { isLocale } from "@/lib/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const intro = await getTranslations({ locale, namespace: "intro" });

  return (
    <>
      <HeroOverlayMount
        scrollLabel={intro("scroll")}
        liveLabel={intro("live")}
        sectorLabel={intro("sector")}
        contextLabel={intro("context")}
        skipLabel={intro("skip")}
      />
      <Hero locale={locale} />
      <RosterStrip locale={locale} />
      <TacticsBoard locale={locale} />
      <TrophyCase locale={locale} />
      <StatsWall locale={locale} />
      <CareerMap locale={locale} variant="home" />
      <StorePreview locale={locale} />
      <EventsPreview locale={locale} />
      <GiveawayHero locale={locale} />
      <SocialsBlock locale={locale} />
    </>
  );
}
