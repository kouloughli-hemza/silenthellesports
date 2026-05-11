import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, Link } from "@/lib/i18n/routing";
import { getUcRequestPublic } from "@/lib/uc/data";
import { maskPhone, maskPubgId } from "@/lib/uc/whatsapp";
import { formatPrice, type Locale } from "@/types/domain";
import { formatDateLong } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const STATUS_ORDER = [
  "pending",
  "payment_received",
  "delivered",
] as const;

interface StatusCopy {
  label: string;
  description: string;
}

function statusCopy(
  isAr: boolean,
): Record<string, StatusCopy> {
  if (isAr) {
    return {
      pending: {
        label: "قيد الانتظار",
        description: "نراجع إثبات الدفع. عادةً يستغرق ذلك من 15 دقيقة إلى ساعتين.",
      },
      payment_received: {
        label: "تم استلام الدفع",
        description: "تأكدنا من الدفع. سنرسل UC إلى حسابك في PUBG قريباً.",
      },
      delivered: {
        label: "تم التسليم",
        description: "تم إرسال UC إلى حسابك. استمتع!",
      },
      rejected: {
        label: "مرفوض",
        description: "لم نستطع معالجة الطلب — انظر السبب أدناه.",
      },
      cancelled: {
        label: "ملغى",
        description: "تم إلغاء هذا الطلب.",
      },
    };
  }
  return {
    pending: {
      label: "Pending",
      description:
        "We're verifying your payment proof. This usually takes 15 minutes to 2 hours.",
    },
    payment_received: {
      label: "Payment received",
      description:
        "We confirmed your payment. UC will be sent to your PUBG account shortly.",
    },
    delivered: {
      label: "Delivered",
      description: "UC has been sent to your account. Enjoy!",
    },
    rejected: {
      label: "Rejected",
      description: "We couldn't process this request — see the reason below.",
    },
    cancelled: {
      label: "Cancelled",
      description: "This request was cancelled.",
    },
  };
}

