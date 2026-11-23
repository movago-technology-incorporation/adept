"use server";

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireSignedIn, requireStaff } from "@/lib/auth/viewer";
import { portalStatus, seedStarterChecklist, sendPortalInvite, type InviteResult } from "@/lib/invites";
import type { Client } from "@/lib/types";

const text = (v: unknown, max = 500) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const CLIENT_TYPES: Client["type"][] = ["Individual", "Sole proprietor", "Corporation"];
const newId = (prefix: string) => `${prefix}_${randomBytes(9).toString("hex")}`;

// ── Portal invites (staff) ─────────────────────────────────────────────

export type { InviteResult } from "@/lib/invites";

/** Sends (or re-sends) a dedicated registration link to an existing client. */
export async function inviteClient(clientId: string, hours: number) {
  await requireStaff();
  return sendPortalInvite(clientId, hours);
}

/** Turns a website enquiry into a client folder (if needed) and invites them to the portal. */
export async function inviteLead(leadId: string, type: Client["type"], hours: number): Promise<InviteResult & { clientId?: string }> {
  await requireStaff();
  const [lead] = await db()`SELECT name, email, phone, company FROM leads WHERE id = ${leadId}`;
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!isEmail(lead.email)) return { ok: false, error: "This lead doesn’t have a valid email address." };
  const kind = CLIENT_TYPES.includes(type) ? type : "Individual";
  let [client] = await db()`SELECT id FROM clients WHERE lower(email) = lower(${lead.email})`;
  if (!client) {
    [client] = await db()`
      INSERT INTO clients (id, name, company, email, phone, type)
      VALUES (${newId("cli")}, ${text(lead.name, 200)}, ${text(lead.company, 200)}, ${lead.email}, ${text(lead.phone, 50)}, ${kind})
      RETURNING id`;
  }
  await db()`UPDATE leads SET status = 'won' WHERE id = ${leadId} AND status <> 'won'`;
  const res = await sendPortalInvite(client.id, hours);
  return { ...res, clientId: client.id };
}

export async function getPortalStatus(clientId: string) {
  await requireStaff();
  return portalStatus(clientId);
}

// ── Monthly checklist ──────────────────────────────────────────────────

export type ChecklistRow = { id: string; title: string; done: boolean; doneBy: string | null; doneAt: string | null };

const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" }).slice(0, 7);
const validMonth = (m?: string) => (m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : thisMonth());

/** Who may read/write this client's checklist: staff, or the client themselves. */
async function checklistViewer(clientId?: string) {
  const viewer = await requireSignedIn();
  if (viewer.role === "staff") {
    if (!clientId) throw new Error("Missing client");
    return { clientId, by: "adept" as const };
  }
  if (viewer.role !== "client") throw new Error("Not allowed");
  return { clientId: viewer.clientId, by: "client" as const };
}

export async function getChecklist(clientId?: string, month?: string): Promise<{ month: string; items: ChecklistRow[] }> {
  const v = await checklistViewer(clientId);
  const m = validMonth(month);
  const rows = await db()`
    SELECT i.id, i.title, k.done_by AS "doneBy", k.done_at AS "doneAt"
    FROM checklist_items i LEFT JOIN checklist_marks k ON k.item_id = i.id AND k.month = ${m}
    WHERE i.client_id = ${v.clientId}
    ORDER BY i.position, i.created_at`;
  return {
    month: m,
    items: rows.map((r) => ({ id: r.id, title: r.title, done: !!r.doneAt, doneBy: r.doneBy ?? null, doneAt: r.doneAt ? new Date(r.doneAt).toISOString() : null })),
  };
}

export async function setChecklistDone(itemId: string, done: boolean, month?: string, clientId?: string) {
  const v = await checklistViewer(clientId);
  const m = validMonth(month);
  const [item] = await db()`SELECT id FROM checklist_items WHERE id = ${itemId} AND client_id = ${v.clientId}`;
  if (!item) throw new Error("Checklist item not found");
  if (done) {
    await db()`INSERT INTO checklist_marks (item_id, month, done_by) VALUES (${itemId}, ${m}, ${v.by}) ON CONFLICT (item_id, month) DO NOTHING`;
  } else {
    await db()`DELETE FROM checklist_marks WHERE item_id = ${itemId} AND month = ${m}`;
  }
}

export async function addChecklistItem(clientId: string, title: string) {
  await requireStaff();
  const t = text(title, 200);
  if (!t) return;
  await db()`
    INSERT INTO checklist_items (id, client_id, title, position)
    VALUES (${newId("chk")}, ${clientId}, ${t}, (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE client_id = ${clientId}))`;
}

export async function removeChecklistItem(itemId: string) {
  await requireStaff();
  await db()`DELETE FROM checklist_items WHERE id = ${itemId}`;
}

/** One-click starter list for businesses. */
export async function addStarterChecklist(clientId: string) {
  await requireStaff();
  await seedStarterChecklist(clientId);
}
