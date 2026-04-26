import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { PlayerForm } from "../player-form";
import type { PlayerInput } from "../actions";

const EMPTY: PlayerInput = {
  ign: "",
  real_name: null,
  role: "Fragger",
  country_code: "DZ",
  photo_url: null,
  bio: { en: "", ar: "" },
  signature_loadout: null,
  stats: {},
  socials: {},
  display_order: 0,
  is_active: true,
  joined_at: null,
  left_at: null,
};

export default async function NewPlayerPage({
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
        {"// ROSTER / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New Player
      </h1>
      <PlayerForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
