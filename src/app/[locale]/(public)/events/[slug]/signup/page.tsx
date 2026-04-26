import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, isLocale } from "@/lib/i18n/routing";
import { getEventBySlug, getEventSignupCount } from "@/lib/data/events";
import { getSessionUser } from "@/lib/auth/session";
import { formatDateLong, formatTime } from "@/lib/utils/format";
import { formatPrice, pickTranslation } from "@/types/domain";

import { SignupForm } from "./signup-form";

interface SignupPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: SignupPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const t = await getTranslations({ locale, namespace: "events" });
  const title = pickTranslation(event.title, locale);
  return {
    title: t("signupTitle", { title }),
    description: t("signupDescription", { title }),
    alternates: {
      canonical: `/${locale}/events/${slug}/signup`,
      languages: {
        en: `/en/events/${slug}/signup`,
        ar: `/ar/events/${slug}/signup`,
      },
    },
    robots: { index: false, follow: true },
  };
}

export default async function EventSignupPage({ params }: SignupPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const t = await getTranslations({ locale, namespace: "events" });
  const sessionUser = await getSessionUser();
  const signupCount = await getEventSignupCount(event.id);

  const title = pickTranslation(event.title, locale);
  const tag = (event.tag ?? "").trim().toUpperCase();
  const capacity = event.capacity || 0;
  const filled = Math.min(signupCount, capacity);
  const pct = capacity > 0 ? Math.min(100, (filled / capacity) * 100) : 0;
  const isFull = capacity > 0 && filled >= capacity;
  const isPaid = event.entry_fee > 0;

  const allowedStatus =
    event.status === "upcoming" ||
    event.status === "open" ||
    event.status === "live";
  const closedByTime =
    new Date(event.registration_closes_at).getTime() < Date.now();
  const dbWriteAllowed =
    (event.status === "upcoming" || event.status === "open") &&
    !closedByTime &&
    !isFull;
  const isClosed = !allowedStatus || closedByTime || isFull;

  const feeLabel = isPaid
    ? formatPrice(event.entry_fee, locale, "DZD")
    : t("free");

  const startsLong = formatDateLong(event.start_at, locale);
  const startsTime = formatTime(event.start_at, locale);

  // Has the current user already signed up?
  let alreadySignedCode: string | null = null;
  if (sessionUser) {
    // We use the public client via the data lib? There is no helper — inline a quick lookup using the public client.
    const { createPublicClient } = await import("@/lib/supabase/public");
    const supabase = createPublicClient();
    const { data: existing } = await supabase
      .from("event_signups")
      .select("confirmation_code")
      .eq("event_id", event.id)
      .eq("user_id", sessionUser.id)
      .maybeSingle();
    if (existing?.confirmation_code) {
      alreadySignedCode = existing.confirmation_code;
    }
  }

  return (
    <article
      className="grain relative min-h-screen pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
    >
      {/* Hero band */}
      <header
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--ash-3) 0%, var(--black) 100%)",
        }}
      >
        <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
          <div className="flex items-start justify-between gap-3">
            <div
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "var(--hell-red)" }}
            >
              {tag.length > 0 ? tag : t("signupHero")}
            </div>
            <Link
              href={`/events/${slug}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase transition-colors hover:opacity-80"
              style={{
                background: "var(--ash-3)",
                color: "var(--bone)",
                border: "1px solid rgba(245,240,232,0.15)",
              }}
            >
              <span aria-hidden>{locale === "ar" ? "→" : "←"}</span>
              {t("backToEvents")}
            </Link>
          </div>
          <h1
            className="font-display mt-3 text-3xl leading-[0.95] font-black tracking-tight uppercase italic md:text-5xl"
            style={{ color: "var(--bone)" }}
          >
            {title}
          </h1>
          <div
            className="mt-3 font-mono text-xs tracking-[0.2em] uppercase"
            style={{ color: "rgba(245,240,232,0.6)" }}
          >
            {startsLong} · {startsTime} · {event.mode}
            {event.map ? ` · ${event.map}` : ""} · {feeLabel}
          </div>

          {/* slot bar */}
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {t("slots")}
              </div>
              <div className="font-display text-xl font-black italic">
                <span className="stat-number">{filled}</span>
                <span style={{ color: "rgba(245,240,232,0.4)" }}>
                  &nbsp;/&nbsp;{capacity}
                </span>
              </div>
            </div>
            <div className="slot-bar mt-2" aria-hidden>
              <div style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-10 max-w-[1100px] px-6 md:px-10">
        {alreadySignedCode ? (
          <div
            className="notch p-8 text-center"
            style={{ background: "var(--ash-1)" }}
            role="status"
          >
            <div
              className="font-display text-2xl font-black uppercase italic md:text-3xl"
              style={{ color: "var(--hell-red)" }}
            >
              {t("alreadyIn")}
            </div>
            <div
              className="mt-3 inline-block px-4 py-2 font-mono text-xs tracking-wider"
              style={{ background: "var(--ash-3)", color: "var(--ember)" }}
            >
              {t("alreadyInDetail", { code: `SH-${alreadySignedCode}` })}
            </div>
            <div className="mt-6">
              <Link href={`/events/${slug}`} className="btn-hell">
                {t("viewEvent")}
              </Link>
            </div>
          </div>
        ) : isClosed || !dbWriteAllowed ? (
          <div
            className="notch p-8 text-center"
            style={{ background: "var(--ash-1)" }}
            role="status"
          >
            <div
              className="font-display text-2xl font-black uppercase italic md:text-3xl"
              style={{ color: "var(--hell-red)" }}
            >
              {isFull ? t("signupFull") : t("signupClosed")}
            </div>
            <div className="mt-6">
              <Link href={`/events/${slug}`} className="btn-ghost">
                {t("backToEvents")}
              </Link>
            </div>
          </div>
        ) : (
          <SignupForm
            locale={locale}
            slug={slug}
            mode={event.mode}
            isPaid={isPaid}
            defaultEmail={sessionUser?.email ?? ""}
            copy={{
              steps: [t("steps.0"), t("steps.1"), t("steps.2")] as [
                string,
                string,
                string,
              ],
              stepProgress: (current: number, total: number) =>
                t("stepProgress", { current, total }),
              ign: t("ign"),
              ignPlaceholder: t("ignPlaceholder"),
              uid: t("uid"),
              uidPlaceholder: t("uidPlaceholder"),
              uidHint: t("uidHint"),
              discord: t("discord"),
              discordPlaceholder: t("discordPlaceholder"),
              phone: t("phone"),
              phonePlaceholder: t("phonePlaceholder"),
              phoneHint: t("phoneHint"),
              emailOptional: t("emailOptional"),
              squad: t("squad"),
              squadMember: (n: number) => t("squadMember", { n }),
              squadMemberUid: (n: number) => t("squadMemberUid", { n }),
              abort: t("abort"),
              back: t("back"),
              cont: t("continue"),
              confirm: t("confirm"),
              submit: t("submit"),
              submitting: t("submitting"),
              payment: t("payment"),
              paymentNote: t("paymentNote"),
              freeTitle: t("freeTitle"),
              freeSub: t("freeSub"),
              slotted: t("slotted"),
              seeYou: t("seeYou"),
              operator: t("operator"),
              conf: t("conf"),
              viewEvent: t("viewEvent"),
              eventTitle: title.toUpperCase(),
              errors: {
                required: t("errorRequired"),
                ign: t("errorIgn"),
                uid: t("errorUid"),
                discord: t("errorDiscord"),
                phone: t("errorPhone"),
                email: t("errorEmail"),
                squad: t("errorSquad"),
                generic: t("error"),
                capacity: t("errorCapacity"),
                registrationClosed: t("errorRegistrationClosed"),
                duplicateUid: t("errorDuplicateUid"),
                signupClosed: t("signupClosed"),
              },
            }}
          />
        )}
      </section>
    </article>
  );
}
