import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { renderEmail, templates } from "./email-templates";
import { sendMail } from "./email";
import { getFirm } from "./data";
import { siteUrl } from "./notify";

// Portal registration is invite-only: staff generate a dedicated link that expires when they choose.

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export const MAX_INVITE_DAYS = 90;

/** New single-use link for a client. Any earlier unused link for them stops working. */
export async function createInvite(clientId: string, email: string, hours: number) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + hours * 3600_000);
  await db().transaction((sql) => [
    sql`UPDATE portal_invites SET revoked_at = now() WHERE client_id = ${clientId} AND used_at IS NULL AND revoked_at IS NULL`,
    sql`INSERT INTO portal_invites (id, client_id, email, token_hash, expires_at)
        VALUES (${`inv_${randomBytes(9).toString("hex")}`}, ${clientId}, ${email}, ${hash(token)}, ${expiresAt.toISOString()})`,
  ]);
  return { token, expiresAt };
}

export type ActiveInvite = { id: string; clientId: string; email: string; name: string; type: string; expiresAt: string };

/** The invite behind a token, only while it's unused, not revoked and not expired. */
export async function findInvite(token: string): Promise<ActiveInvite | null> {
  if (!token || token.length > 100) return null;
  const [row] = await db()`
    SELECT i.id, i.client_id AS "clientId", i.email, c.name, c.type, i.expires_at AS "expiresAt"
    FROM portal_invites i JOIN clients c ON c.id = i.client_id
    WHERE i.token_hash = ${hash(token)} AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now()`;
  return row ? { ...(row as ActiveInvite), expiresAt: new Date(row.expiresAt).toISOString() } : null;
}

/** Marks the invite used and activates the new login (the invite email already proved the address). */
export async function consumeInvite(invite: ActiveInvite) {
  await db().transaction((sql) => [
    sql`UPDATE portal_invites SET used_at = now() WHERE id = ${invite.id}`,
    sql`UPDATE neon_auth."user" SET "emailVerified" = true WHERE lower(email) = lower(${invite.email})`,
  ]);
}

/** Portal access summary for Studio. */
export async function portalStatus(clientId: string) {
  const [client] = await db()`SELECT portal_user_id AS "userId" FROM clients WHERE id = ${clientId}`;
  const [invite] = await db()`
    SELECT expires_at AS "expiresAt", used_at AS "usedAt", revoked_at AS "revokedAt", created_at AS "createdAt"
    FROM portal_invites WHERE client_id = ${clientId} ORDER BY created_at DESC LIMIT 1`;
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
  return {
    active: !!client?.userId,
    invite: invite
      ? { expiresAt: iso(invite.expiresAt)!, usedAt: iso(invite.usedAt), revoked: !!invite.revokedAt, sentAt: iso(invite.createdAt)! }
      : null,
  };
}

export type InviteResult = { ok: true; url: string; expiresAt: string; emailed: boolean; emailError?: string } | { ok: false; error: string };

/** Creates a dedicated registration link and emails it to the client. */
export async function sendPortalInvite(clientId: string, hours: number): Promise<InviteResult> {
  if (!Number.isFinite(hours) || hours < 1 || hours > MAX_INVITE_DAYS * 24) return { ok: false, error: `Choose an expiry between 1 hour and ${MAX_INVITE_DAYS} days.` };
  const [client] = await db()`SELECT name, email, type, portal_user_id AS "userId" FROM clients WHERE id = ${clientId}`;
  if (!client) return { ok: false, error: "Client not found." };
  if (client.userId) return { ok: false, error: "This client already has a portal account." };

  const { token, expiresAt } = await createInvite(clientId, client.email, Math.round(hours));
  const base = await siteUrl();
  const url = `${base}/register/${token}`;
  const expires = expiresAt.toLocaleString("en-CA", { dateStyle: "long", timeStyle: "short", timeZone: "America/Edmonton" });
  const t = templates.portalInvite({ name: client.name, url, expires, business: client.type !== "Individual" });
  const { html, text } = renderEmail(t.content, await getFirm(), `${base}/logo-email.png`);
  const sent = await sendMail({ kind: "portal-invite", to: client.email, subject: t.subject, html, text });
  return { ok: true, url, expiresAt: expiresAt.toISOString(), emailed: sent.ok, emailError: sent.ok ? undefined : sent.error };
}

export const STARTER_CHECKLIST = [
  "Upload bank statements",
  "Upload credit card statements",
  "Upload sales invoices",
  "Upload bills and expense receipts",
  "Send payroll changes (new hires, raises, leavers)",
];

/** Gives a business client the standard monthly checklist, if they don't have one yet. */
export async function seedStarterChecklist(clientId: string) {
  const [{ n }] = await db()`SELECT count(*)::int AS n FROM checklist_items WHERE client_id = ${clientId}`;
  if (n > 0) return;
  await db().transaction((sql) =>
    STARTER_CHECKLIST.map(
      (title, i) => sql`INSERT INTO checklist_items (id, client_id, title, position) VALUES (${`chk_${randomBytes(9).toString("hex")}`}, ${clientId}, ${title}, ${i + 1})`,
    ),
  );
}