export default async function UcStatusPage({
  params,
}: {
  params: Promise<{ locale: string; requestNumber: string }>;
}) {
  const { locale, requestNumber } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isAr = locale === "ar";
  const tLocale = locale as Locale;

  const req = await getUcRequestPublic(requestNumber);
  if (!req) notFound();

  const copy = statusCopy(isAr);
  const current = copy[req.status] ?? copy.pending!;
  const stepIndex = STATUS_ORDER.indexOf(req.status as (typeof STATUS_ORDER)[number]);
  const isFinalGood = req.status === "delivered";
  const isFinalBad = req.status === "rejected" || req.status === "cancelled";

  return (
    <article
      className="grain mx-auto max-w-[820px] px-6 pt-28 pb-24 md:px-10 md:pt-36"
      style={{ background: "var(--black)" }}
    >
      <Link
        href={"/uc-recharge" as never}
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(245,240,232,0.6)" }}
      >
        ← {isAr ? "طلب جديد" : "New request"}
      </Link>

      <header className="mt-4">
        <span
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--hell-red)" }}
        >
          {`// ${req.request_number}`}
        </span>
        <h1
          className="font-display mt-1 text-4xl font-black uppercase italic"
          style={{ color: "var(--bone)" }}
        >
          {req.uc_amount_snapshot} UC
          {req.bonus_uc_snapshot > 0 ? (
            <span style={{ color: "var(--ember)" }}>
              {" "}
              + {req.bonus_uc_snapshot}
            </span>
          ) : null}
        </h1>
        <p
          className="mt-1 font-mono text-xs"
          style={{ color: "rgba(245,240,232,0.6)" }}
        >
          {formatPrice(Number(req.price_dzd_snapshot), tLocale, "DZD")} ·{" "}
          {formatDateLong(req.created_at, tLocale)}
        </p>
      </header>

      <section
        className="notch mt-6 p-6"
        style={{
          background: "var(--ash-1)",
          border:
            "1px solid " +
            (isFinalBad ? "var(--hell-red)" : "rgba(230,0,19,0.25)"),
        }}
      >
        <div
          className="font-display text-2xl font-black uppercase italic"
          style={{
            color: isFinalBad
              ? "var(--hell-red)"
              : isFinalGood
                ? "rgba(120,255,150,0.9)"
                : "var(--bone)",
          }}
        >
          {current.label}
        </div>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "rgba(245,240,232,0.75)" }}
        >
          {current.description}
        </p>
        {req.rejection_reason ? (
          <div
            className="mt-3 font-mono text-xs"
            style={{ color: "var(--hell-red)" }}
          >
            {isAr ? "السبب: " : "Reason: "}
            {req.rejection_reason}
          </div>
        ) : null}
      </section>

      {!isFinalBad ? (
        <section className="mt-6">
          <div
            className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(245,240,232,0.55)" }}
          >
            {isAr ? "// التقدّم" : "// PROGRESS"}
          </div>
          <ol className="space-y-3">
            {STATUS_ORDER.map((s, i) => {
              const reached = stepIndex >= i;
              const c = copy[s]!;
              return (
                <li
                  key={s}
                  className="flex items-start gap-3 p-3"
                  style={{
                    background: "var(--ash-3)",
                    border:
                      "1px solid " +
                      (reached
                        ? "rgba(230,0,19,0.45)"
                        : "rgba(245,240,232,0.06)"),
                    opacity: reached ? 1 : 0.55,
                  }}
                >
                  <span
                    className="mt-1"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: reached
                        ? "var(--hell-red)"
                        : "rgba(245,240,232,0.2)",
                      boxShadow: reached ? "0 0 8px var(--hell-red)" : "none",
                    }}
                  />
                  <div>
                    <div
                      className="font-mono text-[11px] tracking-[0.2em] uppercase"
                      style={{ color: "var(--bone)" }}
                    >
                      {c.label}
                    </div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{ color: "rgba(245,240,232,0.6)" }}
                    >
                      {c.description}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Detail
          label={isAr ? "معرّف PUBG" : "PUBG ID"}
          value={maskPubgId(req.pubg_id)}
        />
        <Detail label={isAr ? "اللقب" : "IGN"} value={req.ign} />
        <Detail
          label={isAr ? "طريقة الدفع" : "Payment method"}
          value={req.payment_method}
        />
        {req.transfer_code ? (
          <Detail
            label={isAr ? "رمز التحويل" : "Transfer code"}
            value={req.transfer_code}
          />
        ) : null}
        <Detail
          label={isAr ? "واتساب" : "WhatsApp"}
          value={maskPhone(req.whatsapp_phone)}
        />
      </section>
      <p
        className="mt-2 font-mono text-[10px]"
        style={{ color: "rgba(245,240,232,0.45)" }}
      >
        {isAr
          ? "تم إخفاء جزء من رقم الهاتف ومعرّف PUBG للحماية. الإدارة ترى التفاصيل كاملة."
          : "Phone and PUBG ID are partially hidden for privacy. Admin sees full details."}
      </p>

      <p
        className="mt-8 font-mono text-[10px] leading-relaxed"
        style={{ color: "rgba(245,240,232,0.5)" }}
      >
        {isAr
          ? "احفظ هذا الرابط لتتبع طلبك. يمكنك أيضاً البحث عنه برقم الطلب أو رمز التحويل من صفحة المتابعة."
          : "Bookmark this URL to track your request. You can also look it up by request number or transfer code from the tracking page."}
      </p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-3"
      style={{
        background: "var(--ash-1)",
        border: "1px solid rgba(245,240,232,0.06)",
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(245,240,232,0.5)" }}
      >
        {label}
      </div>
      <div className="mt-1 font-mono text-xs">{value}</div>
    </div>
  );
}
