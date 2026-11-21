import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { db } from "./db";
import { firmDateTime, listBookings, meetingLink } from "./cal";
import type {
  Appointment,
  ClickEvent,
  Client,
  DocumentFile,
  FollowUp,
  Firm,
  FormTask,
  Job,
  Lead,
  Proposal,
  TaxDeadline,
  Testimonial,
  ThreadMessage,
} from "./types";

/** Cache tags for public content. Server actions call updateTag() with these after edits. */
export const TAGS = {
  firm: "firm",
  deadlines: "tax-deadlines",
  testimonials: "testimonials",
} as const;

/** Postgres NULL → undefined so rows match the optional fields in lib/types. */
function clean<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map(
    (row) => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null)) as T,
  );
}

// ── Public content (cached, part of the static shell) ────────────────────

export async function getFirm(): Promise<Firm> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.firm);
  const rows = await db()`SELECT value FROM site_settings WHERE key = 'firm'`;
  return rows[0]?.value as Firm;
}

export async function getTaxDeadlines(): Promise<TaxDeadline[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.deadlines);
  const rows = await db()`SELECT title, lines FROM tax_deadlines ORDER BY position, id`;
  return rows as TaxDeadline[];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.testimonials);
  const rows = await db()`
    SELECT id, name, role, quote, featured FROM testimonials ORDER BY created_at DESC`;
  return rows as Testimonial[];
}


// ── Private portal data (per request, never cached or sent to public pages) ──

async function getLeads() {
  return clean<Lead>(await db()`
    SELECT id, name, email, phone, company, source, interest, status,
           last_click AS "lastClick", page, utm, notes,
           to_char(created_at, 'YYYY-MM-DD') AS "createdAt"
    FROM leads ORDER BY created_at DESC, id`);
}

async function getClients() {
  return clean<Client>(await db()`
    SELECT id, name, company, email, phone, type, to_char(since, 'YYYY-MM-DD') AS since
    FROM clients ORDER BY since, id`);
}

async function getDocuments(clientId?: string) {
  return clean<DocumentFile>(await db()`
    SELECT id, client_id AS "clientId", name, kind, category, size,
           to_char(uploaded_at, 'YYYY-MM-DD') AS "uploadedAt", storage_key AS "storageKey"
    FROM documents
    WHERE ${clientId ?? null}::text IS NULL OR client_id = ${clientId ?? null}
    ORDER BY uploaded_at DESC, id DESC`);
}

async function getForms(clientId?: string) {
  return clean<FormTask>(await db()`
    SELECT id, client_id AS "clientId", title, to_char(due, 'YYYY-MM-DD') AS due, status
    FROM forms
    WHERE ${clientId ?? null}::text IS NULL OR client_id = ${clientId ?? null}
    ORDER BY due DESC, id`);
}

async function getMessages(clientId?: string) {
  return clean<ThreadMessage>(await db()`
    SELECT id, client_id AS "clientId", author, body, to_char(at, 'YYYY-MM-DD HH24:MI') AS at
    FROM messages
    WHERE ${clientId ?? null}::text IS NULL OR client_id = ${clientId ?? null}
    ORDER BY at, id`);
}

async function getAppointments(clientId?: string) {
  return clean<Appointment>(await db()`
    SELECT id, client_id AS "clientId", lead_id AS "leadId", name, email, topic,
           to_char(date, 'YYYY-MM-DD') AS date, time, meeting_url AS "meetingUrl",
           status, summary, notes, cal_uid AS "calUid", duration
    FROM appointments
    WHERE ${clientId ?? null}::text IS NULL OR client_id = ${clientId ?? null}
    ORDER BY date DESC, time DESC`);
}

async function getProposals() {
  return clean<Proposal>(await db()`
    SELECT id, client_id AS "clientId", lead_id AS "leadId", title, amount, status,
           to_char(sent_at, 'YYYY-MM-DD') AS "sentAt",
           to_char(accepted_at, 'YYYY-MM-DD') AS "acceptedAt"
    FROM proposals ORDER BY created_at DESC, id`);
}

