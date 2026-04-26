import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getPlayer } from "@/lib/admin/data/players";
import { PlayerForm } from "../../player-form";
import { DeletePlayerButton } from "../../delete-player-button";
import type { PlayerInput } from "../../actions";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const player = await getPlayer(id);
  if (!player) notFound();

  const bio = (player.bio ?? {}) as { en?: string; ar?: string };
  const stats = (player.stats ?? {}) as PlayerInput["stats"];
  const socials = (player.socials ?? {}) as PlayerInput["socials"];

  const initial: PlayerInput = {
    ign: player.ign,
    real_name: player.real_name,
    role: player.role,
    country_code: player.country_code,
    photo_url: player.photo_url,
    bio: { en: bio.en ?? "", ar: bio.ar ?? "" },
    signature_loadout: player.signature_loadout,
    stats,
    socials,
    display_order: player.display_order,
    is_active: player.is_active,
    joined_at: player.joined_at,
    left_at: player.left_at,
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// ROSTER / ${player.ign.toUpperCase()}`}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Edit {player.ign}
          </h1>
        </div>
        <DeletePlayerButton id={player.id} ign={player.ign} locale={locale} />
      </div>

      <PlayerForm mode="edit" id={player.id} locale={locale} initial={initial} />
    </div>
  );
}
