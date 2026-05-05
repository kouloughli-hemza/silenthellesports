import Image from "next/image";
import { pickTranslation, type Locale, type Translated } from "@/types/domain";

// Static gallery items used while the admin uploader is still pending. Once
// /admin/gallery exists, swap this for a server query and keep the rendering.
interface GalleryItem {
  src: string;
  caption: Translated;
}

const ITEMS: GalleryItem[] = [
  {
    src: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=900&q=80",
    caption: {
      en: "PMGC FINAL · ALGIERS",
      ar: "نهائي PMGC · الجزائر",
    },
  },
  {
    src: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    caption: {
      en: "MAIN STAGE · DAY 03",
      ar: "المسرح الرئيسي · اليوم ٣",
    },
  },
  {
    src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    caption: {
      en: "OPS ROOM · LIVE FEED",
      ar: "غرفة العمليات · بث مباشر",
    },
  },
  {
    src: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80",
    caption: {
      en: "CHICKEN DINNER · GAME 6",
      ar: "العشاء الذهبي · المباراة ٦",
    },
  },
];

interface HeroGalleryProps {
  locale: Locale;
}

export function HeroGallery({ locale }: HeroGalleryProps) {
  return (
    <div
      className="grid grid-cols-2 gap-px"
      style={{ background: "rgba(230,0,19,0.25)" }}
    >
      {ITEMS.map((item, i) => {
        const cap = pickTranslation(item.caption, locale);
        const idx = `// ${String(i + 1).padStart(2, "0")}`;
        return (
          <div
            key={i}
            className="hero-gallery-tile group relative aspect-[4/5] overflow-hidden"
            style={{ background: "var(--ash-3)" }}
          >
            <Image
              src={item.src}
              alt={cap}
              fill
              sizes="(max-width: 768px) 50vw, 220px"
              className="hero-gallery-img"
            />
            {/* dark scrim so text stays legible regardless of photo */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, transparent 35%, transparent 55%, rgba(10,10,10,0.85) 100%)",
              }}
            />

            {/* index pill */}
            <div
              className="absolute top-3 left-3 px-2 py-1 font-mono text-[9px] tracking-[0.25em] uppercase"
              style={{
                background: "rgba(10,10,10,0.65)",
                color: "var(--hell-red)",
                backdropFilter: "blur(4px)",
              }}
            >
              {idx}
            </div>

            {/* red corner brackets — same as PlayerPortrait, ties into brand */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2"
              style={{ borderColor: "var(--hell-red)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2"
              style={{ borderColor: "var(--hell-red)" }}
            />

            {/* caption */}
            <div className="absolute right-3 bottom-3 left-3">
              <div
                className="font-display text-sm leading-tight font-black uppercase italic md:text-base"
                style={{ color: "var(--bone)" }}
              >
                {cap}
              </div>
            </div>

            {/* hover overlay: slight red wash so the tile reacts to focus */}
            <div
              aria-hidden
              className="hero-gallery-wash pointer-events-none absolute inset-0"
            />
          </div>
        );
      })}
    </div>
  );
}
