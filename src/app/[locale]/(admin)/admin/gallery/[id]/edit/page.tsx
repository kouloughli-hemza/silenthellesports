import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n/routing";
import { getGalleryImageAdmin } from "@/lib/admin/data/gallery";
import { GalleryForm } from "../../gallery-form";
import type { GalleryImageInput } from "../../actions";

export default async function EditGalleryImagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const img = await getGalleryImageAdmin(id);
  if (!img) notFound();

  const caption = (img.caption ?? {}) as { en?: string; ar?: string };
  const meta = (img.meta ?? {}) as { en?: string; ar?: string };

  const initial: GalleryImageInput = {
    image_url: img.image_url,
    caption: { en: caption.en ?? "", ar: caption.ar ?? "" },
    meta: { en: meta.en ?? "", ar: meta.ar ?? "" },
    hud_heading: img.hud_heading,
    hud_zone: img.hud_zone,
    hud_signal: img.hud_signal,
    display_order: img.display_order,
    is_active: img.is_active,
  };

  return (
    <div>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// HERO GALLERY / ${(caption.en || "PHOTO").toUpperCase()}`}
      </div>
      <h1
        className="font-display mt-1 text-3xl font-black uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        Edit gallery photo
      </h1>
      <GalleryForm mode="edit" id={img.id} locale={locale} initial={initial} />
    </div>
  );
}
