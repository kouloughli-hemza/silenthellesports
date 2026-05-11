import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { lookupUcRequestAction } from "@/lib/uc/actions";

export const dynamic = "force-dynamic";

interface SP {
  error?: string;
}

export default async function LookupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const isAr = locale === "ar";
  const localePrefix = locale === "ar" ? "/ar" : "/en";

  return (
    <article
      className="grain mx-auto max-w-[640px] px-6 pt-28 pb-24 md:px-10 md:pt-36"
      style={{ background: "var(--black)" }}
    >
      <Link
        href={"/uc-recharge" as never}
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        ← {isAr ? "العودة" : "Back"}
      </Link>

      <h1
        className="font-display mt-4 text-3xl font-black uppercase italic md:text-4xl"
        style={{ color: "var(--bone)" }}
      >
        {isAr ? "تتبع طلب UC" : "Track a UC request"}
      </h1>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {isAr
          ? "أدخل رقم الطلب (UC-2026-0001) أو رمز التحويل."
          : "Enter your request number (UC-2026-0001) or the transfer reference code."}
      </p>

      <form
        action={async (formData) => {
          "use server";
          const result = await lookupUcRequestAction(formData);
          if (!result.success) {
            redirect(
              `${localePrefix}/uc-recharge/lookup?error=${encodeURIComponent(result.error)}`,
            );
          }
          redirect(`${localePrefix}/uc-recharge/${result.data.request_number}`);
        }}
        className="mt-6 space-y-3"
      >
        <input
          name="query"
          required
          placeholder={isAr ? "UC-2026-0001 أو رمز التحويل" : "UC-2026-0001 or transfer code"}
          className="field"
        />
        <button type="submit" className="btn-hell w-full justify-center">
          {isAr ? "تابع الطلب" : "TRACK REQUEST"}
        </button>
      </form>

      {sp.error ? (
        <p
          role="alert"
          className="mt-4 font-mono text-[11px] tracking-[0.15em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {sp.error}
        </p>
      ) : null}
    </article>
  );
}
