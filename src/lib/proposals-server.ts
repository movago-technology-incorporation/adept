import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { normalizeDetails, money, pkg, type ProposalDetails } from "./proposal-template";
import { renderProposalPdf } from "./proposal-pdf";
import { uploadObject } from "./storage";
import { seedStarterChecklist, sendPortalInvite } from "./invites";
import { notifyProposalDecision, notifyProposalSigned, sendProposalEmail, siteUrl } from "./notify";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newId = (prefix: string) => `${prefix}_${randomBytes(9).toString("hex")}`;
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
const signedLabel = (v: unknown) =>
  `${new Date(v as string).toLocaleString("en-CA", { dateStyle: "long", timeStyle: "short", timeZone: "America/Edmonton" })} Mountain Time`;

export type ProposalView = {
  id: string;
  title: string;
  status: string;
  date: string;
  details: ProposalDetails;
  clientId: string | null;
  leadId: string | null;
  email: string;
  sentAt: string | null;
  viewedAt: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  signedName: string | null;
  signedAt: string | null;
  /** Signing time formatted once on the server (Mountain Time), so server and browser render the same text. */
  signedLabel: string | null;
  signedIp: string | null;
  documentKey: string | null;
};

async function load(where: "id" | "token", value: string): Promise<ProposalView | null> {
  const rows =
    where === "id"
      ? await db()`
          SELECT p.*, COALESCE(c.name, l.name) AS who_name, COALESCE(c.company, l.company) AS who_company, COALESCE(c.email, l.email) AS who_email
          FROM proposals p LEFT JOIN clients c ON c.id = p.client_id LEFT JOIN leads l ON l.id = p.lead_id
          WHERE p.id = ${value}`
      : await db()`
          SELECT p.*, COALESCE(c.name, l.name) AS who_name, COALESCE(c.company, l.company) AS who_company, COALESCE(c.email, l.email) AS who_email
          FROM proposals p LEFT JOIN clients c ON c.id = p.client_id LEFT JOIN leads l ON l.id = p.lead_id
          WHERE p.token_hash = ${hash(value)}`;
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    date: (iso(r.sent_at) ?? iso(r.created_at) ?? new Date().toISOString()).slice(0, 10),
    details: normalizeDetails(r.details, { name: r.who_name ?? "", company: r.who_company ?? "", email: r.who_email ?? "" }),
    clientId: r.client_id,
    leadId: r.lead_id,
    email: r.who_email ?? "",
    sentAt: iso(r.sent_at),
    viewedAt: iso(r.viewed_at),
    decisionNote: r.decision_note,
    decidedAt: iso(r.decided_at),
    signedName: r.signed_name,
    signedAt: iso(r.signed_at),
    signedLabel: r.signed_at ? signedLabel(r.signed_at) : null,
    signedIp: r.signed_ip,
    documentKey: r.document_key,
  };
}

export const getProposal = (id: string) => load("id", id);

/** Client link: also records the first time it's opened. */
export async function getProposalByToken(token: string) {
  if (!token || token.length > 100) return null;
  const p = await load("token", token);
  if (p && !p.viewedAt) {
    await db()`UPDATE proposals SET viewed_at = now(), status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END WHERE id = ${p.id}`;
  }
  return p;
}

const summary = (d: ProposalDetails) => ({ title: `${pkg(d.package).name} bookkeeping`, amount: `${money(d.monthlyFee) || "$—"} / month` });

export async function saveDetails(id: string, d: ProposalDetails) {
  const { title, amount } = summary(d);
  const rows = await db()`
    UPDATE proposals SET details = ${JSON.stringify(d)}::jsonb, title = ${title}, amount = ${amount}
    WHERE id = ${id} AND signed_at IS NULL RETURNING id`;
  return rows.length > 0;
}

