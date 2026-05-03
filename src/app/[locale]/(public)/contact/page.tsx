import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n/routing";
import { getSiteConfig } from "@/lib/site-config";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        en: "/en/contact",
        ar: "/ar/contact",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });
  const [discordUrl, tiktokHandle, instagramHandle] = await Promise.all([
    getSiteConfig("socials.discord_url"),
    getSiteConfig("socials.tiktok_handle"),
    getSiteConfig("socials.instagram_handle"),
  ]);

  const stripAt = (h: string) => (h.startsWith("@") ? h.slice(1) : h);
  const tiktokUrl = /^https?:\/\//i.test(tiktokHandle)
    ? tiktokHandle
    : `https://www.tiktok.com/@${stripAt(tiktokHandle)}`;
  const instagramUrl = /^https?:\/\//i.test(instagramHandle)
    ? instagramHandle
    : `https://www.instagram.com/${stripAt(instagramHandle)}`;

  return (
    <article>
      <header
        className="grain relative overflow-hidden"
        style={{ background: "var(--black)" }}
      >
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 30% 60%, rgba(230,0,19,0.18), transparent 70%), linear-gradient(180deg, var(--black) 0%, transparent 40%, transparent 70%, var(--ash-3) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 pt-28 pb-12 md:px-10 md:pt-36 md:pb-16">
          <span className="section-label">{t("label")}</span>
          <h1
            className="font-display mt-5 text-4xl leading-[0.9] font-black uppercase md:text-6xl"
            style={{ color: "var(--bone)" }}
          >
            {t("t1")}
            <br />
            <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
          </h1>
          <p
            className="mt-4 max-w-xl font-mono text-sm tracking-wide"
            style={{ color: "rgba(245,240,232,0.7)" }}
          >
            {t("intro")}
          </p>
        </div>
      </header>

      <section
        className="relative py-16 md:py-20"
        style={{ background: "var(--ash-3)" }}
      >
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[1.4fr_1fr] md:px-10">
          <ContactForm
            i18n={{
              nameLabel: t("nameLabel"),
              namePlaceholder: t("namePlaceholder"),
              emailLabel: t("emailLabel"),
              emailPlaceholder: t("emailPlaceholder"),
              subjectLabel: t("subjectLabel"),
              subjectPlaceholder: t("subjectPlaceholder"),
              messageLabel: t("messageLabel"),
              messagePlaceholder: t("messagePlaceholder"),
              submit: t("submit"),
              submitting: t("submitting"),
              success: t("success"),
              required: t("required"),
              tooShort: t("tooShort"),
              invalidEmail: t("invalidEmail"),
              error: t("error"),
            }}
          />

          <aside className="space-y-4">
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {t("otherWays")}
            </div>
            <ChannelCard
              href={discordUrl}
              title="Discord"
              sub={t("discordSub")}
            />
            <ChannelCard
              href={tiktokUrl}
              title="TikTok"
              sub={t("tiktokSub")}
            />
            <ChannelCard
              href={instagramUrl}
              title="Instagram"
              sub={t("instagramSub")}
            />
          </aside>
        </div>
      </section>
    </article>
  );
}

function ChannelCard({
  href,
  title,
  sub,
}: {
  href: string;
  title: string;
  sub: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card-bite notch interactive group block p-4"
      style={{ background: "var(--ash-1)" }}
    >
      <div className="font-display text-lg font-black uppercase italic">
        {title}
      </div>
      <div
        className="mt-1 text-xs"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {sub}
      </div>
    </a>
  );
}
