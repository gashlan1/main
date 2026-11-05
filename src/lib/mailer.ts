import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { FIRM } from "./firm";

export type OutgoingAttachment = { filename: string; content: Buffer; contentType: string };

export type OutgoingMail = {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  attachments?: OutgoingAttachment[];
};

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function fromAddress(): string {
  return process.env.MAIL_FROM || `${FIRM.legalName} <${FIRM.email}>`;
}

function textToHtml(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; white-space: pre-wrap;">${escaped}</div>`;
}

/** Send through SMTP. Throws when SMTP is not configured. */
export async function sendMail(mail: OutgoingMail): Promise<{ messageId: string }> {
  if (!mailConfigured()) throw new Error("SMTP is not configured");
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  const info = await transporter.sendMail({
    from: fromAddress(),
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    to: mail.to,
    cc: mail.cc || undefined,
    subject: mail.subject,
    text: mail.text,
    html: textToHtml(mail.text),
    attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
  return { messageId: info.messageId };
}

/** Best-effort staff notification when a new inquiry arrives. Never throws. */
export async function notifyNewInquiry(input: { ref: string; contactName: string; company: string | null; serviceType: string | null; summary: string | null; link: string }): Promise<void> {
  if (!mailConfigured()) return;
  try {
    await sendMail({
      to: process.env.MAIL_NOTIFY || FIRM.email,
      subject: `New inquiry ${input.ref}: ${input.contactName}${input.company ? ` (${input.company})` : ""}`,
      text: [
        `A new inquiry has arrived on ${FIRM.portalName}.`,
        "",
        `Reference: ${input.ref}`,
        `Contact: ${input.contactName}${input.company ? ` — ${input.company}` : ""}`,
        `Service: ${input.serviceType ?? "not stated"}`,
        input.summary ? `Summary: ${input.summary}` : "",
        "",
        `Open it: ${input.link}`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  } catch (err) {
    console.error("Staff notification failed", err);
  }
}

/**
 * Build an RFC 822 message the associate can open in Outlook as an unsent
 * draft (X-Unsent: 1) with the attachments already in place.
 */
export async function buildEml(mail: OutgoingMail): Promise<Buffer> {
  const composer = new MailComposer({
    from: fromAddress(),
    to: mail.to,
    cc: mail.cc || undefined,
    subject: mail.subject,
    text: mail.text,
    html: textToHtml(mail.text),
    headers: { "X-Unsent": "1" },
    attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
  return composer.compile().build();
}