/** New private link each send (older links stop working), then email it. */
export async function sendToClient(id: string, d: ProposalDetails) {
  if (!(await saveDetails(id, d))) return { ok: false as const, error: "This proposal is already signed." };
  const p = await getProposal(id);
  if (!p?.email) return { ok: false as const, error: "Add an email address for this lead or client first." };
  const token = randomBytes(24).toString("base64url");
  await db()`
    UPDATE proposals SET token_hash = ${hash(token)}, status = 'sent', sent_at = current_date, viewed_at = NULL, decision_note = NULL, decided_at = NULL
    WHERE id = ${id}`;
  if (p.leadId) await db()`UPDATE leads SET status = 'proposal sent' WHERE id = ${p.leadId} AND status NOT IN ('won', 'lost')`;
  const url = `${await siteUrl()}/proposal/${token}`;
  const sent = await sendProposalEmail({
    to: p.email,
    name: d.clientName || p.email,
    url,
    packageName: pkg(d.package).name,
    fee: money(d.monthlyFee),
    preparedBy: d.preparedBy,
  });
  return { ok: true as const, url, emailed: sent.ok, emailError: sent.ok ? undefined : sent.error };
}

export async function recordDecision(token: string, decision: "changes" | "declined", note: string) {
  return decide(await load("token", token), decision, note);
}

export async function decide(p: ProposalView | null, decision: "changes" | "declined", note: string) {
  if (!p || p.signedAt) return { ok: false as const, error: "This proposal can’t be changed." };
  await db()`
    UPDATE proposals SET status = ${decision === "changes" ? "changes requested" : "declined"}, decision_note = ${note.slice(0, 2000)}, decided_at = now()
    WHERE id = ${p.id}`;
  if (decision === "declined" && p.leadId) await db()`UPDATE leads SET status = 'lost' WHERE id = ${p.leadId} AND status <> 'won'`;
  await notifyProposalDecision(
    { id: p.id, name: p.details.clientName, email: p.email, business: p.details.businessName, decision, note },
    await siteUrl(),
  );
  return { ok: true as const };
}

/**
 * Client accepts and signs. Then onboarding runs: client folder (from the lead if needed),
 * signed PDF to their documents, onboarding tasks, monthly checklist, portal invite and emails.
 */
export async function signProposal(token: string, name: string, meta: { ip: string; agent: string }) {
  return sign(await load("token", token), name, meta);
}

export async function sign(p: ProposalView | null, name: string, meta: { ip: string; agent: string }) {
  if (!p) return { ok: false as const, error: "This link is no longer valid." };
  if (p.signedAt) return { ok: true as const };
  if (p.status === "declined") return { ok: false as const, error: "This proposal was declined. Contact Adept to reopen it." };

  const signedAt = new Date().toISOString();
  const claimed = await db()`
    UPDATE proposals SET status = 'signed', accepted_at = current_date, decided_at = now(), signed_name = ${name}, signed_at = ${signedAt},
           signed_ip = ${meta.ip}, signed_agent = ${meta.agent.slice(0, 300)}
    WHERE id = ${p.id} AND signed_at IS NULL RETURNING id`;
  if (!claimed.length) return { ok: true as const };

  const d = p.details;
  const base = await siteUrl();

  // Client folder: reuse the client, or the one matching the lead's email, or create it.
  let clientId = p.clientId;
  if (!clientId && p.leadId) {
    const [lead] = await db()`SELECT name, email, phone, company FROM leads WHERE id = ${p.leadId}`;
    const [existing] = await db()`SELECT id FROM clients WHERE lower(email) = lower(${lead.email})`;
    clientId =
      existing?.id ??
      (
        await db()`
          INSERT INTO clients (id, name, company, email, phone, type)
          VALUES (${newId("cli")}, ${d.clientName || lead.name}, ${d.businessName || lead.company || ""}, ${lead.email}, ${lead.phone || ""}, ${d.businessType})
          RETURNING id`
      )[0].id;
    await db()`UPDATE proposals SET client_id = ${clientId} WHERE id = ${p.id}`;
    await db()`UPDATE leads SET status = 'won' WHERE id = ${p.leadId}`;
  }
  if (!clientId) return { ok: true as const };
  await db()`UPDATE clients SET type = ${d.businessType} WHERE id = ${clientId} AND type = 'Individual'`;

  const pdf = await storeSignedPdf(p, clientId, name, signedAt, meta.ip);
  // One-off onboarding tasks (shown under Outstanding), plus the monthly checklist.
  const due = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const tasks = [
    "Complete the agreed initial payment/retainer",
    ...(d.qboPlan !== "Not applicable" ? ["Connect QuickBooks Online and grant Adept accountant access"] : []),
    "Upload opening documents (recent bank and credit card statements, last year’s financials)",
  ];
  try {
    await db().transaction((sql) =>
      tasks.map((title) => sql`INSERT INTO forms (id, client_id, title, due, status) VALUES (${newId("frm")}, ${clientId}, ${title}, ${due}, 'outstanding')`),
    );
    await seedStarterChecklist(clientId);
  } catch (err) {
    console.error("Onboarding tasks failed:", err);
  }

  try {
    await sendPortalInvite(clientId, 14 * 24);
  } catch (err) {
    console.error("Portal invite after signing failed:", err);
  }

  if (pdf) await emailSignedPdf(p, name, pdf, base);
  return { ok: true as const };
}

