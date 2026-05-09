import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, isLocale } from "@/lib/i18n/routing";
import { LoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("login.title")} · Silent Hell` };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next: rawNext, error: oauthError } = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });

  // Same-origin path only — never accept absolute URLs as `next`.
  const safeNext =
    typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : undefined;

  return (
    <div className="notch w-full max-w-md p-8" style={{ background: "var(--ash-1)" }}>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// ${t("login.eyebrow")}`}
      </div>
      <h1
        className="font-display mt-3 text-4xl font-black tracking-tight uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {t("login.title")}
      </h1>
      <p
        className="mt-2 font-mono text-xs"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {t("login.sub")}
      </p>

      {oauthError ? (
        <div className="field-error mt-3" role="alert">
          {t("login.oauthError")}
        </div>
      ) : null}

      <LoginForm
        locale={locale}
        next={safeNext}
        labels={{
          email: t("fields.email"),
          password: t("fields.password"),
          submit: t("login.submit"),
          submitting: t("login.submitting"),
          google: t("login.google"),
          googleStarting: t("login.googleStarting"),
          or: t("login.or"),
        }}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] tracking-[0.15em] uppercase">
        <Link href="/reset" className="interactive" style={{ color: "rgba(245,240,232,0.6)" }}>
          {t("login.forgot")}
        </Link>
        <Link
          href={
            (safeNext
              ? `/signup?next=${encodeURIComponent(safeNext)}`
              : "/signup") as never
          }
          className="interactive"
          style={{ color: "var(--hell-red)" }}
        >
          {t("login.toSignup")}
        </Link>
      </div>
    </div>
  );
}
