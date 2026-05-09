import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getGiveawayByIdAdmin, listEntriesForGiveaway } from "@/lib/admin/data/giveaways";
import { GiveawayForm } from "../../giveaway-form";
import { DrawWinnerButton } from "../../draw-winner-button";
import type { GiveawayInput } from "../../actions";
import { formatDateLong } from "@/lib/utils/format";
import type { Locale } from "@/types/domain";

type SlotKey = "follow_tiktok" | "join_discord" | "subscribe_youtube" | "share";

function emptySlots(): GiveawayInput["entry_methods"] {
  return {
    follow_tiktok: { enabled: false, url: "" },
    join_discord: { enabled: false, url: "" },
    subscribe_youtube: { enabled: false, url: "" },
    share: { enabled: false, url: "" },
  };
}

// The DB column is jsonb. Old rows used { follow_required, discord_required,
// share_bonus } booleans (no URLs ever stored — that broke entry). New rows
// store the array form parseEntryMethods expects. Read whichever shape we
// find and project to the form's 4-slot model.
function readEntryMethodsFromDb(value: unknown): GiveawayInput["entry_methods"] {
  const slots = emptySlots();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const type = o.type;
      if (
        type === "follow_tiktok" ||
        type === "join_discord" ||
        type === "subscribe_youtube" ||
        type === "share"
      ) {
        slots[type as SlotKey] = {
          enabled: true,
          url: typeof o.url === "string" ? o.url : "",
        };
      }
    }
  }
  // Old boolean shape can't be migrated automatically (no URLs ever stored);
  // admin will see empty slots and re-fill them once.
  return slots;
}

export default async function EditGiveawayPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const giveaway = await getGiveawayByIdAdmin(id);
  if (!giveaway) notFound();

  const entries = await listEntriesForGiveaway(id);
  const title = (giveaway.title ?? {}) as { en?: string; ar?: string };
  const description = (giveaway.description ?? {}) as { en?: string; ar?: string };
  const prize = (giveaway.prize_description ?? {}) as { en?: string; ar?: string };
  const initial: GiveawayInput = {
    slug: giveaway.slug,
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    prize_description: { en: prize.en ?? "", ar: prize.ar ?? "" },
    prize_image_url: giveaway.prize_image_url,
    estimated_value: giveaway.estimated_value,
    entry_methods: readEntryMethodsFromDb(giveaway.entry_methods),
    starts_at: giveaway.starts_at,
    ends_at: giveaway.ends_at,
    status: giveaway.status,
    drop_number: giveaway.drop_number,
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// GIVEAWAYS / ${giveaway.slug.toUpperCase()}`}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Edit {title.en || giveaway.slug}
          </h1>
        </div>
      </div>

      <GiveawayForm mode="edit" id={giveaway.id} locale={locale} initial={initial} />

      {giveaway.status === "completed" ? (
        <section
          className="notch mt-8 p-5"
          style={{
            background: "var(--ash-1)",
            border: "1px solid rgba(124,255,161,0.35)",
          }}
        >
          <div
            className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--signal-green)" }}
          >
            // WINNER · DROP COMPLETED
          </div>
          {giveaway.winner_email ? (
            <div className="space-y-1.5">
              <div
                className="font-display text-2xl leading-tight font-black uppercase italic"
                style={{ color: "var(--bone)" }}
              >
                {giveaway.winner_email}
              </div>
              {giveaway.winner_user_id ? (
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,240,232,0.55)" }}
                >
                  USER ID · {giveaway.winner_user_id}
                </div>
              ) : null}
              {giveaway.winner_entry_id ? (
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,240,232,0.55)" }}
                >
                  ENTRY ID · {giveaway.winner_entry_id}
                </div>
              ) : null}
            </div>
          ) : (
            <p
              className="font-mono text-xs"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              This drop was completed before winner-email persistence shipped.
              The pick is in the audit log.
            </p>
          )}
        </section>
      ) : null}

      <section className="notch mt-8 p-5" style={{ background: "var(--ash-1)" }}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {`// ENTRIES (${entries.length})`}
          </div>
          {giveaway.status !== "completed" ? <DrawWinnerButton id={giveaway.id} /> : null}
        </div>
        {entries.length === 0 ? (
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No entries yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(245,240,232,0.1)" }}>
                  <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(245,240,232,0.55)" }}>
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(245,240,232,0.55)" }}>
                    User
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(245,240,232,0.55)" }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 200).map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                    <td className="px-3 py-2 font-mono text-xs">{e.email}</td>
                    <td className="px-3 py-2 font-mono text-[10px]" style={{ color: "rgba(245,240,232,0.5)" }}>
                      {e.user_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {formatDateLong(e.created_at, locale as Locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 200 ? (
              <p className="mt-3 font-mono text-[10px]" style={{ color: "rgba(245,240,232,0.5)" }}>
                Showing 200 of {entries.length} entries.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
