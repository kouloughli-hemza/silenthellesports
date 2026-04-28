import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getTacticBoard } from "@/lib/admin/data/team";
import { TacticForm } from "../../tactic-form";
import type { TacticBoardInput } from "../../actions";

export default async function EditTacticPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const b = await getTacticBoard(id);
  if (!b) notFound();

  const title = (b.title ?? {}) as { en?: string; ar?: string };
  const description = (b.description ?? {}) as { en?: string; ar?: string };
  const rotationRaw = b.rotation_points;
  const rotation_points = Array.isArray(rotationRaw)
    ? (rotationRaw as Array<{ x?: unknown; y?: unknown }>)
        .map((p) => ({
          x: typeof p?.x === "number" ? p.x : 0,
          y: typeof p?.y === "number" ? p.y : 0,
        }))
        .filter((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)
    : [];

  const initial: TacticBoardInput = {
    title: { en: title.en ?? "", ar: title.ar ?? "" },
    description: { en: description.en ?? "", ar: description.ar ?? "" },
    map_name: b.map_name,
    map_image_url: b.map_image_url ?? null,
    drop_x: Number(b.drop_x),
    drop_y: Number(b.drop_y),
    rotation_points,
    display_order: b.display_order,
    is_published: b.is_published,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// TACTICS / ${b.map_name.toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit tactic board
      </h1>
      <TacticForm mode="edit" id={b.id} locale={locale} initial={initial} />
    </div>
  );
}
