import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getSiteConfig } from "@/lib/site-config";
import { SiteConfigForm } from "./site-config-form";

export default async function AdminSiteConfigPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [headline, tagline, stats, season, discordUrl, discordCount, twitch, youtube, x, instagram, tiktok, drop, giveDrop, sponsors, fromWilaya, featuredEnds] =
    await Promise.all([
      getSiteConfig("hero.headline"),
      getSiteConfig("hero.tagline"),
      getSiteConfig("hero.stats"),
      getSiteConfig("hero.season"),
      getSiteConfig("socials.discord_url"),
      getSiteConfig("socials.discord_member_count"),
      getSiteConfig("socials.twitch_channel"),
      getSiteConfig("socials.youtube_channel"),
      getSiteConfig("socials.x_handle"),
      getSiteConfig("socials.instagram_handle"),
      getSiteConfig("socials.tiktok_handle"),
      getSiteConfig("store.current_drop"),
      getSiteConfig("giveaway.current_drop"),
      getSiteConfig("sponsors"),
      getSiteConfig("shipping.from_wilaya_code"),
      getSiteConfig("store.featured_collection_ends_at"),
    ]);

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// SITE CONFIG"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Site Configuration
      </h1>
      <p
        className="mt-2 font-mono text-xs"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        Hero copy, social handles, sponsors, drop numbers. Changes are live immediately.
      </p>

      <SiteConfigForm
        initial={{
          headline,
          tagline,
          stats,
          season,
          discordUrl,
          discordCount,
          twitch,
          youtube,
          x,
          instagram,
          tiktok,
          drop,
          giveDrop,
          sponsors,
          fromWilaya,
          featuredEnds,
        }}
      />
    </div>
  );
}
