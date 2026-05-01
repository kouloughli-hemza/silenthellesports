import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/brand";
import { Link } from "@/lib/i18n/routing";
import {
  countUpcomingEvents,
  getEventSignupCount,
  getUpcomingEvents,
} from "@/lib/data/events";
import { EventCard } from "@/components/public/event-card";
import type { Locale } from "@/types/domain";

interface EventsPreviewProps {
  locale: Locale;
}

// Home preview is intentionally session-agnostic so the page can be served
// from the CDN cache. The "already signed up" badge surfaces on the dedicated
// /events listing and detail pages, which are dynamic by necessity.
export async function EventsPreview({ locale }: EventsPreviewProps) {
  const t = await getTranslations({ locale, namespace: "events" });
  const isAr = locale === "ar";

  const [events, upcomingCount] = await Promise.all([
    getUpcomingEvents(2),
    countUpcomingEvents(),
  ]);

  // Resolve signup counts for both cards in parallel.
  const signups = await Promise.all(events.map((e) => getEventSignupCount(e.id)));

  return (
    <section
      id="events"
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
          <Link href="/events" locale={locale} className="btn-ghost">
            {t("all")}
            <span style={{ color: "var(--hell-red)" }}>{isAr ? "←" : "→"}</span>
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyEvents message={t("empty")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                signupCount={signups[i] ?? 0}
                locale={locale}
                variant="upcoming"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyEvents({ message }: { message: string }) {
  return (
    <div
      className="notch p-10 text-center"
      style={{ background: "var(--ash-1)", border: "1px solid rgba(230,0,19,0.25)" }}
    >
      <p
        className="font-display text-2xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
    </div>
  );
}
