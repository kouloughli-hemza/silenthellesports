import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { GiveawayForm } from "../giveaway-form";
import type { GiveawayInput } from "../actions";

const now = new Date();
const inAWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

const EMPTY: GiveawayInput = {
  slug: "",
  title: { en: "", ar: "" },
  description: { en: "", ar: "" },
  prize_description: { en: "", ar: "" },
  prize_image_url: null,
  estimated_value: null,
  entry_methods: { follow_required: true, discord_required: false, share_bonus: false },
  starts_at: now.toISOString(),
  ends_at: inAWeek.toISOString(),
  status: "upcoming",
  drop_number: null,
};

export default async function NewGiveawayPage({
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
        {"// GIVEAWAYS / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Giveaway
      </h1>
      <GiveawayForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
