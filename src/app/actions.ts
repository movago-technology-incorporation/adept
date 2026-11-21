"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/data";
import { cancelBooking, createBooking, firmDateTime, getAvailability, getEventTypes, meetingLink } from "@/lib/cal";
import { getViewer, requireSignedIn, requireStaff } from "@/lib/auth/viewer";
import { purgeClient } from "@/lib/accounts";
import { deleteObject } from "@/lib/storage";
import { notifyAccountDeleted, notifyBooking, notifyEnquiry, processDueFollowUps, sendFollowUpNow, siteUrl } from "@/lib/notify";
import type { Appointment, Client, DocumentFile, FollowUp, Job, Lead, Proposal, Testimonial, ThreadMessage } from "@/lib/types";

// Authorization model
// - Public (anyone):  createLead, recordClick, getOpenTimes, bookMeeting (as a guest)
// - Signed-in client: their own documents, messages, forms, bookings
// - Staff:            everything else
// Every check runs here on the server; hiding UI is not access control.

const text = (v: unknown, max = 5000) => String(v ?? "").slice(0, max).trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const LEAD_STATUSES = ["new", "engaged", "consult booked", "proposal sent", "won", "lost"];

// ── Leads & tracking (public site) ──────────────────────────────────────

export async function createLead(lead: Lead) {
  const name = text(lead.name, 200);
  const email = text(lead.email, 320);
  if (!lead.id || !name || !isEmail(email)) throw new Error("Please add your name and a valid email.");
  const viewer = await getViewer();
  // Only staff can set pipeline fields on create; public forms always start as "new".
  const status = viewer?.role === "staff" && LEAD_STATUSES.includes(lead.status) ? lead.status : "new";
  await db()`
    INSERT INTO leads (id, name, email, phone, company, source, interest, status, last_click, page, utm, notes)
    VALUES (${text(lead.id, 100)}, ${name}, ${email}, ${text(lead.phone, 50)}, ${text(lead.company, 200)},
            ${text(lead.source || "Website", 200)}, ${text(lead.interest, 200)}, ${status},
            ${text(lead.lastClick, 40)}, ${text(lead.page || "/", 300)}, ${text(lead.utm, 500)}, ${text(lead.notes)})
    ON CONFLICT (id) DO NOTHING`;

  // Website enquiries: acknowledge the visitor and alert the team (after the response is sent).
  if (viewer?.role !== "staff") {
    const kind = lead.page === "/tax/filing-request" ? "filing" : lead.page === "/contact" ? "contact" : null;
    if (kind) {
      const site = await siteUrl();
      const saved = { id: lead.id, name, email, phone: text(lead.phone, 50), company: text(lead.company, 200), interest: text(lead.interest, 200), notes: text(lead.notes) };
      after(() => notifyEnquiry(saved, kind, site));
    }
  }
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  await requireStaff();
  if (patch.status && !LEAD_STATUSES.includes(patch.status)) throw new Error("Unknown status");
  await db()`
    UPDATE leads SET
      status   = COALESCE(${patch.status ?? null}, status),
      notes    = COALESCE(${patch.notes ?? null}, notes),
      name     = COALESCE(${patch.name ?? null}, name),
      email    = COALESCE(${patch.email ?? null}, email),
      phone    = COALESCE(${patch.phone ?? null}, phone),
      company  = COALESCE(${patch.company ?? null}, company),
      interest = COALESCE(${patch.interest ?? null}, interest)
    WHERE id = ${id}`;
}

function deviceFrom(ua: string) {
  if (/iphone|ipad/i.test(ua)) return "iPhone / iPad";
  if (/android/i.test(ua)) return "Android";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Browser";
}

export async function recordClick(id: string, page: string, cta: string) {
  const h = await headers();
  let referrer = "direct";
  try {
    const ref = h.get("referer");
    if (ref) referrer = new URL(ref).hostname;
  } catch {}
  const city = decodeURIComponent(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity") ?? "") || "Unknown";
  await db()`
    INSERT INTO click_events (id, page, cta, referrer, device, city)
    VALUES (${text(id, 100)}, ${text(page, 300)}, ${text(cta, 200)}, ${referrer},
            ${deviceFrom(h.get("user-agent") ?? "")}, ${text(city, 100)})
    ON CONFLICT (id) DO NOTHING`;
}

// ── Booking through Cal.com ─────────────────────────────────────────────

/** Bookable Cal.com meeting types (public). */
export async function getMeetingTypes() {
  return getEventTypes();
}

/** Open start times for the next `days` days, grouped by date in the visitor's time zone. */
export async function getOpenTimes(eventTypeId: number, fromDate: string, days: number, timeZone: string) {
  const types = await getEventTypes();
  if (!types.some((t) => t.id === eventTypeId)) throw new Error("That meeting type isn’t available.");
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(start.getTime() + Math.min(Math.max(days, 1), 31) * 86_400_000);
  return getAvailability(eventTypeId, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), timeZone);
}

