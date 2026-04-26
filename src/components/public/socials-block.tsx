import { getTranslations } from "next-intl/server";
import { PlaceholderImage, SectionHeading } from "@/components/brand";
import { getSiteConfig } from "@/lib/site-config";
import type { Locale } from "@/types/domain";

interface SocialsBlockProps {
  locale: Locale;
}

function stripAt(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

export async function SocialsBlock({ locale }: SocialsBlockProps) {
  const t = await getTranslations({ locale, namespace: "socials" });
  const isAr = locale === "ar";

  const twitchHandle = await getSiteConfig("socials.twitch_channel");
  const youtubeHandle = await getSiteConfig("socials.youtube_channel");
  const xHandle = await getSiteConfig("socials.x_handle");

  const twitchUrl = `https://twitch.tv/${stripAt(twitchHandle)}`;
  const youtubeUrl = `https://youtube.com/${youtubeHandle.startsWith("@") ? youtubeHandle : `@${youtubeHandle}`}`;
  const xUrl = `https://x.com/${stripAt(xHandle)}`;

  const arrow = isAr ? "←" : "→";

  return (
    <section className="py-20 md:py-28" style={{ background: "var(--black)" }}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <SectionHeading
          label={t("label")}
          title={
            <>
              {t("t1")}
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          {/* Twitch */}
          <a
            href={twitchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-bite notch overflow-hidden p-0"
            style={{ background: "var(--ash-1)", display: "block" }}
            aria-label={`Twitch · ${stripAt(twitchHandle)}`}
          >
            <div className="relative">
              <PlaceholderImage
                label={t("twitchPlaceholder")}
                aspect="16/10"
                redLight
              />
              <div
                className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1"
                style={{ background: "var(--hell-red)" }}
              >
                <span className="live-dot" style={{ background: "var(--bone)" }} />
                <span className="font-mono text-[10px] font-bold tracking-[0.2em]">
                  {t("liveNow")}
                </span>
              </div>
              <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
                <div>
                  <div className="font-display text-xl font-black uppercase italic">
                    {stripAt(twitchHandle).toUpperCase()}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
                    {t("twitchMeta")}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                {`// twitch.tv/${stripAt(twitchHandle)}`}
              </span>
              <span style={{ color: "var(--hell-red)" }}>{arrow}</span>
            </div>
          </a>

          {/* YouTube */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-bite notch overflow-hidden p-0"
            style={{ background: "var(--ash-1)", display: "block" }}
            aria-label={`YouTube · ${youtubeHandle}`}
          >
            <div className="relative">
              <PlaceholderImage label={t("youtubePlaceholder")} aspect="16/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-14 w-14 items-center justify-center"
                  style={{
                    background: "rgba(230,0,19,0.95)",
                    clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                  }}
                  aria-hidden
                />
              </div>
              <div
                className="absolute right-3 bottom-3 px-2 py-0.5 font-mono text-xs"
                style={{ background: "rgba(10,10,10,0.85)" }}
              >
                12:47
              </div>
            </div>
            <div className="p-4">
              <div className="font-display glitch-target text-base leading-tight font-black uppercase italic">
                {t("youtubeTitle")}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "rgba(245,240,232,0.5)" }}
                >
                  {t("youtubeMeta")}
                </span>
                <span style={{ color: "var(--hell-red)" }}>{arrow}</span>
              </div>
            </div>
          </a>

          {/* X */}
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-bite notch overflow-hidden p-0"
            style={{ background: "var(--ash-1)", display: "block" }}
            aria-label={`X · @${stripAt(xHandle)}`}
          >
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center"
                  style={{ background: "var(--black)" }}
                  aria-hidden
                >
                  <span
                    className="font-display text-sm font-black italic"
                    style={{ color: "var(--hell-red)" }}
                  >
                    SH
                  </span>
                </div>
                <div>
                  <div className="font-display text-sm font-bold uppercase italic">
                    {`@${stripAt(xHandle)}`}
                  </div>
                  <div
                    className="font-mono text-[10px] tracking-[0.2em]"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {t("xMeta")}
                  </div>
                </div>
              </div>
              <div
                className="mb-4 text-sm leading-relaxed"
                style={{ color: "var(--bone)" }}
              >
                {t("xPost")}
              </div>
              <div
                className="mb-4 grid grid-cols-3 gap-px"
                style={{ background: "rgba(230,0,19,0.2)" }}
              >
                <PlaceholderImage label="IMG 1" aspect="1/1" />
                <PlaceholderImage label="IMG 2" aspect="1/1" />
                <PlaceholderImage label="IMG 3" aspect="1/1" />
              </div>
              <div
                className="flex justify-between font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                <span aria-label="reposts">{`RT ${t("xRetweets")}`}</span>
                <span aria-label="likes">{`♥ ${t("xLikes")}`}</span>
                <span style={{ color: "var(--hell-red)" }}>
                  {t("view")} {arrow}
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
