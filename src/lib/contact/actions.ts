"use server";

import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { brandedTemplate, sendEmail } from "@/services/email";
import { fail, ok, type Result } from "@/types/domain";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(4000),
  // Honeypot — real humans leave it blank. Bots fill every field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export async function sendContactMessageAction(
  input: ContactInput,
): Promise<Result<{ delivered: boolean }>> {
  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Check the form and try again.");
  }
  if (parsed.data.website && parsed.data.website.length > 0) {
    return ok({ delivered: true });
  }

  const data = parsed.data;
  const env = getServerEnv();

  const html = brandedTemplate({
    preheader: `New contact: ${data.subject}`,
    heading: data.subject,
    bodyHtml: `
      <p style="margin:0 0 4px 0;color:rgba(245,240,232,0.5);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">// FROM</p>
      <p style="margin:0 0 16px 0"><strong>${escapeHtml(data.name)}</strong> &lt;${escapeHtml(data.email)}&gt;</p>
      <p style="margin:0 0 4px 0;color:rgba(245,240,232,0.5);font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">// MESSAGE</p>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6">${escapeHtml(data.message)}</p>
    `,
  });
  const text = `From: ${data.name} <${data.email}>\nSubject: ${data.subject}\n\n${data.message}`;

  const result = await sendEmail({
    to: env.CONTACT_TO_EMAIL,
    subject: `[CONTACT] ${data.subject}`,
    html,
    text,
    replyTo: data.email,
  });

  if (!result.success) {
    console.error("[contact] sendEmail failed", result.error);
    return fail("Couldn't send your message. Try again in a moment.");
  }
  return ok({ delivered: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
