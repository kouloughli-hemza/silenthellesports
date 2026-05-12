// Email wrapper around Resend. Falls back to console.log when RESEND_API_KEY
// is unset so dev iteration doesn't require API credentials.

import "server-only";

import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { fail, ok, type Result } from "@/types/domain";

let cached: Resend | null = null;

function client(): Resend | null {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export interface SendInput {
  to: string;
  subject: string;
  html: string;
  // Required: every transactional email must have a plain-text alternative.
  // Mail clients use it for accessibility, and Gmail/Outlook treat missing
  // text/plain as a deliverability negative.
  text: string;
  replyTo?: string;
}

export async function sendEmail(input: SendInput): Promise<Result<{ id: string | null }>> {
  const env = getServerEnv();
  const c = client();

  if (!c) {
    // Dev fallback — log it so the developer can see what would have been sent.
    console.log("[email:mock] →", input.to, "·", input.subject);
    console.log(input.text);
    return ok({ id: null });
  }

  try {
    const res = await c.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (res.error) return fail(res.error.message);
    return ok({ id: res.data?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(message);
  }
}

// Branded HTML wrapper for transactional emails. Black background, hell-red
// accents, mono labels. Email clients are picky — keep CSS inline.
export function brandedTemplate(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const cta = opts.ctaUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
         <tr><td style="background:#E60013;padding:14px 28px">
           <a href="${opts.ctaUrl}" style="color:#F5F0E8;font-family:Arial,sans-serif;font-weight:800;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;font-size:14px">${opts.ctaLabel ?? "Open"}</a>
         </td></tr>
       </table>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0A0A0A;color:#F5F0E8;font-family:Arial,sans-serif">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${opts.preheader}</span>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0A0A0A;padding:32px 16px">
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#141414;border:1px solid rgba(230,0,19,0.3)">
          <tr><td style="padding:32px">
            <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:#E60013;text-transform:uppercase;margin-bottom:16px">// SILENT HELL · ESPORTS</div>
            <h1 style="margin:0 0 16px 0;color:#F5F0E8;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.02em;font-style:italic">${opts.heading}</h1>
            <div style="color:#F5F0E8;font-size:14px;line-height:1.6">${opts.bodyHtml}</div>
            ${cta}
            <hr style="border:none;border-top:1px solid rgba(245,240,232,0.1);margin:32px 0 16px 0">
            <div style="color:rgba(245,240,232,0.5);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase">Silent Hell Esports · silenthellesports.com</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}
