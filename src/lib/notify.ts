import "server-only";
import { reviewUrl } from "@/lib/review";
import { db } from "./db";
import { getFirm } from "./data";
import { adminEmail, sendMail, siteUrl } from "./email";
import { renderEmail, templates } from "./email-templates";
import type { Firm } from "./types";

async function firm(): Promise<Firm | null> {
  try {
    return await getFirm();
  } catch {
    return null;
  }
}

async function send(kind: string, to: string, t: { subject: string; content: Parameters<typeof renderEmail>[0] }, opts?: { throwOnError?: boolean; replyTo?: string }) {
  const { html, text } = renderEmail(t.content, await firm(), `${await siteUrl()}/logo-email.png`);
  return sendMail({ kind, to, subject: t.subject, html, text, replyTo: opts?.replyTo }, { throwOnError: opts?.throwOnError });
}

async function alertAdmin(t: Parameters<typeof templates.adminAlert>[0], replyTo?: string) {
  const to = adminEmail();
  if (to) await send("admin-alert", to, templates.adminAlert(t), { replyTo });
}

// ── Events ─────────────────────────────────────────────────────────────

export async function notifyClientRegistered(client: { name: string; email: string }, base: string) {
  await send("welcome", client.email, templates.welcome({ name: client.name, portalUrl: `${base}/login` }));
  await alertAdmin(
    {
      title: "New client account",
      summary: `${client.name} created a client portal account.`,
      rows: [
        ["Name", client.name],
        ["Email", client.email],
      ],
      link: `${base}/studio/clients`,
    },
    client.email,
  );
}

export async function notifyEnquiry(
  lead: { id: string; name: string; email: string; phone?: string; company?: string; interest: string; notes: string },
  kind: "contact" | "filing",
  base: string,
) {
  await send(
    kind === "filing" ? "filing-request" : "contact",
    lead.email,
    templates.enquiryReceived({ name: lead.name, interest: lead.interest, message: lead.notes, kind }),
  );
  await alertAdmin(
    {
      title: kind === "filing" ? "New tax filing request" : "New website enquiry",
      summary: `${lead.name} ${kind === "filing" ? "submitted a tax filing request" : "sent a message through the website"}.`,
      rows: [
        ["Name", lead.name],
        ["Email", lead.email],
        ["Phone", lead.phone ?? ""],
        ["Business", lead.company ?? ""],
        [kind === "filing" ? "Return type" : "Starting point", lead.interest],
      ],
      message: lead.notes,
      link: `${base}/studio/leads/${lead.id}`,
    },
    lead.email,
  );
}

export async function notifyBooking(
  b: { id: string; name: string; email: string; topic: string; startIso: string; timeZone: string; duration?: number; meetingUrl: string },
  base: string,
) {
  const fmt = (tz: string) =>
    new Date(b.startIso).toLocaleString("en-CA", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  await send(
    "booking",
    b.email,
    templates.bookingConfirmed({ name: b.name, topic: b.topic, when: fmt(b.timeZone), duration: b.duration, meetingUrl: b.meetingUrl }),
  );
  await alertAdmin(
    {
      title: "New meeting booked",
      summary: `${b.name} booked ${b.topic.toLowerCase()}.`,
      rows: [
        ["With", `${b.name} (${b.email})`],
        ["When", fmt("America/Edmonton")],
        ["Length", b.duration ? `${b.duration} min` : ""],
      ],
      link: `${base}/studio/meetings/${b.id}`,
    },
    b.email,
  );
}

export async function notifyAccountDeleted(client: { name: string; email: string }, base: string) {
  await send("account-deleted", client.email, templates.accountDeleted({ name: client.name }));
  await alertAdmin({
    title: "Client deleted their account",
    summary: `${client.name} closed their portal account. Their folder, files and login were removed.`,
    rows: [
      ["Name", client.name],
      ["Email", client.email],
    ],
    link: `${base}/studio/clients`,
  });
}

export async function notifyTaxReturnSubmitted(r: { id: string; year: number; name: string; email: string; clientId: string }, base: string) {
  await send("tax-return", r.email, templates.taxReturnReceived({ name: r.name, year: r.year, portalUrl: `${base}/client/tax-return` }));
  await alertAdmin({
    title: `New ${r.year} tax return submitted`,
    summary: `${r.name} submitted their ${r.year} personal tax questionnaire.`,
    rows: [
      ["Client", r.name],
      ["Email", r.email],
      ["Tax year", String(r.year)],
    ],
    link: `${base}/studio/tax-returns/${r.id}`,
  });
}

export async function notifyTaxReturnCompleted(r: { year: number; name: string; email: string }, base: string) {
  await send("tax-return-done", r.email, templates.taxReturnCompleted({ name: r.name, year: r.year, portalUrl: `${base}/client`, reviewUrl: reviewUrl() }));
}

// ── Follow-up pipeline ─────────────────────────────────────────────────

type DueRow = { id: string; subject: string; body: string; name: string; email: string };

async function deliver(row: DueRow) {
  try {
    const f = await firm();
    await send("follow-up", row.email, templates.followUp({ name: row.name, subject: row.subject, body: row.body || row.subject, signature: f?.name ?? "Adept Bookkeeping Services" }), {
      throwOnError: true,
    });
    await db()`UPDATE follow_ups SET status = 'sent', sent_at = now(), error = NULL WHERE id = ${row.id}`;
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    await db()`UPDATE follow_ups SET status = 'failed', error = ${message.slice(0, 500)} WHERE id = ${row.id}`;
    return { ok: false as const, error: message };
  }
}

/** Send one follow-up now (from Studio). Claims the row first so it can’t double-send. */
export async function sendFollowUpNow(id: string) {
  const rows = (await db()`
    UPDATE follow_ups f SET status = 'sending'
    FROM leads l
    WHERE f.id = ${id} AND l.id = f.lead_id AND f.channel = 'email' AND f.status IN ('queued', 'failed')
      AND btrim(f.body) <> ''
    RETURNING f.id, f.subject, f.body, l.name, l.email`) as DueRow[];
  if (!rows[0]) return { ok: false as const, error: "Add a message to this follow-up before sending (or it was already sent)." };
  return deliver(rows[0]);
}

/**
 * Sends every queued email follow-up whose time has come (times are Calgary local).
 * Safe to call concurrently: rows are claimed atomically with SKIP LOCKED.
 */
export async function processDueFollowUps(limit = 25) {
  const rows = (await db()`
    WITH due AS (
      SELECT f.id FROM follow_ups f
      WHERE f.status = 'queued' AND f.channel = 'email' AND btrim(f.body) <> ''
        AND f.scheduled_for <= (now() AT TIME ZONE 'America/Edmonton')
      ORDER BY f.scheduled_for
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE follow_ups f SET status = 'sending'
    FROM due, leads l
    WHERE f.id = due.id AND l.id = f.lead_id
    RETURNING f.id, f.subject, f.body, l.name, l.email`) as DueRow[];
  const results = [];
  for (const row of rows) results.push({ id: row.id, ...(await deliver(row)) });
  return { processed: results.length, sent: results.filter((r) => r.ok).length, results };
}

export { siteUrl };