async function getJobs() {
  return clean<Job>(await db()`
    SELECT id, client_id AS "clientId", title, status,
           to_char(completed_at, 'YYYY-MM-DD') AS "completedAt",
           review_status AS "reviewStatus", reminders
    FROM jobs ORDER BY created_at DESC, id`);
}

async function getFollowUps() {
  return clean<FollowUp>(await db()`
    SELECT id, lead_id AS "leadId", channel, subject,
           to_char(scheduled_for, 'YYYY-MM-DD HH24:MI') AS "scheduledFor", status, body,
           to_char(sent_at AT TIME ZONE 'America/Regina', 'YYYY-MM-DD HH24:MI') AS "sentAt", error
    FROM follow_ups ORDER BY scheduled_for, id`);
}

async function getClicks() {
  return clean<ClickEvent>(await db()`
    SELECT id, to_char(at, 'YYYY-MM-DD HH24:MI') AS at, page, cta, referrer, device, city,
           lead_id AS "leadId"
    FROM click_events ORDER BY at DESC LIMIT 500`);
}

/**
 * Pulls bookings made directly on cal.com (or rescheduled/cancelled there) into Neon,
 * so the Studio calendar is complete. Best-effort: Studio still loads if Cal.com is down.
 */
async function syncCalBookings() {
  try {
    const [upcoming, cancelled] = await Promise.all([listBookings("upcoming"), listBookings("cancelled", 50)]);
    for (const b of upcoming) {
      const { date, time } = firmDateTime(b.start);
      const who = b.attendees[0] ?? { name: "Cal.com guest", email: "" };
      await db()`
        INSERT INTO appointments (id, name, email, topic, date, time, meeting_url, status, cal_uid, start_at, duration)
        VALUES (${`apt_cal_${b.uid}`}, ${who.name}, ${who.email}, ${b.metadata?.topic || b.title}, ${date}, ${time},
                ${meetingLink(b)}, 'scheduled', ${b.uid}, ${b.start}, ${b.duration})
        ON CONFLICT (cal_uid) DO UPDATE SET date = EXCLUDED.date, time = EXCLUDED.time,
          start_at = EXCLUDED.start_at, meeting_url = EXCLUDED.meeting_url`;
    }
    const gone = cancelled.map((b) => b.uid);
    if (gone.length) {
      await db()`UPDATE appointments SET status = 'cancelled' WHERE cal_uid = ANY(${gone}) AND status <> 'cancelled'`;
    }
  } catch (err) {
    console.error("Cal.com sync skipped:", err);
  }
}

/** Everything the Studio (practice owner) workspace needs. */
export async function getStudioData() {
  await connection();
  await syncCalBookings();
  const [leads, clients, documents, forms, messages, appointments, proposals, jobs, followUps, clicks, testimonials] =
    await Promise.all([
      getLeads(),
      getClients(),
      getDocuments(),
      getForms(),
      getMessages(),
      getAppointments(),
      getProposals(),
      getJobs(),
      getFollowUps(),
      getClicks(),
      getTestimonials(),
    ]);
  return { leads, clients, documents, forms, messages, appointments, proposals, jobs, followUps, clicks, testimonials };
}

export async function findClientByEmail(email: string): Promise<Client | undefined> {
  const rows = clean<Client>(await db()`
    SELECT id, name, company, email, phone, type, to_char(since, 'YYYY-MM-DD') AS since
    FROM clients WHERE lower(email) = lower(${email}) LIMIT 1`);
  return rows[0];
}

/** Only the signed-in client's own records. */
export async function getClientPortalData(clientId: string) {
  await connection();
  const [clientRows, documents, forms, messages, appointments] = await Promise.all([
    db()`SELECT id, name, company, email, phone, type, to_char(since, 'YYYY-MM-DD') AS since
         FROM clients WHERE id = ${clientId}`,
    getDocuments(clientId),
    getForms(clientId),
    getMessages(clientId),
    getAppointments(clientId),
  ]);
  return { clients: clean<Client>(clientRows), documents, forms, messages, appointments };
}