export type BookMeetingInput = {
  eventTypeId: number;
  start: string; // ISO with offset, from getOpenTimes
  timeZone: string;
  topic: string;
  notes?: string;
  /** Guests only (signed-out visitors). */
  guest?: { name: string; email: string; phone?: string; company?: string };
  /** Staff only: who the meeting is with. */
  leadId?: string;
  clientId?: string;
};

export type BookMeetingResult = { ok: true; appointment: Appointment } | { ok: false; error: string };

export async function bookMeeting(input: BookMeetingInput): Promise<BookMeetingResult> {
  try {
    const types = await getEventTypes();
    const type = types.find((t) => t.id === input.eventTypeId);
    if (!type) return { ok: false, error: "That meeting type isn’t available." };
    const topic = text(input.topic, 200) || type.title;
    const viewer = await getViewer();

    // Resolve who the attendee is from the signed-in role.
    let attendee: { name: string; email: string; phone?: string };
    let clientId: string | undefined;
    let leadId: string | undefined;

    if (viewer?.role === "client") {
      const [c] = await db()`SELECT id, name, email, phone FROM clients WHERE id = ${viewer.clientId}`;
      attendee = { name: c.name, email: c.email, phone: c.phone || undefined };
      clientId = c.id;
    } else if (viewer?.role === "staff" && (input.leadId || input.clientId)) {
      const [row] = input.clientId
        ? await db()`SELECT id, name, email, phone FROM clients WHERE id = ${input.clientId}`
        : await db()`SELECT id, name, email, phone FROM leads WHERE id = ${input.leadId!}`;
      if (!row) return { ok: false, error: "Couldn’t find that contact." };
      attendee = { name: row.name, email: row.email, phone: row.phone || undefined };
      if (input.clientId) clientId = row.id;
      else leadId = row.id;
    } else {
      const name = text(input.guest?.name, 200);
      const email = text(input.guest?.email, 320);
      if (!name || !isEmail(email)) return { ok: false, error: "Please add your name and a valid email." };
      attendee = { name, email, phone: text(input.guest?.phone, 50) || undefined };
      // Reuse an existing lead for this email, otherwise start one.
      const [existing] = await db()`SELECT id FROM leads WHERE lower(email) = lower(${email}) LIMIT 1`;
      leadId = existing?.id ?? `lead_${Date.now()}`;
      if (existing) {
        await db()`UPDATE leads SET status = 'consult booked', interest = ${topic} WHERE id = ${leadId}`;
      } else {
        await db()`
          INSERT INTO leads (id, name, email, phone, company, source, interest, status, last_click, page, utm, notes)
          VALUES (${leadId}, ${name}, ${email}, ${attendee.phone ?? ""}, ${text(input.guest?.company, 200)},
                  'Scheduler', ${topic}, 'consult booked', ${new Date().toISOString().slice(0, 16).replace("T", " ")},
                  '/book', 'cal.com', ${text(input.notes)})`;
      }
    }

    const booking = await createBooking({
      eventTypeId: type.id,
      start: input.start,
      attendee: { name: attendee.name, email: attendee.email, timeZone: text(input.timeZone, 64) || "America/Regina" },
      notes: [topic, text(input.notes, 1000)].filter(Boolean).join(" — "),
      metadata: { topic, ...(leadId ? { leadId } : {}), ...(clientId ? { clientId } : {}) },
    });

    const { date, time } = firmDateTime(booking.start);
    const appointment: Appointment = {
      id: `apt_cal_${booking.uid}`,
      clientId,
      leadId,
      name: attendee.name,
      email: attendee.email,
      topic,
      date,
      time,
      meetingUrl: meetingLink(booking),
      status: "scheduled",
      calUid: booking.uid,
      duration: booking.duration ?? type.length,
    };
    await db()`
      INSERT INTO appointments (id, client_id, lead_id, name, email, topic, date, time, meeting_url, status, cal_uid, start_at, duration)
      VALUES (${appointment.id}, ${clientId ?? null}, ${leadId ?? null}, ${appointment.name}, ${appointment.email},
              ${topic}, ${date}, ${time}, ${appointment.meetingUrl}, 'scheduled', ${booking.uid}, ${booking.start},
              ${appointment.duration ?? null})
      ON CONFLICT (cal_uid) DO NOTHING`;
    if (leadId && viewer?.role === "staff") {
      await db()`UPDATE leads SET status = 'consult booked' WHERE id = ${leadId}`;
    }
    const site = await siteUrl();
    const tz = text(input.timeZone, 64) || "America/Regina";
    after(() =>
      notifyBooking(
        { id: appointment.id, name: attendee.name, email: attendee.email, topic, startIso: booking.start, timeZone: tz, duration: appointment.duration, meetingUrl: appointment.meetingUrl },
        site,
      ),
    );
    return { ok: true, appointment };
  } catch (err) {
    console.error("bookMeeting failed:", err);
    const message = err instanceof Error ? err.message : "";
    return {
      ok: false,
      error: /no longer available|not available|already/i.test(message)
        ? "That time was just taken. Please pick another."
        : "We couldn’t book that time. Please try again or contact us.",
    };
  }
}

