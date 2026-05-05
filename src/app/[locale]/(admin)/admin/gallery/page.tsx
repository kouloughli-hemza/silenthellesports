import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale, Link } from "@/lib/i18n/routing";
import { listGalleryImagesAdmin } from "@/lib/admin/data/gallery";
import { pickTranslation, type Locale } from "@/types/domain";

export default async function AdminGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const images = await listGalleryImagesAdmin();
  const localeKey = locale as Locale;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--hell-red)" }}
          >
            {"// HERO GALLERY"}
          </div>
          <h1
            className="font-display mt-1 text-3xl font-black uppercase italic"
            style={{ color: "var(--bone)" }}
          >
            Gallery{" "}
            <span style={{ color: "rgba(245,240,232,0.4)" }}>({images.length})</span>
          </h1>
          <p
            className="mt-2 max-w-xl font-mono text-xs"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            Photos cycle in the hero&apos;s rotating frame on the home page. Lower
            display-order shows first; inactive entries are hidden from the
            public site.
          </p>
        </div>
        <Link
          href={"/admin/gallery/new" as never}
          className="btn-hell"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          + ADD PHOTO
        </Link>
      </div>

      {images.length === 0 ? (
        <div className="notch p-8 text-center" style={{ background: "var(--ash-1)" }}>
          <p className="font-mono text-xs" style={{ color: "rgba(245,240,232,0.6)" }}>
            No photos yet — the hero is showing fallback placeholders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => {
            const caption = pickTranslation(img.caption, localeKey);
            const meta = pickTranslation(img.meta, localeKey);
            return (
              <Link
                key={img.id}
                href={`/admin/gallery/${img.id}/edit` as never}
                className="card-bite notch interactive group block overflow-hidden"
                style={{ background: "var(--ash-1)" }}
              >
                <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "var(--ash-3)" }}>
                  {img.image_url ? (
                    <Image
                      src={img.image_url}
                      alt={caption || ""}
                      fill
                      sizes="(max-width: 768px) 50vw, 240px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.85) 100%)",
                    }}
                  />
                  <div
                    className="absolute top-2 left-2 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{
                      background: "rgba(10,10,10,0.7)",
                      color: img.is_active ? "var(--signal-green)" : "rgba(245,240,232,0.6)",
                    }}
                  >
                    {img.is_active ? "ACTIVE" : "OFF"}
                  </div>
                  <div
                    className="absolute top-2 right-2 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ background: "rgba(10,10,10,0.7)", color: "var(--bone)" }}
                  >
                    #{img.display_order}
                  </div>
                  <div className="absolute right-3 bottom-2 left-3">
                    <div
                      className="truncate font-mono text-[10px] tracking-[0.25em] uppercase"
                      style={{ color: "var(--hell-red)" }}
                    >
                      {meta || "—"}
                    </div>
                    <div className="font-display truncate text-base leading-tight font-black uppercase italic">
                      {caption || "—"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
