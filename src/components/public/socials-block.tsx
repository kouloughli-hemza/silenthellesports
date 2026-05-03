import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/brand";
import { getSiteConfig } from "@/lib/site-config";
import type { Locale } from "@/types/domain";

interface SocialsBlockProps {
  locale: Locale;
}

function stripAt(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

// Build a TikTok profile URL from a stored handle. Handles can be entered as
// "@silenthell.esports", "silenthell.esports", or a full URL — normalize.
function tiktokUrlFor(handle: string): string {
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://www.tiktok.com/@${stripAt(handle)}`;
}

function instagramUrlFor(handle: string): string {
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://www.instagram.com/${stripAt(handle)}`;
}

export async function SocialsBlock({ locale }: SocialsBlockProps) {
  const t = await getTranslations({ locale, namespace: "socials" });
  const isAr = locale === "ar";
  const arrow = isAr ? "←" : "→";

  const [tiktokHandle, discordUrl, discordCount, instagramHandle] = await Promise.all([
    getSiteConfig("socials.tiktok_handle"),
    getSiteConfig("socials.discord_url"),
    getSiteConfig("socials.discord_member_count"),
    getSiteConfig("socials.instagram_handle"),
  ]);

  const tiktokUrl = tiktokUrlFor(tiktokHandle);
  const tiktokDisplay = `@${stripAt(tiktokHandle.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, ""))}`;
  const instagramUrl = instagramUrlFor(instagramHandle);
  const instagramDisplay = `@${stripAt(instagramHandle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, ""))}`;

  return (
    <section className="py-20 md:py-28" style={{ background: "var(--black)" }}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeading
          label={t("label")}
          title={
            <>
              {t("t1")}
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          <SocialCard
            href={tiktokUrl}
            ariaLabel={`TikTok · ${tiktokDisplay}`}
            icon={<TikTokIcon />}
            badge="TIKTOK"
            title={t("tiktokTitle")}
            handle={tiktokDisplay}
            sub={t("tiktokSub")}
            cta={t("tiktokCta")}
            arrow={arrow}
          />
          <SocialCard
            href={discordUrl}
            ariaLabel="Discord"
            icon={<DiscordIcon />}
            badge="DISCORD"
            title={t("discordTitle")}
            handle="discord.gg"
            sub={t("discordSub", { count: discordCount })}
            cta={t("discordCta")}
            arrow={arrow}
          />
          <SocialCard
            href={instagramUrl}
            ariaLabel={`Instagram · ${instagramDisplay}`}
            icon={<InstagramIcon />}
            badge="INSTAGRAM"
            title={t("instagramTitle")}
            handle={instagramDisplay}
            sub={t("instagramSub")}
            cta={t("instagramCta")}
            arrow={arrow}
          />
        </div>
      </div>
    </section>
  );
}

interface SocialCardProps {
  href: string;
  ariaLabel: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  handle: string;
  sub: string;
  cta: string;
  arrow: string;
}

function SocialCard({
  href,
  ariaLabel,
  icon,
  badge,
  title,
  handle,
  sub,
  cta,
  arrow,
}: SocialCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card-bite notch group flex flex-col p-6"
      style={{ background: "var(--ash-1)" }}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center"
          style={{ background: "var(--black)", color: "var(--bone)" }}
          aria-hidden
        >
          {icon}
        </div>
        <span
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ background: "var(--hell-red)", color: "var(--bone)", padding: "4px 8px" }}
        >
          {badge}
        </span>
      </div>

      <div className="mt-6 font-display text-xl leading-tight font-black uppercase italic md:text-2xl">
        {title}
      </div>
      <div
        className="mt-1 truncate font-mono text-xs tracking-wider"
        style={{ color: "var(--ember)" }}
      >
        {handle}
      </div>
      <div
        className="mt-3 text-sm leading-relaxed"
        style={{ color: "rgba(245,240,232,0.65)" }}
      >
        {sub}
      </div>

      <div
        className="mt-auto flex items-center justify-between pt-6 font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        <span>{cta}</span>
        <span>{arrow}</span>
      </div>
    </a>
  );
}

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.51a8.16 8.16 0 0 0 4.77 1.52V6.6a4.85 4.85 0 0 1-1.84.09Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.372.292a.077.077 0 0 1-.006.128 12.298 12.298 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
