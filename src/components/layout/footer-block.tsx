import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { LangSwitcher } from "./lang-switcher";
import { DiscordIcon } from "./discord-icon";
import { FooterFinalCircle } from "@/components/scenes/FooterFinalCircle";
import { getSiteConfig } from "@/lib/site-config";
import type { Locale } from "@/types/domain";

interface FooterBlockProps {
  locale: Locale;
}

interface FooterColumn {
  heading: string;
  links: Array<{ label: string; href: "/" | "/roster" | "/store" | "/events" | "/giveaways" | "/about" | "/contact" | "/terms" | "/privacy" | "/sizing" | "/returns" }>;
}

export async function FooterBlock({ locale }: FooterBlockProps) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const navT = await getTranslations({ locale, namespace: "nav" });
  const discordUrl = await getSiteConfig("socials.discord_url");
  const discordCount = await getSiteConfig("socials.discord_member_count");
  const sponsors = await getSiteConfig("sponsors");
  const year = new Date().getFullYear();

  const columns: FooterColumn[] = [
    {
      heading: t("sectors"),
      links: [
        { label: navT("home"), href: "/" },
        { label: navT("roster"), href: "/roster" },
        { label: navT("store"), href: "/store" },
        { label: navT("events"), href: "/events" },
        { label: navT("giveaways"), href: "/giveaways" },
      ],
    },
    {
      heading: t("squad"),
      links: [
        { label: locale === "ar" ? "عن الفريق" : "About", href: "/about" },
        { label: locale === "ar" ? "تواصل" : "Contact", href: "/contact" },
      ],
    },
    {
      heading: t("support"),
      links: [
        { label: locale === "ar" ? "الشروط" : "Terms", href: "/terms" },
        { label: locale === "ar" ? "الخصوصية" : "Privacy", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer
      className="grain relative pt-20 pb-10"
      style={{
        background: "var(--ash-3)",
        borderTop: "1px solid rgba(230,0,19,0.3)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-12 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image src="/logo.png" alt="Silent Hell" width={64} height={64} />
            <div className="font-display mt-4 text-2xl leading-tight font-black uppercase italic">
              {t("tag1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("tag2")}</span>
            </div>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hell mt-6"
            >
              <DiscordIcon />
              {t("discord")} · {discordCount}
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <div
                className="mb-4 font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {`// ${col.heading}`}
              </div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-display interactive text-sm font-bold tracking-wider uppercase italic transition-colors"
                      style={{ color: "rgba(245,240,232,0.7)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {sponsors.length > 0 ? (
          <div
            className="my-8 flex flex-wrap items-center gap-x-12 gap-y-3 border-t border-b py-6"
            style={{ borderColor: "rgba(245,240,232,0.08)" }}
          >
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(245,240,232,0.4)" }}
            >
              {t("sponsors")}
            </span>
            {sponsors.map((s) => (
              <span
                key={s}
                className="font-display text-base font-black tracking-wider uppercase italic"
                style={{ color: "rgba(245,240,232,0.6)", letterSpacing: "0.08em" }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}

        <div
          className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "rgba(245,240,232,0.4)" }}
        >
          <div>{t("copy", { year: String(year) })}</div>
          <div className="flex items-center gap-4">
            <FooterFinalCircle label={t("finalCircle")} />
            <LangSwitcher />
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{
            color: "rgba(245,240,232,0.45)",
            borderColor: "rgba(245,240,232,0.06)",
          }}
        >
          <span style={{ color: "var(--hell-red)" }}>{`// ${t("crafted")}`}</span>
          <span style={{ color: "rgba(245,240,232,0.7)" }}>Zaki Kouloughli</span>
          <span style={{ color: "rgba(245,240,232,0.25)" }}>·</span>
          <a
            href="mailto:kouloughlihemzait@gmail.com"
            className="interactive transition-colors hover:text-bone"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            kouloughlihemzait@gmail.com
          </a>
          <span style={{ color: "rgba(245,240,232,0.25)" }}>·</span>
          <a
            href="https://www.facebook.com/systeme32hacker/"
            target="_blank"
            rel="noopener noreferrer"
            className="interactive transition-colors hover:text-bone"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
}
