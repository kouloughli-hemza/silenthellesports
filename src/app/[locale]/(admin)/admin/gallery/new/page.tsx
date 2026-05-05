import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { GalleryForm } from "../gallery-form";
import type { GalleryImageInput } from "../actions";

const EMPTY: GalleryImageInput = {
  image_url: "",
  caption: { en: "", ar: "" },
  meta: { en: "", ar: "" },
  hud_heading: null,
  hud_zone: null,
  hud_signal: null,
  display_order: 0,
  is_active: true,
};

export default async function NewGalleryImagePage({
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
        {"// HERO GALLERY / NEW"}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Add gallery photo
      </h1>
      <GalleryForm mode="create" locale={locale} initial={EMPTY} />
    </div>
  );
}
