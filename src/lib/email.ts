import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { headers } from "next/headers";
import { db } from "./db";

let transport: Transporter | null = null;

function getTransport() {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP is not configured");
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: (SMTP_SECURE ?? "true") === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 3,
  });
  return transport;
}

export const emailEnabled = () => process.env.EMAIL_ENABLED === "true";
export const adminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_FROM_EMAIL || "";

export type Mail = {
  kind: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends one email and records the outcome in email_log.
 * Never throws for delivery problems unless `throwOnError` is set — callers that
 * must report failure (e.g. follow-ups) pass it.
 */
export async function sendMail(mail: Mail, { throwOnError = false } = {}) {
  if (!mail.to) return { ok: false as const, error: "No recipient" };
  if (!emailEnabled()) {
    await log(mail, "skipped", "EMAIL_ENABLED is not true");
    return { ok: false as const, error: "Email sending is turned off" };
  }
  try {
    const fromName = process.env.EMAIL_FROM_NAME || "Adept Bookkeeping Services";
    const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.SMTP_USER!;
    await getTransport().sendMail({
      from: { name: fromName, address: fromEmail },
      to: mail.to,
      replyTo: mail.replyTo || adminEmail() || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    await log(mail, "sent");
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Email "${mail.kind}" to ${mail.to} failed:`, message);
    await log(mail, "failed", message);
    if (throwOnError) throw new Error(message);
    return { ok: false as const, error: message };
  }
}

async function log(mail: Mail, status: string, error?: string) {
  try {
    await db()`
      INSERT INTO email_log (kind, to_email, subject, status, error)
      VALUES (${mail.kind}, ${mail.to}, ${mail.subject}, ${status}, ${error ?? null})`;
  } catch (err) {
    console.error("email_log write failed:", err);
  }
}

/** Public origin of the site, for links inside emails. */
export async function siteUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  } catch {}
  return "http://localhost:5617";
}
