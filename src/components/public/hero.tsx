import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EmberField } from "@/components/brand";
import { HeroGallery } from "@/components/public/hero-gallery";
import { getSiteConfig } from "@/lib/site-config";
import { pickTranslation, type Locale } from "@/types/domain";

interface HeroProps {
  locale: Locale;
}

export async function Hero({ locale }: HeroProps) {
  const t = await getTranslations({ locale, namespace: "hero" });
  const ctaT = await getTranslations({ locale, namespace: "cta" });
  const headline = await getSiteConfig("hero.headline");
  const tagline = await getSiteConfig("hero.tagline");
  const season = await getSiteConfig("hero.season");
  const discordUrl = await getSiteConfig("socials.discord_url");
  const isAr = locale === "ar";

  return (
    <>
    <section
      id="home"
      className="grain relative overflow-hidden"
      style={{ minHeight: "100svh", background: "var(--black)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 90%, rgba(230,0,19,0.18), transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 30% at 50% 60%, rgba(255,69,0,0.12), transparent 70%)",
        }}
        aria-hidden
      />
      <EmberField count={40} />

      {/* corner mono indicators */}
      <div
        className="absolute top-20 left-6 z-10 font-mono text-[10px] tracking-[0.25em] uppercase md:left-10"
        style={{ color: "rgba(245,240,232,0.4)" }}
      >
        <div style={{ color: "var(--hell-red)" }}>{t("sector")}</div>
        <div className="mt-1">{t("est")}</div>
      </div>
      <div
        className="absolute top-20 right-6 z-10 text-right font-mono text-[10px] tracking-[0.25em] uppercase md:right-10"
        style={{ color: "rgba(245,240,232,0.4)" }}
      >
        <div className="flex items-center justify-end gap-2">
          <span className="live-dot" /> <span style={{ color: "var(--hell-red)" }}>{t("liveOps")}</span>
        </div>
        <div className="mt-1">{t("uplink")}</div>
      </div>

      {/* main hero content
          - mobile: only the logo, dead center, full-screen brand moment
          - desktop: 3-col grid (text | logo | stats) like before */}
      <div
        className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-center px-5 md:block md:px-10 md:pt-40 md:pb-24"
        style={{ minHeight: "100svh" }}
      >
        <div className="grid w-full items-center justify-items-center gap-4 md:gap-16 md:grid-cols-[1fr_auto_1fr] md:justify-items-stretch">
          {/* left: tagline + CTAs — desktop only */}
          <div className="anim-fade-up hidden md:block md:order-1" style={{ animationDelay: "1.2s" }}>
            <div className="section-label mb-3 md:mb-6">
              <span>{t("eyebrow")}</span>
            </div>
            <h1
              className="font-display text-3xl leading-[0.9] font-black uppercase sm:text-4xl md:text-7xl md:leading-[0.85]"
              style={{ color: "var(--bone)" }}
            >
              {pickTranslation(headline.l1, locale)}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{pickTranslation(headline.l2, locale)}</span>
              <br />
              {pickTranslation(headline.l3, locale)}
              <br />
              <span className="italic" style={{ color: "var(--bone)" }}>
                {pickTranslation(headline.l4, locale)}
              </span>
            </h1>
            <p
              className="mt-3 hidden max-w-md font-mono text-sm tracking-wide md:mt-6 md:block"
              style={{ color: "rgba(245,240,232,0.65)" }}
            >
              {pickTranslation(tagline, locale)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-10 md:gap-4">
              <a
                className="btn-hell"
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ctaT("joinDiscord")}
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                <DiscordIcon />
                {ctaT("joinDiscord")}
              </a>
              <a className="btn-ghost" href={`/${locale}/events`} style={{ padding: "9px 16px", fontSize: 13 }}>
                {ctaT("viewEvents")}
                <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
              </a>
            </div>
          </div>

          {/* center: logo — full-screen on mobile, center column on desktop */}
          <div className="anim-burst flex justify-center md:order-2" style={{ minWidth: 0 }}>
            <div className="relative">
              <div
                className="absolute inset-0 -z-0"
                style={{
                  background: "radial-gradient(circle, rgba(230,0,19,0.55) 0%, transparent 60%)",
                  filter: "blur(50px)",
                  transform: "scale(1.7)",
                }}
                aria-hidden
              />
              <Image
                src="/logo.png"
                alt="Silent Hell Esports"
                width={360}
                height={360}
                priority
                className="relative z-10 h-auto"
                style={{
                  width: "min(360px, 70vw)",
                  filter: "drop-shadow(0 0 28px rgba(230,0,19,0.55))",
                }}
              />
            </div>
          </div>

          {/* right: gallery — desktop only */}
          <div className="anim-fade-up hidden md:block md:order-3" style={{ animationDelay: "1.4s" }}>
            <HeroGallery locale={locale} />
            <div
              className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              <span className="live-dot" /> {pickTranslation(season, locale)}
            </div>
          </div>
        </div>
      </div>

      {/* bottom scroll cue */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-end justify-start px-6 md:px-10">
        <div
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(245,240,232,0.4)" }}
        >
          {t("scroll")}
        </div>
      </div>
    </section>

    {/* mobile-only: headline + CTAs + stats live below the logo hero */}
    <section
      className="relative overflow-hidden md:hidden"
      style={{ background: "var(--ash-3)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(230,0,19,0.12), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 px-5 pt-12 pb-14">
        <div className="section-label mb-4">
          <span>{t("eyebrow")}</span>
        </div>
        <h2
          className="font-display text-4xl leading-[0.9] font-black uppercase"
          style={{ color: "var(--bone)" }}
        >
          {pickTranslation(headline.l1, locale)}
          <br />
          <span style={{ color: "var(--hell-red)" }}>{pickTranslation(headline.l2, locale)}</span>
          <br />
          {pickTranslation(headline.l3, locale)}
          <br />
          <span className="italic">{pickTranslation(headline.l4, locale)}</span>
        </h2>
        <p
          className="mt-4 font-mono text-sm tracking-wide"
          style={{ color: "rgba(245,240,232,0.7)" }}
        >
          {pickTranslation(tagline, locale)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="btn-hell"
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ctaT("joinDiscord")}
          >
            <DiscordIcon />
            {ctaT("joinDiscord")}
          </a>
          <a className="btn-ghost" href={`/${locale}/events`}>
            {ctaT("viewEvents")}
            <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
          </a>
        </div>
        <div className="mt-8">
          <HeroGallery locale={locale} />
        </div>
        <div
          className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(245,240,232,0.5)" }}
        >
          <span className="live-dot" /> {pickTranslation(season, locale)}
        </div>
      </div>
    </section>
    </>
  );
}

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 4.4A20 20 0 0 0 15 3l-.2.4a18 18 0 0 0-5.6 0L9 3a20 20 0 0 0-5 1.4A21 21 0 0 0 .5 17.4 20 20 0 0 0 6.6 20.4l.5-.7a14 14 0 0 1-2.2-1.1l.6-.4a14 14 0 0 0 13 0l.6.4a14 14 0 0 1-2.2 1.1l.5.7a20 20 0 0 0 6.1-3 21 21 0 0 0-3.5-13zM8.5 15.4c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5zm7 0c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5z" />
    </svg>
  );
}