export async function cancelMeeting(id: string, reason = "Cancelled from Adept portal") {
  const viewer = await requireSignedIn();
  const [apt] = await db()`SELECT id, client_id, cal_uid FROM appointments WHERE id = ${id}`;
  if (!apt) throw new Error("Meeting not found");
  if (viewer.role === "client" && apt.client_id !== viewer.clientId) throw new Error("Not your meeting");
  if (apt.cal_uid) await cancelBooking(apt.cal_uid, text(reason, 300));
  await db()`UPDATE appointments SET status = 'cancelled' WHERE id = ${id}`;
}

export async function completeMeeting(id: string, summary: string, notes: string) {
  await requireStaff();
  await db()`UPDATE appointments SET status = 'completed', summary = ${text(summary)}, notes = ${text(notes)} WHERE id = ${id}`;
}

// ── Client portal (owner-scoped) ────────────────────────────────────────

export async function createDocument(doc: DocumentFile) {
  const viewer = await requireSignedIn();
  const clientId = viewer.role === "client" ? viewer.clientId : doc.clientId;
  if (doc.storageKey && viewer.role === "client" && !doc.storageKey.startsWith(`clients/${clientId}/`)) {
    throw new Error("Invalid file location");
  }
  await db()`
    INSERT INTO documents (id, client_id, name, kind, category, size, uploaded_at, storage_key)
    VALUES (${text(doc.id, 200)}, ${clientId}, ${text(doc.name, 300)}, ${doc.kind}, ${text(doc.category, 100)},
            ${text(doc.size, 20)}, ${doc.uploadedAt}, ${doc.storageKey ?? null})
    ON CONFLICT (id) DO NOTHING`;
}

/** Clients delete their own documents; staff can delete any. Removes the file from the bucket too. */
export async function deleteDocument(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireSignedIn();
  const [doc] = await db()`SELECT id, client_id, storage_key FROM documents WHERE id = ${id}`;
  if (!doc) return { ok: true };
  if (viewer.role === "client" && doc.client_id !== viewer.clientId) return { ok: false, error: "You can only delete your own documents." };
  if (doc.storage_key) {
    try {
      await deleteObject(doc.storage_key);
    } catch (err) {
      console.error("Bucket delete failed:", err);
      return { ok: false, error: "We couldn’t remove the file right now. Please try again." };
    }
  }
  await db()`DELETE FROM documents WHERE id = ${id}`;
  return { ok: true };
}

export async function createMessage(msg: ThreadMessage & { clientId: string }) {
  const viewer = await requireSignedIn();
  const body = text(msg.body);
  if (!body) return;
  const clientId = viewer.role === "client" ? viewer.clientId : msg.clientId;
  const author = viewer.role === "client" ? "client" : "adept";
  await db()`
    INSERT INTO messages (id, client_id, author, body, at)
    VALUES (${text(msg.id, 100)}, ${clientId}, ${author}, ${body}, ${msg.at})
    ON CONFLICT (id) DO NOTHING`;
}

export async function completeForm(id: string) {
  const viewer = await requireSignedIn();
  if (viewer.role === "client") {
    await db()`UPDATE forms SET status = 'completed' WHERE id = ${id} AND client_id = ${viewer.clientId}`;
  } else {
    await db()`UPDATE forms SET status = 'completed' WHERE id = ${id}`;
  }
}

// ── Studio: proposals, jobs, follow-ups ────────────────────────────────

