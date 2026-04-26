import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { EventForm } from "../event-form";
import type { EventInput } from "../actions";

const now = new Date();
const inAWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
const inSixDays = new Date(now.getTime() + 6 * 24 * 3600 * 1000);

const EMPTY: EventInput = {
  slug: "",
  title: { en: "", ar: "" },
  description: { en: "", ar: "" },
  mode: "Squad",
  map: null,
  prize_pool: 0,
  prize_currency: "DZD",
  entry_fee: 0,
  capacity: 100,
  start_at: inAWeek.toISOString(),
  registration_closes_at: inSixDays.toISOString(),
  status: "upcoming",
  cover_image_url: null,
  rules: [],
  tag: null,
};

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// EVENTS / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Event
      </h1>
      <EventForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
