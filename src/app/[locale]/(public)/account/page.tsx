import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, isLocale, redirect } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import {
  formatPrice,
  pickTranslation,
  type Order,
  type EventSignup,
  type GiveawayEntry,
} from "@/types/domain";
import type { Json } from "@/types/database";
import { formatDateLong } from "@/lib/utils/format";
import { ProfileForm, type ProfileFormLabels } from "./profile-form";
import { SignOutButton } from "./sign-out-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: `${t("metaTitle")} · Silent Hell Esports`,
    robots: { index: false, follow: false },
  };
}

interface SignupWithEvent extends EventSignup {
  event: { slug: string; title: Json; start_at: string } | null;
}

interface EntryWithGiveaway extends GiveawayEntry {
  giveaway: {
    slug: string;
    title: Json;
    ends_at: string;
    status: "upcoming" | "active" | "drawing" | "completed";
    winner_user_id: string | null;
  } | null;
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect({
      href: { pathname: "/login", query: { next: "/account" } },
      locale,
    });
    // Unreachable — `redirect` throws — but satisfies the narrower below.
    return null;
  }

  const supabase = await createClient();

  const [profile, ordersRes, signupsRes, entriesRes] = await Promise.all([
    getProfile(),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, total, currency, created_at, yalidine_tracking",
      )
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("event_signups")
      .select(
        "id, event_id, ign, pubg_uid, confirmation_code, status, payment_status, created_at, event:events(slug, title, start_at)",
      )
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("giveaway_entries")
      .select(
        "id, giveaway_id, entry_count, created_at, giveaway:giveaways(slug, title, ends_at, status, winner_user_id)",
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  type OrderRow = Pick<
    Order,
    | "id"
    | "order_number"
    | "status"
    | "total"
    | "currency"
    | "created_at"
    | "yalidine_tracking"
  >;
  const orders: OrderRow[] = (ordersRes.data ?? []) as unknown as OrderRow[];
  const signups = (signupsRes.data ?? []) as unknown as SignupWithEvent[];
  const entries = (entriesRes.data ?? []) as unknown as EntryWithGiveaway[];

  const t = await getTranslations({ locale, namespace: "account" });

  const displayName =
    (profile?.full_name && profile.full_name.trim().length > 0
      ? profile.full_name
      : sessionUser.email.split("@")[0]) ?? sessionUser.email;

  const isAdmin = profile?.role === "admin";

  const profileLabels: ProfileFormLabels = {
    name: t("name"),
    email: t("email"),
    phone: t("phone"),
    phoneHint: t("phoneHint"),
    save: t("save"),
    saving: t("saving"),
    saved: t("saved"),
    phoneInvalid: t("phoneInvalid"),
    genericError: t("genericError"),
  };

  return (
    <article
      className="grain relative pb-24 md:pb-32"
      style={{ background: "var(--black)" }}
    >
      {/* Hero band */}
      <header
        className="relative overflow-hidden pt-28 pb-10 md:pt-32 md:pb-14"
        style={{
          background:
            "linear-gradient(180deg, var(--ash-3) 0%, var(--black) 100%)",
          borderBottom: "1px solid rgba(230,0,19,0.25)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div
                className="font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "var(--hell-red)" }}
              >
                {`// ${t("eyebrow")}`}
              </div>
              <h1
                className="font-display mt-3 text-3xl leading-[0.95] font-black tracking-tight uppercase italic md:text-5xl"
                style={{ color: "var(--bone)" }}
              >
                {t("welcome", { name: displayName })}
              </h1>
              <p
                className="mt-3 font-mono text-xs tracking-[0.15em] uppercase break-all"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {sessionUser.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="font-mono text-[11px] tracking-[0.25em] uppercase interactive"
                  style={{
                    background: "var(--hell-red)",
                    color: "var(--bone)",
                    padding: "10px 18px",
                  }}
                >
                  {t("adminBadge")}
                </Link>
              ) : null}
              <SignOutButton label={t("signOut")} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-10 px-6 md:mt-12 md:grid-cols-[1fr_360px] md:px-10">
        {/* MAIN */}
        <div className="space-y-10 min-w-0">
          {/* Orders */}
          <section aria-labelledby="acc-orders">
            <SectionLabel id="acc-orders" label={t("sectionOrders")} />
            {orders.length === 0 ? (
              <EmptyCard
                message={t("emptyOrders")}
                ctaHref="/store"
                ctaLabel={t("ctaBrowseStore")}
              />
            ) : (
              <ul className="mt-5 grid gap-3">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.order_number}`}
                      className="notch interactive flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors"
                      style={{
                        background: "var(--ash-1)",
                        border: "1px solid rgba(245,240,232,0.06)",
                      }}
                      aria-label={`${t("viewOrder")} ${order.order_number}`}
                    >
                      <div className="min-w-0">
                        <div
                          className="font-mono text-[10px] tracking-[0.25em] uppercase"
                          style={{ color: "rgba(245,240,232,0.5)" }}
                        >
                          {t("orderNumber")}
                        </div>
                        <div
                          className="mt-1 font-display text-lg font-bold uppercase italic break-all"
                          style={{ color: "var(--bone)" }}
                        >
                          {order.order_number}
                        </div>
                        <div
                          className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
                          style={{ color: "rgba(245,240,232,0.4)" }}
                        >
                          {formatDateLong(order.created_at, locale)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="font-display text-lg font-black italic"
                          style={{ color: "var(--bone)" }}
                        >
                          {formatPrice(order.total, locale, order.currency)}
                        </div>
                        <OrderStatusPill
                          status={order.status}
                          label={t(`orderStatus.${order.status}`)}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Events */}
          <section aria-labelledby="acc-events">
            <SectionLabel id="acc-events" label={t("sectionEvents")} />
            {signups.length === 0 ? (
              <EmptyCard
                message={t("emptyEvents")}
                ctaHref="/events"
                ctaLabel={t("ctaBrowseEvents")}
              />
            ) : (
              <ul className="mt-5 grid gap-3">
                {signups.map((s) => {
                  const title = s.event
                    ? pickTranslation(s.event.title, locale)
                    : "—";
                  const startsAt = s.event?.start_at;
                  return (
                    <li key={s.id}>
                      <div
                        className="notch flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                        style={{
                          background: "var(--ash-1)",
                          border: "1px solid rgba(245,240,232,0.06)",
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="font-mono text-[10px] tracking-[0.25em] uppercase"
                            style={{ color: "rgba(245,240,232,0.5)" }}
                          >
                            {t("confirmationCode")}: {s.confirmation_code}
                          </div>
                          <div
                            className="mt-1 font-display text-lg font-bold uppercase italic"
                            style={{ color: "var(--bone)" }}
                          >
                            {title}
                          </div>
                          {startsAt ? (
                            <div
                              className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
                              style={{ color: "rgba(245,240,232,0.4)" }}
                            >
                              {formatDateLong(startsAt, locale)}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <SignupStatusPill
                            status={s.status}
                            label={t(`signupStatus.${s.status}`)}
                          />
                          {s.event ? (
                            <Link
                              href={`/events/${s.event.slug}`}
                              className="font-mono text-[10px] tracking-[0.25em] uppercase interactive"
                              style={{
                                color: "var(--hell-red)",
                                textDecoration: "underline",
                                textUnderlineOffset: 4,
                              }}
                            >
                              {t("viewEvent")}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Giveaways */}
          <section aria-labelledby="acc-giveaways">
            <SectionLabel id="acc-giveaways" label={t("sectionGiveaways")} />
            {entries.length === 0 ? (
              <EmptyCard
                message={t("emptyGiveaways")}
                ctaHref="/giveaways"
                ctaLabel={t("ctaBrowseGiveaways")}
              />
            ) : (
              <ul className="mt-5 grid gap-3">
                {entries.map((e) => {
                  const title = e.giveaway
                    ? pickTranslation(e.giveaway.title, locale)
                    : "—";
                  const won =
                    e.giveaway?.winner_user_id !== null &&
                    e.giveaway?.winner_user_id === sessionUser.id;
                  const ended =
                    e.giveaway?.status === "completed" ||
                    e.giveaway?.status === "drawing";
                  return (
                    <li key={e.id}>
                      <div
                        className="notch flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                        style={{
                          background: "var(--ash-1)",
                          border: "1px solid rgba(245,240,232,0.06)",
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="font-mono text-[10px] tracking-[0.25em] uppercase"
                            style={{ color: "rgba(245,240,232,0.5)" }}
                          >
                            {t("entries", { count: e.entry_count })}
                          </div>
                          <div
                            className="mt-1 font-display text-lg font-bold uppercase italic"
                            style={{ color: "var(--bone)" }}
                          >
                            {title}
                          </div>
                          {e.giveaway ? (
                            <div
                              className="mt-1 font-mono text-[10px] tracking-[0.15em] uppercase"
                              style={{ color: "rgba(245,240,232,0.4)" }}
                            >
                              {t("ends")}: {formatDateLong(e.giveaway.ends_at, locale)}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <GiveawayStatusPill
                            won={won}
                            ended={ended}
                            labelWon={t("giveawayStatus.won")}
                            labelPending={t("giveawayStatus.pending")}
                            labelEnded={t("giveawayStatus.ended")}
                          />
                          {e.giveaway ? (
                            <Link
                              href={`/giveaways/${e.giveaway.slug}`}
                              className="font-mono text-[10px] tracking-[0.25em] uppercase interactive"
                              style={{
                                color: "var(--hell-red)",
                                textDecoration: "underline",
                                textUnderlineOffset: 4,
                              }}
                            >
                              {t("viewGiveaway")}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* SIDEBAR — Profile */}
        <aside className="space-y-4">
          <div
            className="notch p-6"
            style={{ background: "var(--ash-1)" }}
          >
            <SectionLabel label={t("sectionProfile")} />
            <ProfileForm
              email={sessionUser.email}
              initialFullName={profile?.full_name ?? ""}
              initialPhone={profile?.phone ?? ""}
              labels={profileLabels}
            />
          </div>

          <p
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "rgba(245,240,232,0.4)" }}
          >
            {t("profileNote")}
          </p>
        </aside>
      </div>
    </article>
  );
}

// ---------- helpers ----------

function SectionLabel({ id, label }: { id?: string; label: string }) {
  return (
    <div className="flex items-center gap-3" id={id}>
      <div
        className="h-px w-8"
        style={{ background: "var(--hell-red)" }}
        aria-hidden
      />
      <span
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {label}
      </span>
    </div>
  );
}

function EmptyCard({
  message,
  ctaHref,
  ctaLabel,
}: {
  message: string;
  ctaHref: "/store" | "/events" | "/giveaways";
  ctaLabel: string;
}) {
  return (
    <div
      className="notch mt-5 flex flex-col items-start gap-4 px-6 py-8"
      style={{ background: "var(--ash-1)" }}
    >
      <p
        className="max-w-md font-display text-xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {message}
      </p>
      <Link
        href={ctaHref}
        className="font-mono text-[11px] tracking-[0.25em] uppercase interactive"
        style={{
          background: "var(--hell-red)",
          color: "var(--bone)",
          padding: "10px 18px",
        }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function OrderStatusPill({
  status,
  label,
}: {
  status: Order["status"];
  label: string;
}) {
  const styleMap: Record<
    Order["status"],
    { background: string; color: string; border?: string }
  > = {
    pending: {
      background: "var(--ash-3)",
      color: "var(--ember)",
      border: "1px solid rgba(255,69,0,0.4)",
    },
    confirmed: {
      background: "var(--hell-red)",
      color: "var(--bone)",
    },
    shipped: {
      background: "var(--ember)",
      color: "var(--black)",
    },
    delivered: {
      background: "var(--ash-3)",
      color: "var(--bone)",
      border: "1px solid rgba(245,240,232,0.4)",
    },
    cancelled: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
    returned: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
  };
  const s = styleMap[status];
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
      style={s}
    >
      {label}
    </span>
  );
}

function SignupStatusPill({
  status,
  label,
}: {
  status: EventSignup["status"];
  label: string;
}) {
  const styleMap: Record<
    EventSignup["status"],
    { background: string; color: string; border?: string }
  > = {
    registered: {
      background: "var(--hell-red)",
      color: "var(--bone)",
    },
    checked_in: {
      background: "var(--ember)",
      color: "var(--black)",
    },
    disqualified: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
    withdrawn: {
      background: "var(--ash-3)",
      color: "rgba(245,240,232,0.4)",
      border: "1px solid rgba(245,240,232,0.15)",
    },
  };
  const s = styleMap[status];
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
      style={s}
    >
      {label}
    </span>
  );
}

function GiveawayStatusPill({
  won,
  ended,
  labelWon,
  labelPending,
  labelEnded,
}: {
  won: boolean;
  ended: boolean;
  labelWon: string;
  labelPending: string;
  labelEnded: string;
}) {
  if (won) {
    return (
      <span
        className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
        style={{ background: "var(--ember)", color: "var(--black)" }}
      >
        {labelWon}
      </span>
    );
  }
  if (ended) {
    return (
      <span
        className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
        style={{
          background: "var(--ash-3)",
          color: "rgba(245,240,232,0.4)",
          border: "1px solid rgba(245,240,232,0.15)",
        }}
      >
        {labelEnded}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase whitespace-nowrap"
      style={{
        background: "var(--ash-3)",
        color: "var(--ember)",
        border: "1px solid rgba(255,69,0,0.4)",
      }}
    >
      {labelPending}
    </span>
  );
}

