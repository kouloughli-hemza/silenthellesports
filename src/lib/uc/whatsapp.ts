// Algerian phone normalization + WhatsApp click-to-message helpers.
// Public + admin both use this — keeps formatting consistent.

const DZ_COUNTRY_CODE = "213";

// Accepts "0555 12 34 56", "+213 555 12 34 56", "213555123456", "555 12 34 56".
// Returns digits-only with country code, suitable for wa.me links.
// Returns null if it can't normalize to a plausible Algerian mobile number.
export function normalizeDzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return null;

  let local: string;
  if (digits.startsWith(DZ_COUNTRY_CODE)) {
    local = digits.slice(DZ_COUNTRY_CODE.length);
  } else if (digits.startsWith("0")) {
    local = digits.slice(1);
  } else {
    local = digits;
  }

  // Algerian mobile is 9 digits starting with 5/6/7. Landlines (other prefixes)
  // accepted too — reject only obviously-too-short input.
  if (local.length < 8 || local.length > 10) return null;
  return DZ_COUNTRY_CODE + local;
}

export function buildWhatsAppLink(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

interface MessageContext {
  ign: string;
  pubg_id: string;
  request_number: string;
  uc_amount: number;
  bonus_uc: number;
  rejection_reason?: string;
}

export type UcStatusForMessage =
  | "pending"
  | "payment_received"
  | "delivered"
  | "rejected";

export function buildStatusMessage(
  status: UcStatusForMessage,
  ctx: MessageContext,
): string {
  const totalUc = ctx.uc_amount + ctx.bonus_uc;
  const bonusNote = ctx.bonus_uc > 0 ? ` (+ ${ctx.bonus_uc} bonus)` : "";

  switch (status) {
    case "pending":
      return `Hi ${ctx.ign}, we received your UC recharge request ${ctx.request_number}. We'll verify your payment and update you shortly. — Silent Hell Esports`;
    case "payment_received":
      return `Hi ${ctx.ign}, we confirmed payment for request ${ctx.request_number}. Your ${ctx.uc_amount} UC${bonusNote} will be sent to PUBG ID ${ctx.pubg_id} shortly. — Silent Hell Esports`;
    case "delivered":
      return `Hi ${ctx.ign}, ${totalUc} UC has been delivered to PUBG ID ${ctx.pubg_id} for request ${ctx.request_number}. Enjoy! — Silent Hell Esports`;
    case "rejected":
      return `Hi ${ctx.ign}, we couldn't process request ${ctx.request_number}.${
        ctx.rejection_reason ? ` Reason: ${ctx.rejection_reason}.` : ""
      } Please contact us if you need help. — Silent Hell Esports`;
  }
}