export async function createProposal(p: Proposal) {
  await requireStaff();
  await db()`
    INSERT INTO proposals (id, client_id, lead_id, title, amount, status, sent_at, accepted_at)
    VALUES (${p.id}, ${p.clientId ?? null}, ${p.leadId ?? null}, ${text(p.title, 300)}, ${text(p.amount, 100)},
            ${p.status}, ${p.sentAt ?? null}, ${p.acceptedAt ?? null})
    ON CONFLICT (id) DO NOTHING`;
}

export async function sendProposal(id: string, sentAt: string) {
  await requireStaff();
  await db()`UPDATE proposals SET status = 'sent', sent_at = ${sentAt} WHERE id = ${id}`;
}

export async function acceptProposal(id: string, acceptedAt: string) {
  await requireStaff();
  await db()`UPDATE proposals SET status = 'accepted', accepted_at = ${acceptedAt} WHERE id = ${id}`;
}

export async function createJob(job: Job) {
  await requireStaff();
  await db()`
    INSERT INTO jobs (id, client_id, title, status, completed_at, review_status, reminders)
    VALUES (${job.id}, ${job.clientId}, ${text(job.title, 300)}, ${job.status}, ${job.completedAt ?? null},
            ${job.reviewStatus}, ${job.reminders})
    ON CONFLICT (id) DO NOTHING`;
}

export async function completeJob(id: string, completedAt: string) {
  await requireStaff();
  await db()`
    UPDATE jobs SET status = 'completed', completed_at = ${completedAt}, review_status = 'sent', reminders = 1
    WHERE id = ${id}`;
}

export async function remindReview(id: string) {
  await requireStaff();
  await db()`UPDATE jobs SET review_status = 'reminded', reminders = reminders + 1 WHERE id = ${id}`;
}

export async function createFollowUp(item: FollowUp) {
  await requireStaff();
  const channel = item.channel === "sms" ? "sms" : "email";
  await db()`
    INSERT INTO follow_ups (id, lead_id, channel, subject, body, scheduled_for, status)
    VALUES (${item.id}, ${item.leadId}, ${channel}, ${text(item.subject, 300)}, ${text(item.body)}, ${item.scheduledFor}, 'queued')
    ON CONFLICT (id) DO NOTHING`;
  // If it's already due, send it straight away.
  after(() => processDueFollowUps());
}

export async function updateFollowUp(id: string, patch: Partial<FollowUp>) {
  await requireStaff();
  await db()`
    UPDATE follow_ups SET
      lead_id       = COALESCE(${patch.leadId ?? null}, lead_id),
      channel       = COALESCE(${patch.channel ?? null}, channel),
      subject       = COALESCE(${patch.subject ? text(patch.subject, 300) : null}, subject),
      body          = COALESCE(${patch.body !== undefined ? text(patch.body) : null}, body),
      scheduled_for = COALESCE(${patch.scheduledFor ?? null}::timestamp, scheduled_for),
      status        = CASE WHEN status = 'failed' THEN 'queued' ELSE status END,
      error         = NULL
    WHERE id = ${id} AND status <> 'sent'`;
  after(() => processDueFollowUps());
}

export async function deleteFollowUp(id: string) {
  await requireStaff();
  await db()`DELETE FROM follow_ups WHERE id = ${id}`;
}

