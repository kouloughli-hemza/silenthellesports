import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveUcPackages } from "@/lib/uc/data";
import { UcRechargeForm } from "./uc-recharge-form";

export const dynamic = "force-dynamic";

export default async function UcRechargePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const session = await getSessionUser();
  const packages = await getActiveUcPackages();

  const formI18n = isAr
    ? {
        pickPackage: "اختر باقة UC",
        bonusBadge: "مجاناً",
        pubgIdLabel: "معرّف PUBG",
        pubgIdHelp: "أرقام فقط — موجود في إعدادات اللعبة → الملف الشخصي.",
        ignLabel: "اللقب داخل اللعبة (IGN)",
        paymentMethodLabel: "طريقة الدفع",
        baridimob: "BaridiMob",
        ccp: "CCP / بريد",
        paymentInstructions:
          "أرسل المبلغ المحدد إلى حسابنا (انظر التعليمات أدناه)، ثم أرفق صورة إثبات الدفع.",
        transferCodeLabel: "رمز التحويل",
        transferCodeHelp: "اختياري — لكنه يساعدنا على إيجاد دفعتك بسرعة.",
        whatsappLabel: "رقم واتساب",
        whatsappHelp: "نتواصل معك على واتساب لتأكيد الطلب.",
        emailLabel: "البريد الإلكتروني",
        emailHelp: "اختياري.",
        proofLabel: "إثبات الدفع",
        proofHelp: "صورة (PNG / JPG / WebP) أو ملف PDF — حتى 8 ميغابايت.",
        submit: "إرسال الطلب",
        submitting: "جارٍ الإرسال…",
        errorGeneric: "حدث خطأ، حاول مرة أخرى.",
      }
    : {
        pickPackage: "Pick a UC package",
        bonusBadge: "BONUS",
        pubgIdLabel: "PUBG ID",
        pubgIdHelp: "Digits only — find it in PUBG settings → Profile.",
        ignLabel: "In-game name (IGN)",
        paymentMethodLabel: "Payment method",
        baridimob: "BaridiMob",
        ccp: "CCP / postal",
        paymentInstructions:
          "Send the exact price to our account (see instructions below) then upload your payment proof.",
        transferCodeLabel: "Transfer reference",
        transferCodeHelp: "Optional — helps us find your payment faster.",
        whatsappLabel: "WhatsApp number",
        whatsappHelp: "We'll contact you on WhatsApp to confirm.",
        emailLabel: "Email",
        emailHelp: "Optional.",
        proofLabel: "Payment proof",
        proofHelp: "Image (PNG / JPG / WebP) or PDF — up to 8 MB.",
        submit: "SUBMIT REQUEST",
        submitting: "SUBMITTING…",
        errorGeneric: "Something went wrong, try again.",
      };

  const heading = isAr ? "شحن UC" : "UC RECHARGE";
  const sub = isAr
    ? "اشحن رصيد UC في PUBG Mobile عبر BaridiMob أو CCP. ندويّاً، آمن، وسريع."
    : "Top up your PUBG Mobile UC via BaridiMob or CCP. Manual, safe, fast.";

  return (
    <article
      className="grain mx-auto max-w-[1100px] px-6 pt-28 pb-24 md:px-10 md:pt-36"
      style={{ background: "var(--black)" }}
    >
      <header className="mb-10">
        <span
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// ${heading}`}
        </span>
        <h1
          className="font-display mt-2 text-4xl leading-tight font-black uppercase italic md:text-5xl"
          style={{ color: "var(--bone)" }}
        >
          {isAr ? "اشحن UC الآن" : "Recharge UC now"}
        </h1>
        <p
          className="mt-3 max-w-2xl text-sm leading-relaxed"
          style={{ color: "rgba(245,240,232,0.7)" }}
        >
          {sub}
        </p>
        <div className="mt-4">
          <Link
            href={"/uc-recharge/lookup" as never}
            className="font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: "var(--ember)" }}
          >
            {isAr ? "تابع طلباً موجوداً ←" : "Track an existing request →"}
          </Link>
        </div>
      </header>

      <PaymentInstructions isAr={isAr} />

      {session ? (
        <div
          className="notch p-6"
          style={{
            background: "var(--ash-1)",
            border: "1px solid rgba(230,0,19,0.25)",
          }}
        >
          <UcRechargeForm
            packages={packages}
            locale={locale === "ar" ? "ar" : "en"}
            i18n={formI18n}
          />
        </div>
      ) : (
        <SignInGate isAr={isAr} locale={locale} />
      )}
    </article>
  );
}

function PaymentInstructions({ isAr }: { isAr: boolean }) {
  return (
    <section
      className="notch mb-8 p-5"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(245,240,232,0.08)",
      }}
    >
      <div
        className="mb-3 font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "var(--ember)" }}
      >
        {isAr ? "// تعليمات الدفع" : "// PAYMENT INSTRUCTIONS"}
      </div>
      <ol
        className="list-decimal space-y-2 ps-5 text-sm leading-relaxed"
        style={{ color: "rgba(245,240,232,0.85)" }}
      >
        <li>
          {isAr
            ? "اختر باقة UC، وأرسل سعرها بالدينار إلى حسابنا (BaridiMob أو CCP)."
            : "Pick a UC package and send the price in DZD to our account (BaridiMob or CCP)."}
        </li>
        <li>
          {isAr
            ? "أرفق صورة لإثبات الدفع، ومعرّف PUBG، ورقم واتساب."
            : "Upload your payment proof, your PUBG ID, and a WhatsApp number."}
        </li>
        <li>
          {isAr
            ? "نتواصل معك بعد التحقق من الدفع، ثم نسلّم UC داخل اللعبة."
            : "We'll contact you after verifying payment, then deliver UC in-game."}
        </li>
      </ol>
      <p
        className="mt-3 font-mono text-[10px]"
        style={{ color: "rgba(245,240,232,0.55)" }}
      >
        {isAr
          ? "ستجد تفاصيل الحساب (BaridiMob / CCP) في صفحة التواصل أو على واتساب الإدارة."
          : "Account details (BaridiMob / CCP) are listed on the contact page — or message us on WhatsApp."}
      </p>
    </section>
  );
}

function SignInGate({ isAr, locale }: { isAr: boolean; locale: string }) {
  const localePrefix = locale === "ar" ? "/ar" : "/en";
  const href = `${localePrefix}/login?next=${encodeURIComponent(`${localePrefix}/uc-recharge`)}`;
  return (
    <div
      className="flex flex-col items-start gap-4 p-6"
      style={{
        background: "var(--ash-3)",
        border: "1px solid rgba(230,0,19,0.25)",
      }}
    >
      <div className="font-display text-2xl leading-tight font-black uppercase italic md:text-3xl">
        {isAr ? "سجّل الدخول لإرسال طلب" : "Sign in to submit a request"}
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "rgba(245,240,232,0.7)" }}
      >
        {isAr
          ? "نطلب حساب Google لربط طلبك بك ولتجنب الإساءة."
          : "We require a Google account so we can link the request to you and prevent abuse."}
      </p>
      <a href={href} className="btn-hell">
        {isAr ? "تسجيل الدخول" : "SIGN IN"}
      </a>
    </div>
  );
}
