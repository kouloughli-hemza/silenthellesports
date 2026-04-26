import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/public/event-card";
import { SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import { isLocale } from "@/lib/i18n/routing";
import {
  countUpcomingEvents,
  getEventSignupCount,
  getPastEvents,
  getUpcomingEvents,
} from "@/lib/data/events";
import type { Event } from "@/types/domain";

type Tab = "upcoming" | "past";

function parseTab(raw: string | undefined): Tab {
  return raw === "past" ? "past" : "upcoming";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "events" });
  return {
    title: t("indexTitle"),
    description: t("indexDescription"),
    alternates: {
      canonical: `/${locale}/events`,
      languages: {
        en: "/en/events",
        ar: "/ar/events",
      },
    },
    openGraph: {
      title: t("indexTitle"),
      description: t("indexDescription"),
      type: "website",
    },
  };
}

interface EventsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function EventsPage({
  params,
  searchParams,
}: EventsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);

  const t = await getTranslations({ locale, namespace: "events" });

  const [upcomingCount, events] = await Promise.all([
    countUpcomingEvents(),
    tab === "past" ? getPastEvents() : getUpcomingEvents(),
  ]);

  // Fetch signup counts in parallel
  const signupCounts = await Promise.all(
    events.map((ev) => getEventSignupCount(ev.id)),
  );

  const tabs: { key: Tab; label: string; href: string }[] = [
    { key: "upcoming", label: t("tabs.upcoming"), href: "/events" },
    { key: "past", label: t("tabs.past"), href: "/events?tab=past" },
  ];

  return (
    <section
      className="grain relative py-24 md:py-32"
      style={{ background: "var(--black)" }}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            label={t("label", { count: upcomingCount })}
            title={
              <>
                {t("t1")}
                <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
                <br />
                {t("t3")}
              </>
            }
          />

          <nav
            className="flex gap-px"
            style={{ background: "rgba(230,0,19,0.3)" }}
            aria-label={t("tabs.upcoming") + " / " + t("tabs.past")}
          >
            {tabs.map((tabItem) => {
              const active = tabItem.key === tab;
              return (
                <Link
                  key={tabItem.key}
                  href={tabItem.href}
                  prefetch={false}
                  className="px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase transition-colors"
                  style={{
                    background: active
                      ? "var(--hell-red)"
                      : "var(--ash-1)",
                    color: active
                      ? "var(--bone)"
                      : "rgba(245,240,232,0.6)",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {tabItem.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {events.length === 0 ? (
          <EmptyState
            message={tab === "past" ? t("emptyPast") : t("emptyUpcoming")}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((event: Event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                signupCount={signupCounts[idx] ?? 0}
                locale={locale}
                variant={tab}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="notch flex flex-col items-center justify-center gap-3 px-6 py-20 text-center"
      style={{ background: "var(--ash-1)" }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// NO SIGNAL"}
      </div>
      <p
        className="max-w-md font-display text-2xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
    </div>
  );
}
