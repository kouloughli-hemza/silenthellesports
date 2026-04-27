import { useTranslations } from "next-intl";
import { SkullIcon } from "@/components/brand";
import { KnockedDownStamp } from "@/components/scenes/KnockedDownStamp";
import { Link } from "@/lib/i18n/routing";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div
      className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: "var(--black)" }}
    >
      <KnockedDownStamp label={t("knockedDown")} />
      <SkullIcon size={56} title="Silent Hell" />
      <p
        className="mt-6 font-mono text-[11px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {"// 404 · NO SIGNAL"}
      </p>
      <h1
        className="font-display mt-3 text-5xl font-black tracking-tight uppercase md:text-7xl"
        style={{ color: "var(--bone)" }}
      >
        {t("title")}
      </h1>
      <p
        className="mt-4 max-w-md text-sm md:text-base"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {t("subtitle")}
      </p>
      <div className="mt-10">
        <Link href="/" className="btn-hell">
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
