import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { TacticForm } from "../tactic-form";
import type { TacticBoardInput } from "../actions";

const EMPTY: TacticBoardInput = {
  title: { en: "", ar: "" },
  description: { en: "", ar: "" },
  map_name: "Erangel",
  map_image_url: null,
  drop_x: 50,
  drop_y: 50,
  rotation_points: [],
  display_order: 0,
  is_published: true,
};

export default async function NewTacticPage({
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
        {"// TACTICS / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        New tactic board
      </h1>
      <TacticForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