/** Renders the signed PDF and files it in the client's Agreements. Null if it couldn't be made. */
async function storeSignedPdf(p: ProposalView, clientId: string, name: string, signedAt: string, ip: string) {
  const d = p.details;
  try {
    const content = Buffer.from(await renderProposalPdf(d, p.date, { name, at: signedAt, ip }));
    const slug = (d.businessName || d.clientName || "client").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    const filename = `Adept-Proposal-and-Engagement-Letter-${slug}.pdf`;
    const key = `clients/${clientId}/Agreements/${Date.now()}_${filename}`;
    await uploadObject(key, content, "application/pdf");
    const size = content.length > 1048576 ? `${(content.length / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(content.length / 1024))} KB`;
    await db()`
      INSERT INTO documents (id, client_id, name, kind, category, size, uploaded_at, storage_key)
      VALUES (${newId("doc")}, ${clientId}, ${filename}, 'other', 'Agreements', ${size}, current_date, ${key})`;
    await db()`UPDATE proposals SET document_key = ${key} WHERE id = ${p.id}`;
    return { filename, content };
  } catch (err) {
    console.error("Signed proposal PDF failed:", err);
    return null;
  }
}

async function emailSignedPdf(p: ProposalView, name: string, pdf: { filename: string; content: Buffer }, base: string) {
  const d = p.details;
  try {
    await notifyProposalSigned(
      { id: p.id, name: d.clientName || name, email: p.email, business: d.businessName, packageName: pkg(d.package).name, fee: money(d.monthlyFee), pdf },
      base,
    );
  } catch (err) {
    console.error("Signed proposal emails failed:", err);
  }
}

/** Staff retry: makes the signed PDF (and sends it) for a signed proposal that doesn't have one. */
export async function finishSignedPaperwork(id: string) {
  const p = await getProposal(id);
  if (!p?.signedAt || !p.signedName) return { ok: false as const, error: "This proposal hasn’t been signed yet." };
  if (p.documentKey) return { ok: true as const };
  if (!p.clientId) return { ok: false as const, error: "This proposal isn’t linked to a client yet." };
  const pdf = await storeSignedPdf(p, p.clientId, p.signedName, p.signedAt, p.signedIp ?? "unknown");
  if (!pdf) return { ok: false as const, error: "The PDF couldn’t be created. Check the server log for details." };
  await emailSignedPdf(p, p.signedName, pdf, await siteUrl());
  return { ok: true as const };
}

// ── Client portal ──────────────────────────────────────────────────────

/** Sent proposals for a portal client: addressed to their folder, or to the lead with their email. */
export async function listClientProposals(clientId: string) {
  const rows = await db()`
    SELECT p.id FROM proposals p
    JOIN clients c ON c.id = ${clientId}
    LEFT JOIN leads l ON l.id = p.lead_id
    WHERE p.status <> 'draft' AND p.sent_at IS NOT NULL
      AND (p.client_id = c.id OR (p.client_id IS NULL AND lower(l.email) = lower(c.email)))
    ORDER BY p.sent_at DESC, p.created_at DESC`;
  const list = await Promise.all(rows.map((r) => getProposal(r.id)));
  return list.filter((p): p is ProposalView => !!p);
}

/** One proposal, only if it belongs to this client. Records the first view. */
export async function getClientProposal(clientId: string, id: string) {
  const mine = (await listClientProposals(clientId)).find((p) => p.id === id) ?? null;
  if (mine && !mine.viewedAt) {
    await db()`UPDATE proposals SET viewed_at = now(), status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END WHERE id = ${id}`;
  }
  return mine;
}