/** Email follow-ups are delivered now; SMS has no provider, so it is marked done manually. */
export async function sendFollowUp(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const [row] = await db()`SELECT channel FROM follow_ups WHERE id = ${id}`;
  if (!row) return { ok: false, error: "Follow-up not found" };
  if (row.channel === "sms") {
    await db()`UPDATE follow_ups SET status = 'sent', sent_at = now(), error = NULL WHERE id = ${id}`;
    return { ok: true };
  }
  const result = await sendFollowUpNow(id);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

// ── Studio: testimonials (public content → refresh the cache) ──────────

export async function createTestimonial(t: Testimonial) {
  await requireStaff();
  await db()`
    INSERT INTO testimonials (id, name, role, quote, featured)
    VALUES (${t.id}, ${text(t.name, 200)}, ${text(t.role, 200)}, ${text(t.quote)}, ${t.featured})
    ON CONFLICT (id) DO NOTHING`;
  updateTag(TAGS.testimonials);
}

export async function updateTestimonial(id: string, patch: Partial<Testimonial>) {
  await requireStaff();
  await db()`
    UPDATE testimonials SET
      name     = COALESCE(${patch.name ?? null}, name),
      role     = COALESCE(${patch.role ?? null}, role),
      quote    = COALESCE(${patch.quote ?? null}, quote),
      featured = COALESCE(${patch.featured ?? null}::boolean, featured)
    WHERE id = ${id}`;
  updateTag(TAGS.testimonials);
}

export async function deleteTestimonial(id: string) {
  await requireStaff();
  await db()`DELETE FROM testimonials WHERE id = ${id}`;
  updateTag(TAGS.testimonials);
}

// ── Studio: CRUD ───────────────────────────────────────────────────────

export async function deleteLead(id: string) {
  await requireStaff();
  await db()`DELETE FROM follow_ups WHERE lead_id = ${id}`;
  await db()`UPDATE appointments SET lead_id = NULL WHERE lead_id = ${id}`;
  await db()`DELETE FROM proposals WHERE lead_id = ${id} AND client_id IS NULL`;
  await db()`UPDATE click_events SET lead_id = NULL WHERE lead_id = ${id}`;
  await db()`DELETE FROM leads WHERE id = ${id}`;
}

const CLIENT_TYPES = ["Individual", "Sole proprietor", "Corporation"];

export async function createClient(c: Client): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const email = text(c.email, 320);
  if (!text(c.name) || !isEmail(email)) return { ok: false, error: "Name and a valid email are required." };
  const [dupe] = await db()`SELECT id FROM clients WHERE lower(email) = lower(${email})`;
  if (dupe) return { ok: false, error: "A client with this email already exists." };
  await db()`
    INSERT INTO clients (id, name, company, email, phone, type, since)
    VALUES (${text(c.id, 100)}, ${text(c.name, 200)}, ${text(c.company, 200)}, ${email}, ${text(c.phone, 50)},
            ${CLIENT_TYPES.includes(c.type) ? c.type : "Individual"}, COALESCE(${c.since || null}::date, current_date))`;
  return { ok: true };
}

export async function updateClient(id: string, patch: Partial<Client>) {
  await requireStaff();
  if (patch.email && !isEmail(patch.email)) throw new Error("Invalid email");
  if (patch.type && !CLIENT_TYPES.includes(patch.type)) throw new Error("Invalid client type");
  await db()`
    UPDATE clients SET
      name    = COALESCE(${patch.name ? text(patch.name, 200) : null}, name),
      company = COALESCE(${patch.company !== undefined ? text(patch.company, 200) : null}, company),
      email   = COALESCE(${patch.email ? text(patch.email, 320) : null}, email),
      phone   = COALESCE(${patch.phone !== undefined ? text(patch.phone, 50) : null}, phone),
      type    = COALESCE(${patch.type ?? null}, type)
    WHERE id = ${id}`;
}

/** Staff: permanently removes the client, their files, bookings and portal login. */
export async function deleteClient(id: string) {
  await requireStaff();
  const result = await purgeClient(id, "Client account closed by Adept");
  if (!result.ok) throw new Error(result.error);
}

/** Client: permanently deletes their own account. Requires typing DELETE. */
export async function deleteMyAccount(confirmation: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireSignedIn();
  if (viewer.role !== "client") return { ok: false, error: "Staff accounts can’t be deleted here." };
  if (confirmation.trim().toUpperCase() !== "DELETE") return { ok: false, error: "Type DELETE to confirm." };
  const [client] = await db()`SELECT name FROM clients WHERE id = ${viewer.clientId}`;
  const result = await purgeClient(viewer.clientId, "Client closed their Adept account");
  if (!result.ok) return { ok: false, error: "We couldn’t delete your account. Please contact us." };
  const site = await siteUrl();
  after(() => notifyAccountDeleted({ name: client?.name || viewer.name, email: viewer.email }, site));
  return { ok: true };
}

const PROPOSAL_STATUSES = ["draft", "sent", "viewed", "accepted", "declined"];

export async function updateProposal(id: string, patch: Partial<Proposal>) {
  await requireStaff();
  if (patch.status && !PROPOSAL_STATUSES.includes(patch.status)) throw new Error("Unknown status");
  await db()`
    UPDATE proposals SET
      title  = COALESCE(${patch.title ? text(patch.title, 300) : null}, title),
      amount = COALESCE(${patch.amount ? text(patch.amount, 100) : null}, amount),
      status = COALESCE(${patch.status ?? null}, status)
    WHERE id = ${id}`;
}

export async function deleteProposal(id: string) {
  await requireStaff();
  await db()`DELETE FROM proposals WHERE id = ${id}`;
}
