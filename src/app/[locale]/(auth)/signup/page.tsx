import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, isLocale } from "@/lib/i18n/routing";
import { SignupForm } from "./signup-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("signup.title")} · Silent Hell` };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="notch w-full max-w-md p-8" style={{ background: "var(--ash-1)" }}>
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--hell-red)" }}
      >
        {`// ${t("signup.eyebrow")}`}
      </div>
      <h1
        className="font-display mt-3 text-4xl font-black tracking-tight uppercase italic"
        style={{ color: "var(--bone)" }}
      >
        {t("signup.title")}
      </h1>
      <p
        className="mt-2 font-mono text-xs"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        {t("signup.sub")}
      </p>

      <SignupForm
        labels={{
          name: t("fields.fullName"),
          email: t("fields.email"),
          password: t("fields.password"),
          submit: t("signup.submit"),
          submitting: t("signup.submitting"),
        }}
      />

      <div className="mt-6 font-mono text-[11px] tracking-[0.15em] uppercase">
        <Link href="/login" className="interactive" style={{ color: "var(--hell-red)" }}>
          {t("signup.toLogin")}
        </Link>
      </div>
    </div>
  );
}
