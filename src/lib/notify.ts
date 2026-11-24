import "server-only";
import { reviewUrl } from "@/lib/review";
import { getObjectBuffer } from "@/lib/storage";
import { db } from "./db";
import { getFirm } from "./data";
import { adminEmail, sendMail, siteUrl, type Mail } from "./email";
import { renderEmail, templates } from "./email-templates";
import type { Firm } from "./types";

async function firm(): Promise<Firm | null> {
  try {
    return await getFirm();
  } catch {
    return null;
  }
}

async function send(
  kind: string,
  to: string,
  t: { subject: string; content: Parameters<typeof renderEmail>[0] },
  opts?: { throwOnError?: boolean; replyTo?: string; attachments?: Mail["attachments"] },
) {
  const { html, text } = renderEmail(t.content, await firm(), `${await siteUrl()}/logo-email.png`);
  return sendMail({ kind, to, subject: t.subject, html, text, replyTo: opts?.replyTo, attachments: opts?.attachments }, { throwOnError: opts?.throwOnError });
}

/** Team inboxes: tax work → TAX_RELATED_EMAIL, meetings → ALL_MEETINGS_EMAIL, everything else → ADMIN_EMAIL. */
type Inbox = "general" | "tax" | "meetings";
function inboxFor(inbox: Inbox) {
  const env = process.env;
  if (inbox === "tax") return env.TAX_RELATED_EMAIL?.trim() || adminEmail();
  if (inbox === "meetings") return (env.ALL_MEETINGS_EMAIL || env.ALL_MEETINGS_EMAIl)?.trim() || adminEmail();
  return adminEmail();
}

async function alertAdmin(t: Parameters<typeof templates.adminAlert>[0], replyTo?: string, inbox: Inbox = "general", attachments?: Mail["attachments"]) {
  const to = inboxFor(inbox);
  if (to) await send("admin-alert", to, templates.adminAlert(t), { replyTo, attachments });
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
  kind: "contact" | "filing" | "question",
  base: string,
) {
  // Questions from the tax pages go to the tax inbox; other questions to the general one.
  const inbox: Inbox = kind === "filing" || (kind === "question" && /tax/i.test(lead.interest)) ? "tax" : "general";
  await send(
    kind === "filing" ? "filing-request" : "contact",
    lead.email,
    templates.enquiryReceived({ name: lead.name, interest: lead.interest, message: lead.notes, kind: kind === "filing" ? "filing" : "contact" }),
    { replyTo: inboxFor(inbox) },
  );
  await alertAdmin(
    {
      title: kind === "filing" ? "New tax filing request" : kind === "question" ? `New question: ${lead.interest}` : "New website enquiry",
      summary: `${lead.name} ${kind === "filing" ? "submitted a tax filing request" : kind === "question" ? `asked a question about ${lead.interest.toLowerCase()}` : "sent a message through the website"}.`,
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
    inbox,
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
    { replyTo: inboxFor("meetings") },
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
    "meetings",
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
  await send("tax-return", r.email, templates.taxReturnReceived({ name: r.name, year: r.year, portalUrl: `${base}/client/tax-return` }), { replyTo: inboxFor("tax") });
  await alertAdmin({
    title: `New ${r.year} tax return submitted`,
    summary: `${r.name} submitted their ${r.year} personal tax questionnaire.`,
    rows: [
      ["Client", r.name],
      ["Email", r.email],
      ["Tax year", String(r.year)],
    ],
    link: `${base}/studio/tax-returns/${r.id}`,
  }, r.email, "tax");
}

export async function notifyTaxReturnCompleted(
  r: { year: number; name: string; email: string; pdf?: { key: string; name: string } },
  base: string,
) {
  const attachments = r.pdf ? [{ filename: r.pdf.name, content: await getObjectBuffer(r.pdf.key), contentType: "application/pdf" }] : undefined;
  return send(
    "tax-return-done",
    r.email,
    templates.taxReturnCompleted({ name: r.name, year: r.year, portalUrl: `${base}/client/documents`, reviewUrl: reviewUrl(), attached: !!r.pdf }),
    { attachments, throwOnError: true, replyTo: inboxFor("tax") },
  );
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

// ── Proposals ──────────────────────────────────────────────────────────

export async function sendProposalEmail(p: { to: string; name: string; url: string; packageName: string; fee: string; preparedBy: string }) {
  return send("proposal", p.to, templates.proposalReady(p));
}

export async function notifyProposalDecision(p: { id: string; name: string; email: string; business: string; decision: "changes" | "declined"; note: string }, base: string) {
  await alertAdmin(
    {
      title: p.decision === "changes" ? "Proposal: changes requested" : "Proposal declined",
      summary: `${p.name}${p.business ? ` (${p.business})` : ""} ${p.decision === "changes" ? "asked for changes to their proposal." : "decided not to proceed."}`,
      rows: [
        ["Client", p.name],
        ["Email", p.email],
      ],
      message: p.note,
      link: `${base}/studio/proposals/${p.id}`,
    },
    p.email,
  );
}

export async function notifyProposalSigned(
  p: { id: string; name: string; email: string; business: string; packageName: string; fee: string; pdf: { filename: string; content: Buffer } },
  base: string,
) {
  const attachments = [{ ...p.pdf, contentType: "application/pdf" }];
  await send("proposal-signed", p.email, templates.proposalSigned({ name: p.name, business: p.business || p.name }), { attachments });
  await alertAdmin(
    {
      title: "Engagement letter signed",
      summary: `${p.name}${p.business ? ` (${p.business})` : ""} accepted the ${p.packageName} proposal and signed the engagement letter. Their portal invite and onboarding checklist have been sent.`,
      rows: [
        ["Client", p.name],
        ["Email", p.email],
        ["Package", p.packageName],
        ["Monthly fee", p.fee],
      ],
      link: `${base}/studio/proposals/${p.id}`,
    },
    p.email,
    "general",
    attachments,
  );
}

export { siteUrl };
