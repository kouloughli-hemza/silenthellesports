import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EmberField, PlaceholderImage } from "@/components/brand";
import { GiveawayBurst } from "@/components/scenes/GiveawayBurst";
import { GiveawayCountdown } from "@/components/public/giveaway-countdown";
import { GiveawayEntryForm } from "@/components/public/giveaway-entry-form";
import { getActiveGiveaway, getGiveawayEntryCount } from "@/lib/data/giveaways";
import { parseEntryMethods } from "@/lib/utils/giveaway";
import { pickTranslation, type Locale } from "@/types/domain";

interface GiveawayHeroProps {
  locale: Locale;
}

interface RuleItem {
  t: string;
  s: string;
}

// Session-agnostic by design so the home page stays fully cacheable.
// The entry form starts blank for everyone; if the user has already entered,
// the server action surfaces it on submit. Power users lose pre-filled email,
// but every visitor lands on a CDN-cached page. Worth the trade.
export async function GiveawayHero({ locale }: GiveawayHeroProps) {
  const giveaway = await getActiveGiveaway();
  if (!giveaway) return null;

  const t = await getTranslations({ locale, namespace: "giveaway" });

  const entries = await getGiveawayEntryCount(giveaway.id);
  const entryMethods = parseEntryMethods(giveaway.entry_methods);
  const titleText = pickTranslation(giveaway.title, locale);
  const prizeText = pickTranslation(giveaway.prize_description, locale);
  const dropNumber = giveaway.drop_number ?? 1;
  const value = giveaway.estimated_value ?? "";

  // Pull rules array from translations. next-intl can't return array directly via t(),
  // so we use t.raw via the namespace below.
  const rulesT = await getTranslations({ locale, namespace: "giveaway" });
  const rawRules = rulesT.raw("rules");
  const rules: RuleItem[] = Array.isArray(rawRules)
    ? rawRules.flatMap((r: unknown): RuleItem[] => {
        if (!r || typeof r !== "object" || Array.isArray(r)) return [];
        const obj = r as Record<string, unknown>;
        if (typeof obj.t === "string" && typeof obj.s === "string") {
          return [{ t: obj.t, s: obj.s }];
        }
        return [];
      })
    : [];

  // Title may be 1-2 lines: split on first space for visual stacking, or fall back.
  const [titleA, titleB] = (() => {
    const parts = titleText.split(/\s+/);
    if (parts.length <= 1) return [titleText, ""];
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  })();

  return (
    <section
      id="giveaways"
      className="grain relative overflow-hidden"
      style={{ background: "var(--black)" }}
    >
      <EmberField count={50} opacity={0.6} />
      <GiveawayBurst />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 80% 50%, rgba(230,0,19,0.35), transparent 70%), linear-gradient(180deg, var(--black) 0%, transparent 30%, transparent 70%, var(--black) 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32">
        <div className="mb-16 grid items-end gap-8 lg:grid-cols-[auto_1fr_auto]">
          <div>
            <span className="section-label">
              {t("label", { drop: dropNumber })}
            </span>
            <h2 className="font-display mt-5 text-6xl leading-[0.85] font-black uppercase md:text-8xl">
              {t("t1")}
              <br />
              <span style={{ color: "var(--hell-red)" }}>{t("t2")}</span>
            </h2>
          </div>
          <div className="hidden lg:block" />
          <div className="hidden text-right lg:block">
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(245,240,232,0.5)" }}
            >
              {t("total")}
            </div>
            <div className="font-display mt-1 text-5xl font-black italic">
              <span className="stat-number">{entries.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <GiveawayCountdown
            endsAt={giveaway.ends_at}
            daysLabel={t("days")}
            hoursLabel={t("hours")}
            minutesLabel={t("minutes")}
            secondsLabel={t("seconds")}
          />

          <div
            className="grid lg:grid-cols-[1.1fr_1fr]"
            style={{
              background: "var(--ash-1)",
              border: "1px solid rgba(230,0,19,0.25)",
            }}
          >
            {/* prize visual */}
            <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
              {giveaway.prize_image_url ? (
                <Image
                  src={giveaway.prize_image_url}
                  alt={prizeText || titleText || "Prize"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <PlaceholderImage
                  label={prizeText || titleText || "PRIZE"}
                  aspect="auto"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(230,0,19,0.2) 100%)",
                }}
                aria-hidden
              />
              <div className="absolute top-5 left-5 flex flex-col gap-2">
                <span
                  className="px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ background: "var(--hell-red)" }}
                >
                  {t("tier")}
                </span>
                {value ? (
                  <span
                    className="px-3 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{ background: "rgba(10,10,10,0.85)", color: "var(--ember)" }}
                  >
                    {t("value", { value })}
                  </span>
                ) : null}
              </div>
              <div className="absolute right-6 bottom-6 left-6">
                <div className="font-display text-3xl leading-[0.9] font-black uppercase italic md:text-5xl">
                  {titleA}
                  {titleB ? (
                    <>
                      <br />
                      <span style={{ color: "var(--hell-red)" }}>{titleB}</span>
                    </>
                  ) : null}
                </div>
                <div
                  className="mt-3 font-mono text-xs tracking-wider"
                  style={{ color: "rgba(245,240,232,0.7)" }}
                >
                  {t("pull")}
                </div>
              </div>
            </div>

            {/* tasks */}
            <div className="flex flex-col p-7 md:p-10">
              <GiveawayEntryForm
                giveawayId={giveaway.id}
                methods={entryMethods}
                locale={locale}
                initialPool={entries}
                // Home is intentionally session-agnostic to stay CDN-cached;
                // visitors land on the sign-in CTA and continue to /giveaways
                // (or the slug page) where the full form is rendered with
                // their real session.
                signedIn={false}
                signInNext={`/${locale}/giveaways/${giveaway.slug}`}
                defaultEmail={null}
                defaultDiscordTag={null}
                initialCompleted={[]}
                initialEntryCount={0}
                i18n={{
                  live: t("live"),
                  yours: t("yours"),
                  pool: t("pool"),
                  lockEntry: t("lockEntry"),
                  lockSubmitting: t("lockSubmitting"),
                  lockedSuccess: t("lockedSuccess"),
                  emailLabel: t("emailLabel"),
                  emailPlaceholder: t("emailPlaceholder"),
                  emailRequired: t("emailRequired"),
                  discordOptional: t("discordOptional"),
                  discordPlaceholder: t("discordPlaceholder"),
                  alreadyEntered: t("alreadyEntered"),
                  error: t("error"),
                  openLink: t("openLink"),
                  markComplete: t("markComplete"),
                  markedComplete: t("markedComplete"),
                  noEntryMethods: t("noEntryMethods"),
                  h1: t("h1"),
                  h2: t("h2"),
                  h3: t("h3"),
                  entry: t("entry"),
                  entries: t("entries"),
                  signInTitle: t("signInTitle"),
                  signInSub: t("signInSub"),
                  signInCta: t("signInCta"),
                }}
              />
            </div>
          </div>

          {rules.length > 0 ? (
            <div
              className="mt-px grid grid-cols-2 gap-px md:grid-cols-4"
              style={{ background: "rgba(230,0,19,0.25)" }}
            >
              {rules.map((r, i) => (
                <div
                  key={i}
                  className="p-4 md:p-5"
                  style={{ background: "var(--ash-3)" }}
                >
                  <div
                    className="font-mono text-[10px] tracking-[0.25em] uppercase"
                    style={{ color: "var(--hell-red)" }}
                  >
                    {`// 0${i + 1}`}
                  </div>
                  <div className="font-display mt-1.5 text-sm font-bold uppercase italic md:text-base">
                    {r.t}
                  </div>
                  <div
                    className="mt-1 font-mono text-[10px] tracking-wider"
                    style={{ color: "rgba(245,240,232,0.5)" }}
                  >
                    {r.s}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
